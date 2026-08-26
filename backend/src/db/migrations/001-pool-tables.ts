import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('pool_versions')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('created_at', 'timestamptz', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('map_count', 'integer', (col) => col.notNull())
        .execute()

    await db.schema
        .createTable('pool_sets')
        .addColumn('beatmapset_id', 'integer', (col) => col.primaryKey())
        .addColumn('artist', 'text', (col) => col.notNull())
        .addColumn('artist_unicode', 'text')
        .addColumn('title', 'text', (col) => col.notNull())
        .addColumn('title_unicode', 'text')
        .addColumn('creator', 'text', (col) => col.notNull())
        .addColumn('bpm', 'double precision')
        .addColumn('cover_updated_at', 'timestamptz')
        .addColumn('nsfw', 'boolean', (col) => col.notNull())
        .execute()

    await db.schema
        .createTable('pool_maps')
        .addColumn('map_id', 'integer', (col) => col.notNull())
        .addColumn('set_id', 'integer', (col) =>
            col.notNull().references('pool_sets.beatmapset_id')
        )
        .addColumn('star_rating', 'double precision', (col) => col.notNull())
        .addColumn('hit_length', 'integer', (col) => col.notNull())
        .addColumn('total_length', 'integer', (col) => col.notNull())
        .addColumn('added_in_version', 'integer', (col) =>
            col.notNull().references('pool_versions.id')
        )
        .addColumn('removed_in_version', 'integer', (col) =>
            col.references('pool_versions.id')
        )
        .addColumn('max_combo', 'integer')
        .addPrimaryKeyConstraint('pool_maps_pkey', [
            'map_id',
            'added_in_version'
        ])
        .execute()

    await db.schema
        .createIndex('pool_maps_star_rating_idx')
        .on('pool_maps')
        .column('star_rating')
        .execute()
    
    await db.schema
        .createIndex('pool_maps_open_interval_idx')
        .on('pool_maps')
        .column('map_id')
        .unique()
        .where(sql.ref('removed_in_version'), 'is', null)
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('pool_maps').execute()
    await db.schema.dropTable('pool_sets').execute()
    await db.schema.dropTable('pool_versions').execute()
}
