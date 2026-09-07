import { ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import type { Board, Database, RunPhase, RunStatus } from '../db/database';
import { KYSELY } from '../db/db.module';
import { PoolService } from '../pool/pool.service';
import { generateSeed } from '../pool/seed';
import { bankedElapsed, readClock, type ClockInput } from './clock';
import { Cron } from '@nestjs/schedule';
import { ValidationService } from '../validation/validation.service';
import { SCORE_PUBLISH_DELAY_SECONDS } from '../osu/osu.service';

const MAX_STARTS_PER_HOUR = 6

@Injectable()
export class RunsService {
    constructor(
        @Inject(KYSELY) private readonly db: Kysely<Database>,
        private readonly pool: PoolService,
        private readonly validation: ValidationService
    ) {}

    async startRun(userId: number, declaredMode: Board) {
        await this.assertNoLiveRun(userId)
        await this.assertUnderStartLimit(userId)

        const poolVersion = await this.pool.getCurrentVersion()
        const seed = generateSeed()
        const mapIds = await this.pool.resolveRunSequence(poolVersion, seed)

        return this.db
            .insertInto('runs')
            .values({
                user_id: userId,
                seed,
                pool_version: poolVersion,
                declared_mode: declaredMode,
                resolved_sequence: JSON.stringify(mapIds)
            })
            .returning(['id', 'pool_version', 'declared_mode', 'status', 'started_at'])
            .executeTakeFirstOrThrow()
    }

    async abandonRun(userId: number, runId: number) {
        const updated = await this.db
            .updateTable('runs')
            .set({ status: 'abandoned', ended_at: new Date() })
            .where('id', '=', runId)
            .where('user_id', '=', userId)
            .where('status', '=', 'active')
            .returning('id')
            .executeTakeFirst()

        if (!updated) {
            throw new NotFoundException('no active run to abandon')
        }
    }

    private async assertNoLiveRun(userId: number) {
        const live = await this.db
            .selectFrom('runs')
            .select(['id', 'active_elapsed', 'phase', 'phase_since'])
            .where('user_id', '=', userId)
            .where('status', '=', 'active')
            .executeTakeFirst()

        if (!live) {
            return
        }

        if (await this.expireIfDue(live, new Date())) {
            return
        }

        throw new ConflictException(`run ${live.id} is still in progress`)
    }

    private async assertUnderStartLimit(userId: number) {
        await this.db
            .deleteFrom('runs')
            .where('status', '=', 'abandoned')
            .where('started_at', '<', sql<Date>`now() - interval '1 hour'`)
            .execute()

        const row = await this.db
            .selectFrom('runs')
            .select((eb) => eb.fn.countAll<number>().as('count'))
            .where('user_id', '=', userId)
            .where('started_at', '>', sql<Date>`now() - interval '1 hour'`)
            .executeTakeFirstOrThrow()

        if (Number(row.count) >= MAX_STARTS_PER_HOUR) {
            throw new HttpException(
                `limit is ${MAX_STARTS_PER_HOUR} runs per hour`,
                HttpStatus.TOO_MANY_REQUESTS
            )
        }
    }

    async revealNext(userId: number, runId: number) {
        const run = await this.loadRun(userId, runId)

        this.assertActive(run)

        const now = new Date()

        if (await this.expireIfDue(run, now)) {
            throw new ConflictException('time expired')
        }

        const served = await this.db
            .selectFrom('run_maps')
            .select((eb) => eb.fn.countAll<number>().as('count'))
            .where('run_id', '=', runId)
            .executeTakeFirstOrThrow()

        const seqIndex = Number(served.count)

        if (seqIndex > 0) {
            await this.db
                .updateTable('run_maps')
                .set({ claimed_outcome: 'fc' })
                .where('run_id', '=', runId)
                .where('seq_index', '=', seqIndex - 1)
                .where('claimed_outcome', 'is', null)
                .execute()
        }

        if (seqIndex >= run.resolved_sequence.length) {
            await this.finishRun(runId, run, now)

            throw new ConflictException('sequence exhausted')
        }

        const mapId = run.resolved_sequence[seqIndex]
        const map = await this.pool.getMapInVersion(run.pool_version, mapId)

        if (!map) {
            throw new Error(
                `map ${mapId} missing from pool version ${run.pool_version}`
            )
        }

        await this.db
            .insertInto('run_maps')
            .values({
                run_id: runId,
                seq_index: seqIndex,
                map_id: map.map_id,
                set_id: map.set_id,
                original_star_rating: map.star_rating,
                difficulty_name: map.difficulty_name,
                hit_length: map.hit_length,
                total_length: map.total_length,
                map_max_combo: map.max_combo
            })
            .execute()
        
        const settled = await this.settle(runId, run, now, 'download')

        return {
            map: await this.getServedMap(runId, seqIndex),
            clock: this.clockPayload(settled, now)
        }
    }

    private async getCurrentMap(runId: number) {
        const current = await this.db
            .selectFrom('run_maps')
            .select('seq_index')
            .where('run_id', '=', runId)
            .orderBy('seq_index', 'desc')
            .limit(1)
            .executeTakeFirst()

        if (!current) {
            return null
        }

        return this.getServedMap(runId, current.seq_index)
    }

    private async getServedMap(runId: number, seqIndex: number) {
        return this.db
            .selectFrom('run_maps as rm')
            .innerJoin('pool_sets as ps', 'ps.beatmapset_id', 'rm.set_id')
            .select([
                'rm.seq_index',
                'rm.map_id',
                'rm.set_id',
                'rm.served_at',
                'rm.original_star_rating',
                'rm.difficulty_name',
                'rm.hit_length',
                'rm.total_length',
                'rm.map_max_combo',
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
            .where('rm.seq_index', '=', seqIndex)
            .executeTakeFirstOrThrow()
    }

    private async settle(
        runId: number,
        run: ClockInput,
        now: Date,
        phase: RunPhase
    ): Promise<ClockInput> {
        const settled: ClockInput = {
            active_elapsed: bankedElapsed(run, now),
            phase,
            phase_since: now
        }

        await this.db
            .updateTable('runs')
            .set(settled)
            .where('id', '=', runId)
            .execute()

        return settled
    }

    private clockPayload(run: ClockInput, now: Date) {
        const clock = readClock(run, now)

        return {
            serverNow: now.toISOString(),
            phase: run.phase,
            mainSecondsLeft: clock.mainSecondsLeft,
            prepSecondsLeft: clock.prepSecondsLeft
        }
    }

    private async expireIfDue(
        run: ClockInput & { id: number },
        now: Date
    ): Promise<boolean> {
        if (!readClock(run, now).expired) {
            return false
        }

        await this.finishRun(run.id, run, now)

        return true
    }

    private async loadRun(userId: number, runId: number) {
        const run = await this.db
            .selectFrom('runs')
            .select([
                'id',
                'status',
                'pool_version',
                'resolved_sequence',
                'free_skip_used',
                'fc_count',
                'active_elapsed',
                'phase',
                'phase_since',
            ])
            .where('id', '=', runId)
            .where('user_id', '=', userId)
            .executeTakeFirst()

        if (!run) {
            throw new NotFoundException('run not found')
        }

        return run
    }

    private assertActive(run: { status: RunStatus }) {
        if (run.status !== 'active') {
            throw new ConflictException(`run is ${run.status}`)
        }
    }

    private async finishRun(runId: number, run: ClockInput, now: Date) {
        await this.db
            .updateTable('runs')
            .set({
                status: 'pending_final',
                active_elapsed: bankedElapsed(run, now),
                ended_at: now
            })
            .where('id', '=', runId)
            .execute()

        this.scheduleValidation(runId)
    }

    private scheduleValidation(runId: number) {
        setTimeout(() => {
            void this.validation.validateRun(runId).catch((error) => {
                console.error(`validation failed for run ${runId}`, error)
            })
        }, SCORE_PUBLISH_DELAY_SECONDS * 1000).unref()
    }

    async getRunState(userId: number, runId: number) {
        const run = await this.loadRun(userId, runId)

        const now = new Date()
        const expired = await this.expireIfDue(run, now)

        const claimed = await this.db
            .selectFrom('run_maps')
            .select((eb) => eb.fn.countAll<number>().as('count'))
            .where('run_id', '=', run.id)
            .where('claimed_outcome', '=', 'fc')
            .executeTakeFirstOrThrow()

        return {
            id: run.id,
            status: expired ? 'pending_final' : run.status,
            fcCount: run.fc_count,
            freeSkipUsed: run.free_skip_used,
            currentMap: await this.getCurrentMap(run.id),
            claimedFcCount: Number(claimed.count),
            ...this.clockPayload(run, now)
        }
    }

    async getCurrentRun(userId: number) {
        const active = await this.db
            .selectFrom('runs')
            .select('id')
            .where('user_id', '=', userId)
            .where('status', '=', 'active')
            .executeTakeFirst()

        if (!active) {
            return null
        }

        return this.getRunState(userId, active.id)
    }

    async getRunResult(userId: number, runId: number) {
        const run = await this.db
            .selectFrom('runs')
            .select([
                'id',
                'status',
                'pool_version',
                'declared_mode',
                'resolved_board',
                'fc_count',
                'active_elapsed',
                'started_at',
                'ended_at',
                'truncated_at_index',
                'truncation_reason'
            ])
            .where('id', '=', runId)
            .where('user_id', '=', userId)
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
                'rm.total_length',
                'rm.map_max_combo',
                'rm.mods',
                'rm.score_max_combo',
                'rm.confirmed_score_id',
                'rm.served_at',
                'rm.score_started_at',
                'rm.score_ended_at',
                'ps.artist',
                'ps.title',
                'ps.creator'
            ])
            .where('rm.run_id', '=', runId)
            .orderBy('rm.seq_index')
            .execute()

        const claimedFcCount = maps.filter(
            (map) => map.claimed_outcome === 'fc'
        ).length

        return { run, maps, claimedFcCount }
    }

    async listRuns(userId: number, limit = 20) {
        return this.db
            .selectFrom('runs')
            .select([
                'id',
                'status',
                'declared_mode',
                'resolved_board',
                'fc_count',
                'active_elapsed',
                'started_at',
                'ended_at'
            ])
            .where('user_id', '=', userId)
            .orderBy('started_at', 'desc')
            .limit(limit)
            .execute()
    }

    async startPlaying(userId: number, runId: number) {
        const run = await this.loadRun(userId, runId)

        if (run.status !== 'active' || run.phase !== 'download') {
            return
        }

        await this.settle(runId, run, new Date(), 'running')
    }

    async advanceMap(
        userId: number,
        runId: number,
        outcome: 'a_skip' | 'free_skip' | 'unplayable'
    ) {
        const run = await this.loadRun(userId, runId)

        this.assertActive(run)

        if (outcome === 'free_skip' && run.free_skip_used) {
            throw new ConflictException('free skip already used')
        }

        const current = await this.db
            .selectFrom('run_maps')
            .select('seq_index')
            .where('run_id', '=', runId)
            .orderBy('seq_index', 'desc')
            .limit(1)
            .executeTakeFirst()

        if (!current) {
            throw new ConflictException('no map has been served yet')
        }

        await this.db
            .updateTable('run_maps')
            .set({ claimed_outcome: outcome })
            .where('run_id', '=', runId)
            .where('seq_index', '=', current.seq_index)
            .execute()

        if (outcome === 'free_skip') {
            await this.db
                .updateTable('runs')
                .set({ free_skip_used: true })
                .where('id', '=', runId)
                .execute()
        }

        return this.revealNext(userId, runId)
    }

    async endRun(userId: number, runId: number) {
        const run = await this.loadRun(userId, runId)

        this.assertActive(run)

        await this.finishRun(runId, run, new Date())
    }

    @Cron('*/10 * * * *')
    async sweepExpiredRuns() {
        const now = new Date()

        const active = await this.db
            .selectFrom('runs')
            .select(['id', 'active_elapsed', 'phase', 'phase_since'])
            .where('status', '=', 'active')
            .execute()

        for (const run of active) {
            try {
                if (await this.expireIfDue(run, now)) {
                    console.log(`run ${run.id} expired by sweep`)
                }
            } catch (error) {
                console.error(`expiry failed for run ${run.id}`, error)
            }
        }
    }
}
