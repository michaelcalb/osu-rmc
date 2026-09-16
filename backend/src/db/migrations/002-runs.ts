import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('users')
        .addColumn('osu_user_id', 'integer', (col) => col.primaryKey())
        .addColumn('username', 'text', (col) => col.notNull())
        .execute()

    await db.schema
        .createTable('runs')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('user_id', 'integer', (col) =>
            col.notNull().references('users.osu_user_id')
        )
        .addColumn('seed', 'text', (col) => col.notNull().unique())
        .addColumn('pool_version', 'integer', (col) =>
            col.notNull().references('pool_versions.id')
        )
        .addColumn('declared_mode', 'text', (col) => col.notNull())
        .addColumn('resolved_sequence', 'jsonb', (col) => col.notNull())
        .addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
        .addColumn('started_at', 'timestamptz', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('ended_at', 'timestamptz')
        .addColumn('validating_since', 'timestamptz')
        .addColumn('validation_requested_at', 'timestamptz')
        .addColumn('active_elapsed', 'integer', (col) =>
            col.notNull().defaultTo(0)
        )
        .addColumn('phase', 'text', (col) =>
            col.notNull().defaultTo('download')
        )
        .addColumn('phase_since', 'timestamptz', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('free_skip_used', 'boolean', (col) =>
            col.notNull().defaultTo(false)
        )
        .addColumn('fc_count', 'integer')
        .addColumn('avg_fc_score', 'double precision')
        .addColumn('resolved_board', 'text')
        .addColumn('truncated_at_index', 'integer')
        .addColumn('truncation_reason', 'text')
        .addCheckConstraint(
            'runs_declared_mode_check',
            sql`declared_mode in ('no_mod', 'free_mod')`
        )
        .addCheckConstraint(
            'runs_status_check',
            sql`status in ('active', 'pending_final', 'validating', 'complete', 'void', 'abandoned')`
        )
        .addCheckConstraint(
            'runs_phase_check',
            sql`phase in ('download', 'running')`
        )
        .addCheckConstraint(
            'runs_resolved_board_check',
            sql`resolved_board is null or resolved_board in ('no_mod', 'free_mod')`
        )
        .addCheckConstraint(
            'runs_truncation_reason_check',
            sql`truncation_reason is null or truncation_reason in ('banned_mod', 'over_limit', 'missing_score', 'rejected_unplayable', 'not_qualifying')`
        )
        .addCheckConstraint(
            'runs_truncation_pair_check',
            sql`(truncated_at_index is null) = (truncation_reason is null)`
        )
        .execute()

    await db.schema
        .createIndex('runs_user_id_idx')
        .on('runs')
        .column('user_id')
        .execute()

    await db.schema
        .createIndex('runs_one_active_per_user_idx')
        .on('runs')
        .column('user_id')
        .unique()
        .where(sql.ref('status'), '=', 'active')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('runs').execute()
    await db.schema.dropTable('users').execute()
}
