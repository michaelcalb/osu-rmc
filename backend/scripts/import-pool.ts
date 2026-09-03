import 'dotenv/config'
import { createReadStream } from 'node:fs'
import * as path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Client } from 'pg'
import { from as copyFrom } from 'pg-copy-streams'

const MAX_DELTA_RATIO = 0.02
const DATA_DIR = path.join(__dirname, '..', '..', 'untracked')

async function createStagingTables(client: Client) {
    await client.query(`
        CREATE TEMP TABLE staging_sets (
            beatmapset_id integer,
            artist text,
            artist_unicode text,
            title text,
            title_unicode text,
            creator text,
            bpm double precision,
            cover_updated_at timestamptz,
            nsfw boolean
        ) ON COMMIT DROP
    `)

    await client.query(`
        CREATE TEMP TABLE staging_maps (
            map_id integer,
            set_id integer,
            star_rating double precision,
            difficulty_name text,
            hit_length integer,
            total_length integer,
            max_combo integer
        ) ON COMMIT DROP
    `)
}

async function copyInto(
    client: Client,
    table: string,
    fileName: string
): Promise<number> {
    const stream = client.query(copyFrom(`COPY ${table} FROM STDIN`))

    await pipeline(createReadStream(path.join(DATA_DIR, fileName)), stream)

    return stream.rowCount
}

async function createPoolVersion(
    client: Client,
    mapCount: number
): Promise<number> {
    const result = await client.query<{ id: number }>(
        'INSERT INTO pool_versions (map_count) VALUES ($1) RETURNING id',
        [mapCount]
    )

    return result.rows[0].id
}

async function upsertSets(client: Client): Promise<number> {
    const result = await client.query(`
        INSERT INTO pool_sets (
            beatmapset_id, artist, artist_unicode, title, title_unicode, creator, bpm, cover_updated_at, nsfw
        )
        SELECT
            beatmapset_id, artist, artist_unicode, title, title_unicode, creator, bpm, cover_updated_at, nsfw
        FROM staging_sets
        ON CONFLICT (beatmapset_id) DO UPDATE SET
            artist = EXCLUDED.artist,
            artist_unicode = EXCLUDED.artist_unicode,
            title = EXCLUDED.title,
            title_unicode = EXCLUDED.title_unicode,
            creator = EXCLUDED.creator,
            bpm = EXCLUDED.bpm,
            cover_updated_at = EXCLUDED.cover_updated_at,
            nsfw = EXCLUDED.nsfw
    `)

    return result.rowCount ?? 0
}

async function countOpenMaps(client: Client): Promise<number> {
    const result = await client.query<{ count: number }>(
        'SELECT COUNT(*)::int AS count FROM pool_maps WHERE removed_in_version IS NULL'
    )

    return result.rows[0].count
}

async function markRemovedMaps(
    client: Client,
    version: number
): Promise<number> {
    const result = await client.query(
        `
        UPDATE pool_maps p
        SET removed_in_version = $1
        WHERE p.removed_in_version IS NULL
            AND NOT EXISTS (
                SELECT 1 FROM staging_maps s WHERE s.map_id = p.map_id
            )
        `,
        [version]
    )

    return result.rowCount ?? 0
}

async function insertNewMaps(
    client: Client,
    version: number
): Promise<number> {
    const result = await client.query(
        `
        INSERT INTO pool_maps (
            map_id, set_id, star_rating, difficulty_name, hit_length, total_length, max_combo, added_in_version
        )
        SELECT s.map_id, s.set_id, s.star_rating, s.difficulty_name, s.hit_length, s.total_length, s.max_combo, $1
        FROM staging_maps s
        WHERE NOT EXISTS (
            SELECT 1 FROM pool_maps p
            WHERE p.map_id = s.map_id AND p.removed_in_version IS NULL
        )
        `,
        [version]
    )

    return result.rowCount ?? 0
}

async function updateOpenMaps(client: Client): Promise<number> {
    const result = await client.query(`
        UPDATE pool_maps p
        SET star_rating = s.star_rating,
            difficulty_name = s.difficulty_name,
            hit_length = s.hit_length,
            total_length = s.total_length,
            max_combo = s.max_combo
        FROM staging_maps s
        WHERE p.map_id = s.map_id
            AND p.removed_in_version IS NULL
            AND (
                p.star_rating IS DISTINCT FROM s.star_rating
                OR p.difficulty_name IS DISTINCT FROM s.difficulty_name
                OR p.hit_length IS DISTINCT FROM s.hit_length
                OR p.total_length IS DISTINCT FROM s.total_length
                OR p.max_combo IS DISTINCT FROM s.max_combo
            )    
    `)

    return result.rowCount ?? 0
}

function assertDeltaWithinLimit(
    baseline: number,
    added: number,
    removed: number
) {
    if (baseline === 0) {
        console.log('first import (delta guard skipped)')
        return
    }

    const churn = (added + removed) / baseline
    const pct = (churn * 100).toFixed(2)
    const limit = (MAX_DELTA_RATIO * 100).toFixed(0)

    if (churn > MAX_DELTA_RATIO) {
        throw new Error(
            `delta guard tripped: ${added} added + ${removed} removed = ${pct}% of ${baseline} maps (limit ${limit}%)`
        )
    }

    console.log(`delta ${pct}% (within ${limit}% limit)`)
}

async function main() {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        throw new Error('DATABASE_URL is not set')
    }

    const client = new Client({ connectionString })
    await client.connect()

    try {
        await client.query('BEGIN')
        await client.query("SET LOCAL TIME ZONE 'UTC'")

        await createStagingTables(client)

        const setCount = await copyInto(client, 'staging_sets', 'pool_sets.tsv')
        const mapCount = await copyInto(client, 'staging_maps', 'pool_maps.tsv')

        console.log(`staged ${setCount} sets, ${mapCount} maps`)

        const version = await createPoolVersion(client, mapCount)
        const setsWritten = await upsertSets(client)

        console.log(`pool_version ${version}, ${setsWritten} sets written`)

        const baseline = await countOpenMaps(client)
        const removed = await markRemovedMaps(client, version)
        const added = await insertNewMaps(client, version)
        const updated = await updateOpenMaps(client)

        console.log(
            `maps: ${added} added, ${removed} removed, ${updated} updated (was ${baseline})`
        )

        assertDeltaWithinLimit(baseline, added, removed)

        await client.query('COMMIT')
        console.log('import commited')
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {})
        throw err
    } finally {
        await client.end()
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})