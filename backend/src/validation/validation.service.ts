import { Inject, Injectable } from '@nestjs/common'
import { Kysely } from 'kysely'
import type { Database } from '../db/database'
import { KYSELY } from '../db/db.module'
import { OsuService } from '../osu/osu.service'
import { chargeSequence, type TimedMap } from './charging'
import { matchScore } from './matching'
import { unplayableClaimUpheld } from './predicates'
import { judgeRun, RunVerdict, type Position } from './verdict'
import { Cron } from '@nestjs/schedule'
import { sql } from 'kysely'

export const FAST_RETRY_MINUTES = 10

@Injectable()
export class ValidationService {
    constructor(
        @Inject(KYSELY) private readonly db: Kysely<Database>,
        private readonly osu: OsuService
    ) {}

    async validateRun(runId: number): Promise<void> {
        const run = await this.claim(runId)

        if (!run) {
            return
        }

        try {
            const positions = await this.gatherPositions(run)
            const verdict = judgeRun(positions)

            await this.applyVerdict(runId, verdict)
        } catch (error) {
            await this.release(runId).catch(() => undefined)
            throw error
        }
    }

    private async claim(runId: number) {
        return this.db
            .updateTable('runs')
            .set({ status: 'validating', validating_since: new Date() })
            .where('id', '=', runId)
            .where('status', '=', 'pending_final')
            .returning(['id', 'user_id', 'ended_at'])
            .executeTakeFirst()
    }

    private async gatherPositions(run: {
        id: number
        user_id: number
        ended_at: Date | null
    }): Promise<Position[]> {
        const served = await this.db
            .selectFrom('run_maps')
            .select(['seq_index', 'map_id', 'served_at', 'claimed_outcome'])
            .where('run_id', '=', run.id)
            .orderBy('seq_index')
            .execute()

        if (served.length === 0) {
            return []
        }

        const scores = await this.osu.getRecentScores(run.user_id)
        const runEnd = run.ended_at ?? new Date()

        const matched = served.map((map) => ({
            map,
            score: matchScore(
                {
                    seq_index: map.seq_index,
                    map_id: map.map_id,
                    served_at: map.served_at
                },
                scores
            )
        }))

        const timings: TimedMap[] = matched.map(({ map, score }, index) => ({
            seq_index: map.seq_index,
            served_at: map.served_at,
            resolved_at: matched[index + 1]?.map.served_at ?? runEnd,
            play_started_at: score ? new Date(score.started_at) : null
        }))

        const charges = chargeSequence(timings)

        const upheld = new Map<number, boolean>()

        for (const { map } of matched) {
            if (map.claimed_outcome !== 'unplayable') {
                continue
            }

            const availability = await this.osu.getBeatmapAvailability(
                map.map_id
            )

            upheld.set(map.map_id, unplayableClaimUpheld(availability))

            if (!upheld.get(map.map_id)) {
                break
            }
        }

        return matched.map(({ map, score }, index) => ({
            seq_index: map.seq_index,
            claimed: map.claimed_outcome,
            score,
            withinLimit: charges[index].withinLimit,
            unplayableUpheld: upheld.get(map.map_id) ?? true,
            isLast: index === matched.length - 1
        }))
    }

    private async release(runId: number) {
        await this.db
            .updateTable('runs')
            .set({ status: 'pending_final', validating_since: null })
            .where('id', '=', runId)
            .where('status', '=', 'validating')
            .execute()
    }

    private async applyVerdict(runId: number, verdict: RunVerdict) {
        await this.db.transaction().execute(async (trx) => {
            for (const position of verdict.positions) {
                const score = position.score

                await trx
                    .updateTable('run_maps')
                    .set({
                        outcome: position.outcome,
                        confirmed: position.confirmed,
                        statistics: score
                            ? JSON.stringify(score.statistics)
                            : null,
                        maximum_statistics: score
                            ? JSON.stringify(score.maximum_statistics)
                            : null,
                        mods: score ? JSON.stringify(score.mods) : null,
                        confirmed_score_id: score ? String(score.id) : null,
                        total_score: score?.total_score ?? null,
                        accuracy: score?.accuracy ?? null,
                        score_max_combo: score?.max_combo ?? null,
                        score_started_at: score
                            ? new Date(score.started_at)
                            : null,
                        score_ended_at: score ? new Date(score.ended_at) : null
                    })
                    .where('run_id', '=', runId)
                    .where('seq_index', '=', position.seq_index)
                    .execute()
            }

            await trx
                .updateTable('runs')
                .set({
                    status: 'complete',
                    validating_since: null,
                    fc_count: verdict.fcCount,
                    avg_fc_score: verdict.avgFcScore,
                    avg_fc_accuracy: verdict.avgFcAccuracy,
                    resolved_board: verdict.board,
                    truncated_at_index: verdict.truncatedAt,
                    truncation_reason: verdict.truncationReason
                })
                .where('id', '=', runId)
                .execute()
        })
    }

    @Cron('* * * * *')
    async sweepPendingValidation() {
        await this.reclaimStuckValidations()

        const pending = await this.db
            .selectFrom('runs')
            .select('id')
            .where('status', '=', 'pending_final')
            .where(
                'validation_requested_at',
                '<',
                sql<Date>`now() - interval '1 minute'`
            )
            .where(
                'validation_requested_at',
                '>=',
                sql<Date>`now() - make_interval(mins => ${FAST_RETRY_MINUTES})`
            )
            .execute()

        for (const run of pending) {
            await this.retry(run.id)
        }
    }

    @Cron('0 * * * *')
    async sweepDelayedValidation() {
        const delayed = await this.db
            .selectFrom('runs')
            .select('id')
            .where('status', '=', 'pending_final')
            .where(
                'validation_requested_at',
                '<',
                sql<Date>`now() - make_interval(mins => ${FAST_RETRY_MINUTES})`
            )
            .execute()

        for (const run of delayed) {
            if (!(await this.retry(run.id))) {
                await this.voidStaleRun(run.id)
            }
        }
    }

    private async retry(runId: number) {
        try {
            await this.validateRun(runId)
            return true
        } catch (error) {
            console.error(`validation failed for run ${runId}`, error)
            return false
        }
    }

    private async voidStaleRun(runId: number) {
        const voided = await this.db
            .updateTable('runs')
            .set({ status: 'void' })
            .where('id', '=', runId)
            .where('status', '=', 'pending_final')
            .where(
                'validation_requested_at',
                '<',
                sql<Date>`now() - interval '6 hours'`
            )
            .returning('id')
            .execute()

        if (voided.length > 0) {
            console.error(`gave up validating run ${runId}, marked void`)
        }
    }

    private async reclaimStuckValidations() {
        const stuck = await this.db
            .updateTable('runs')
            .set({ status: 'pending_final', validating_since: null })
            .where('status', '=', 'validating')
            .where(
                'validating_since',
                '<',
                sql<Date>`now() - interval '5 minutes'`
            )
            .returning('id')
            .execute()

        for (const run of stuck) {
            console.warn(`reclaimed stuck validation for run ${run.id}`)
        }
    }
}
