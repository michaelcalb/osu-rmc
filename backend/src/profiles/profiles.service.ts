import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Kysely, sql } from 'kysely'
import { BOARDS, type Board, type Database } from '../db/database'
import { KYSELY } from '../db/db.module'

@Injectable()
export class ProfilesService {
    constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

    async getProfile(osuUserId: number) {
        const user = await this.db
            .selectFrom('users')
            .select(['osu_user_id', 'username'])
            .where('osu_user_id', '=', osuUserId)
            .executeTakeFirst()

        if (!user) {
            throw new NotFoundException('user not found')
        }

        const totals = await this.db
            .selectFrom('runs')
            .select((eb) => [
                eb.fn.countAll<number>().as('runs'),
                eb.fn.sum<number>('fc_count').as('fcs'),
                eb.fn.sum<number>('active_elapsed').as('elapsed'),
                eb.fn
                    .countAll<number>()
                    .filterWhere('resolved_board', '=', 'no_mod')
                    .as('noModRuns'),
                eb.fn
                    .countAll<number>()
                    .filterWhere('resolved_board', '=', 'free_mod')
                    .as('freeModRuns'),
                sql<
                    number | null
                >`sum(avg_fc_accuracy * fc_count) / nullif(sum(fc_count), 0)`.as(
                    'accuracy'
                )
            ])
            .where('user_id', '=', osuUserId)
            .where('status', '=', 'complete')
            .executeTakeFirstOrThrow()

        const boards = await Promise.all(
            BOARDS.map((board) => this.getBest(osuUserId, board))
        )

        return {
            user,
            completedRuns: Number(totals.runs),
            totalFcs: Number(totals.fcs),
            totalElapsed: Number(totals.elapsed),
            runsByBoard: {
                no_mod: Number(totals.noModRuns),
                free_mod: Number(totals.freeModRuns)
            },
            accuracy: totals.accuracy,
            boards
        }
    }

    private async getBest(osuUserId: number, board: Board) {
        const best = await this.db
            .selectFrom('runs')
            .select([
                'id',
                'fc_count',
                'avg_fc_score',
                'ended_at',
                'pool_version'
            ])
            .where('user_id', '=', osuUserId)
            .where('status', '=', 'complete')
            .where('fc_count', '>', 0)
            .where('resolved_board', '=', board)
            .orderBy('fc_count', 'desc')
            .orderBy('avg_fc_score', 'desc')
            .orderBy('ended_at', 'asc')
            .limit(1)
            .executeTakeFirst()

        const fcCount = best?.fc_count ?? null
        const avgScore = best?.avg_fc_score ?? null
        const endedAt = best?.ended_at ?? null

        if (
            !best ||
            fcCount === null ||
            avgScore === null ||
            endedAt === null
        ) {
            return { board, best: null, rank: null }
        }

        const ahead = await this.db
            .selectFrom('runs')
            .select((eb) =>
                eb.fn.count<number>('user_id').distinct().as('count')
            )
            .where('status', '=', 'complete')
            .where('fc_count', '>', 0)
            .where('resolved_board', '=', board)
            .where((eb) =>
                eb.or([
                    eb('fc_count', '>', fcCount),
                    eb.and([
                        eb('fc_count', '=', fcCount),
                        eb('avg_fc_score', '>', avgScore)
                    ]),
                    eb.and([
                        eb('fc_count', '=', fcCount),
                        eb('avg_fc_score', '=', avgScore),
                        eb('ended_at', '<', endedAt)
                    ])
                ])
            )
            .executeTakeFirstOrThrow()

        return { board, best, rank: Number(ahead.count) + 1 }
    }
}
