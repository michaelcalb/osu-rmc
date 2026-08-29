import { ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import type { Board, Database, RunPhase } from '../db/database';
import { KYSELY } from '../db/db.module';
import { PoolService } from '../pool/pool.service';
import { generateSeed } from '../pool/seed';
import { bankedElapsed, readClock, type ClockInput } from './clock';

const MAX_STARTS_PER_HOUR = 6

@Injectable()
export class RunsService {
    constructor(
        @Inject(KYSELY) private readonly db: Kysely<Database>,
        private readonly pool: PoolService
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
            .set({ status: 'abandoned', ended_at: sql<Date>`now()` })
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
        const run = await this.db
            .selectFrom('runs')
            .select([
                'id',
                'pool_version',
                'resolved_sequence',
                'status',
                'active_elapsed',
                'phase',
                'phase_since'
            ])
            .where('id', '=', runId)
            .where('user_id', '=', userId)
            .executeTakeFirst()

        if (!run) {
            throw new NotFoundException('run not found')
        }

        if (run.status !== 'active') {
            throw new ConflictException(`run is ${run.status}`)
        }

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

        if (seqIndex >= run.resolved_sequence.length) {
            await this.db
                .updateTable('runs')
                .set({ status: 'pending_final', ended_at: sql<Date>`now()` })
                .where('id', '=', runId)
                .execute()

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
                hit_length: map.hit_length,
                total_length: map.total_length,
                map_max_combo: map.max_combo
            })
            .execute()
        
        await this.settle(runId, run, now, 'download')

        return this.getServedMap(runId, seqIndex)
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
    ) {
        await this.db
            .updateTable('runs')
            .set({
                active_elapsed: bankedElapsed(run, now),
                phase,
                phase_since: now
            })
            .where('id', '=', runId)
            .execute()
    }

    private async expireIfDue(
        run: ClockInput & { id: number },
        now: Date
    ): Promise<boolean> {
        if (!readClock(run, now).expired) {
            return false
        }

        await this.db
            .updateTable('runs')
            .set({
                status: 'pending_final',
                active_elapsed: bankedElapsed(run, now),
                ended_at: now
            })
            .where('id', '=', run.id)
            .execute()

        return true
    }

    async getRunState(userId: number, runId: number) {
        const run = await this.db
            .selectFrom('runs')
            .select([
                'id',
                'status',
                'fc_count',
                'active_elapsed',
                'phase',
                'phase_since'
            ])
            .where('id', '=', runId)
            .where('user_id', '=', userId)
            .executeTakeFirst()

        if (!run) {
            throw new NotFoundException('run not found')
        }

        const now = new Date()
        const expired = await this.expireIfDue(run, now)
        const clock = readClock(run, now)

        return {
            id: run.id,
            status: expired ? 'pending_final' : run.status,
            fcCount: run.fc_count,
            serverNow: now.toISOString(),
            mainSecondsLeft: clock.mainSecondsLeft,
            prepSecondsLeft: clock.prepSecondsLeft
        }
    }

    async startPlaying(userId: number, runId: number) {
        const run = await this.db
            .selectFrom('runs')
            .select([
                'id',
                'status',
                'active_elapsed',
                'phase',
                'phase_since'
            ])
            .where('id', '=', runId)
            .where('user_id', '=', userId)
            .executeTakeFirst()

        if (!run) {
            throw new NotFoundException('run not found')
        }

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
        const run = await this.db
            .selectFrom('runs')
            .select(['id', 'status', 'free_skip_used'])
            .where('id', '=', runId)
            .where('user_id', '=', userId)
            .executeTakeFirst()

        if (!run) {
            throw new NotFoundException('run not found')
        }

        if (run.status !== 'active') {
            throw new ConflictException(`run is ${run.status}`)
        }

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
            .set({ outcome: outcome })
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
        const run = await this.db
            .selectFrom('runs')
            .select(['id', 'status', 'active_elapsed', 'phase', 'phase_since'])
            .where('id', '=', runId)
            .where('user_id', '=', userId)
            .executeTakeFirst()

        if (!run) {
            throw new NotFoundException('run not found')
        }

        if (run.status !== 'active') {
            throw new ConflictException(`run is ${run.status}`)
        }

        const now = new Date()

        await this.db
            .updateTable('runs')
            .set({
                status: 'pending_final',
                active_elapsed: bankedElapsed(run, now),
                ended_at: now
            })
            .where('id', '=', runId)
            .execute()
    }
}
