import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Kysely } from 'kysely'
import type { Board, Database } from '../db/database'
import { KYSELY } from '../db/db.module'

export const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

@Injectable()
export class LeaderboardsService {
    constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

    async getBoard(board: Board, limit = DEFAULT_LIMIT, offset = 0) {
        return this.db.selectFrom((eb) =>
            eb
                .selectFrom('runs as r')
                .selectAll()
                .where('r.status', '=', 'complete')
                .where('r.fc_count', '>', 0)
                .where('r.resolved_board', '=', board)
                .distinctOn('user_id')
                .orderBy('user_id')
                .orderBy('r.fc_count', 'desc')
                .orderBy('r.avg_fc_score', 'desc')
                .orderBy('r.ended_at', 'asc')
                .as('r')
        )
    }

    async getRun(runId: number) {
        const run = await this.db
            .selectFrom('runs as r')
            .innerJoin('users as u', 'u.osu_user_id', 'r.user_id')
            .select([
                'r.id',
                'r.user_id',
                'u.username',
                'r.seed',
                'r.pool_version',
                'r.declared_mode',
                'r.resolved_board',
                'r.fc_count',
                'r.active_elapsed',
                'r.started_at',
                'r.ended_at',
                'r.truncated_at_index',
                'r.truncation_reason'
            ])
            .where('r.id', '=', runId)
            .where('r.status', '=', 'complete')
            .executeTakeFirst()

        if (!run) {
            throw new NotFoundException('run not found')
        }

        const maps = await this.db
            .selectFrom('run_maps as rm')
            .innerJoin('pool_sets as ps', 'ps.beatmapset_id', 'rm.set_id')
            .select([
                'rm.seq_index',
                'rm.map_id',
                'rm.set_id',
                'rm.claimed_outcome',
                'rm.outcome',
                'rm.confirmed',
                'rm.original_star_rating',
                'rm.difficulty_name',
                'rm.total_length',
                'rm.map_max_combo',
                'rm.mods',
                'rm.score_max_combo',
                'rm.confirmed_score_id',
                'rm.total_score',
                'rm.served_at',
                'rm.score_started_at',
                'rm.score_ended_at',
                'ps.artist',
                'ps.artist_unicode',
                'ps.title',
                'ps.title_unicode',
                'ps.creator',
                'ps.bpm',
                'ps.cover_updated_at',
                'ps.nsfw'
            ])
            .where('rm.run_id', '=', runId)
            .orderBy('rm.seq_index')
            .execute()

        return { run, maps }
    }
}
