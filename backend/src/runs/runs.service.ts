import { ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import type { Board, Database } from '../db/database';
import { KYSELY } from '../db/db.module';
import { PoolService } from '../pool/pool.service';
import { generateSeed } from '../pool/seed';

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
            .select('id')
            .where('user_id', '=', userId)
            .where('status', 'in', ['active', 'pending_final', 'validating'])
            .executeTakeFirst()

        if (live) {
            throw new ConflictException(`run ${live.id} is still in progress`)
        }
    }

    private async assertUnderStartLimit(userId: number) {
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
}
