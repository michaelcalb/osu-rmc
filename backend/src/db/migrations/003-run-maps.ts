import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('run_maps')
        .addColumn('run_id', 'integer', (col) =>
            col.notNull().references('runs.id').onDelete('cascade')
        )
        .addColumn('seq_index', 'integer', (col) => col.notNull())
        .addColumn('map_id', 'integer', (col) => col.notNull())
        .addColumn('set_id', 'integer', (col) => col.notNull())
        .addColumn('served_at', 'timestamptz', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('outcome', 'text', (col) =>
            col.notNull().defaultTo('unjudged')
        )
        .addColumn('confirmed', 'boolean', (col) =>
            col.notNull().defaultTo(false)
        )
        .addColumn('original_star_rating', 'double precision', (col) => col.notNull())
        .addColumn('hit_length', 'integer', (col) => col.notNull())
        .addColumn('total_length', 'integer', (col) => col.notNull())
        .addColumn('map_max_combo', 'integer')
        .addColumn('statistics', 'jsonb')
        .addColumn('maximum_statistics', 'jsonb')
        .addColumn('mods', 'jsonb')
        .addColumn('confirmed_score_id', 'bigint')
        .addColumn('score_max_combo', 'integer')
        .addColumn('score_started_at', 'timestamptz')
        .addColumn('score_ended_at', 'timestamptz')
        .addPrimaryKeyConstraint('run_maps_pkey', ['run_id', 'seq_index'])
        .addCheckConstraint(
            'run_maps_outcome_check',
            sql`outcome in ('unjudged', 'fc', 'a_skip', 'free_skip', 'unplayable', 'incomplete_final')`
        )
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('run_maps').execute()
}