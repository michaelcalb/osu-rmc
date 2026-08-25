import 'dotenv/config'
import { createReadStream } from 'node:fs'
import * as path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Client } from 'pg'
import { from as copyFrom } from 'pg-copy-streams'

const MAX_DELTA_RATIO = 0.05
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
            hit_length integer,
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