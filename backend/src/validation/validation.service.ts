import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import type { Database } from '../db/database';
import { KYSELY } from '../db/db.module';
import { OsuService, SCORE_PUBLISH_DELAY_SECONDS } from '../osu/osu.service';
import { chargeSequence, type TimedMap } from './charging';
import { matchScore } from './matching';
import { judgeRun, RunVerdict, type Position } from './verdict';
import { Cron } from '@nestjs/schedule';
import { sql } from 'kysely';
import { PREP_WINDOW_SECONDS } from '../runs/clock';

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

        const positions = await this.gatherPositions(run)

        if (await this.shouldDefer(runId, positions)) {
            await this.release(runId)
            return
        }

        const verdict = judgeRun(positions)

        await this.applyVerdict(runId, verdict)
    }

    private async claim(runId: number) {
        return this.db
            .updateTable('runs')
            .set({ status: 'validating' })
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
            .select(['seq_index', 'map_id', 'served_at', 'outcome'])
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

        const statuses = new Map<number, string | null>()

        for (const { map } of matched) {
            if (map.outcome === 'unplayable') {
                statuses.set(
                    map.map_id,
                    await this.osu.getBeatmapStatus(map.map_id)
                )
            }
        }

        return matched.map(({ map, score }, index) => ({
            seq_index: map.seq_index,
            claimed: map.outcome,
            score,
            withinLimit: charges[index].withinLimit,
            beatmapStatus: statuses.get(map.map_id) ?? null,
            isLast: index === matched.length - 1
        }))
    }

    private async shouldDefer(
        runId: number,
        positions: Position[]
    ): Promise<boolean> {
        const last = positions[positions.length - 1]

        if (!last || last.score || last.claimed !== 'unjudged') {
            return false
        }

        const trailing = await this.db
            .selectFrom('run_maps')
            .select(['served_at', 'total_length'])
            .where('run_id', '=', runId)
            .orderBy('seq_index', 'desc')
            .executeTakeFirstOrThrow()

        const expectedEnd =
            trailing.served_at.getTime() +
            (PREP_WINDOW_SECONDS +
                trailing.total_length +
                SCORE_PUBLISH_DELAY_SECONDS) *
                1000

        return Date.now() < expectedEnd
    }

    private async release(runId: number) {
        await this.db
            .updateTable('runs')
            .set({ status: 'pending_final' })
            .where('id', '=', runId)
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
                    fc_count: verdict.fcCount,
                    resolved_board: verdict.board
                })
                .where('id', '=', runId)
                .execute()
        })
    }

    @Cron('* * * * *')
    async sweepPendingValidation() {
        const pending = await this.db
            .selectFrom('runs')
            .select('id')
            .where('status', '=', 'pending_final')
            .where('ended_at', '<', sql<Date>`now() - interval '1 minute'`)
            .execute()

        for (const run of pending) {
            try {
                await this.validateRun(run.id)
            } catch (error) {
                console.error(`validation failed for run ${run.id}`, error)
            }
        }
    }
}
