import { Inject, Injectable } from '@nestjs/common';
import { Kysely, type ExpressionBuilder } from 'kysely';
import type { Database } from '../db/database';
import { KYSELY } from '../db/db.module';
import { resolveSequence } from './seed';

@Injectable()
export class PoolService {
    constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

    private inVersion(version: number) {
        return (eb: ExpressionBuilder<Database, 'pool_maps'>) =>
            eb.and([
                eb('added_in_version', '<=', version),
                eb.or([
                    eb('removed_in_version', 'is', null),
                    eb('removed_in_version', '>', version)
                ])

            ])
    }

    async countMapsInVersion(version: number): Promise<number> {
        const row = await this.db
            .selectFrom('pool_maps')
            .select((eb) => eb.fn.countAll<number>().as('count'))
            .where(this.inVersion(version))
            .executeTakeFirstOrThrow()

        return Number(row.count)
    }

    async getMapInVersion(version: number, mapId: number) {
        return this.db
            .selectFrom('pool_maps')
            .select([
                'map_id',
                'set_id',
                'star_rating',
                'hit_length',
                'total_length',
                'max_combo'
            ])
            .where('map_id', '=', mapId)
            .where(this.inVersion(version))
            .executeTakeFirst()
    }

    async getMapsAtIndices(version: number, indices: number[]) {
        if (indices.length === 0) {
            return []
        }

        const rows = await this.db
            .with('numbered', (db) =>
                db
                    .selectFrom('pool_maps')
                    .select((eb) => [
                        'map_id',
                        'set_id',
                        'star_rating',
                        'hit_length',
                        'total_length',
                        'max_combo',
                        eb
                            .cast<number>(
                                eb.fn
                                    .agg<number>('row_number')
                                    .over((ob) => ob.orderBy('map_id')),
                                'integer'
                            )
                            .as('idx')
                    ])
                    .where(this.inVersion(version))
            )
            .selectFrom('numbered')
            .selectAll()
            .where('idx', 'in', indices)
            .execute()
        
        const byIndex = new Map(rows.map((row) => [row.idx, row]))

        return indices.map((idx) => {
            const row = byIndex.get(idx)

            if (!row) {
                throw new Error(
                    `pool version ${version} has no map at index ${idx}`
                )
            }

            return row
        })
    }

    async getCurrentVersion(): Promise<number> {
        const row = await this.db
            .selectFrom('pool_versions')
            .select('id')
            .orderBy('id', 'desc')
            .limit(1)
            .executeTakeFirstOrThrow()
        
        return row.id
    }

    async resolveRunSequence(version: number, seed: string): Promise<number[]> {
        const poolSize = await this.countMapsInVersion(version)
        const indices = resolveSequence(seed, poolSize)
        const maps = await this.getMapsAtIndices(version, indices)

        return maps.map((map) => map.map_id)
    }

}
