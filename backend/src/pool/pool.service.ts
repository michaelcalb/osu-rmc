import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import type { Database } from '../db/database';
import { KYSELY } from '../db/db.module';

@Injectable()
export class PoolService {
    constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

    async countMapsInVersion(version: number): Promise<number> {
        const row = await this.db
            .selectFrom('pool_maps')
            .select((eb) => eb.fn.countAll<number>().as('count'))
            .where('added_in_version', '<=', version)
            .where((eb) =>
                eb.or([
                    eb('removed_in_version', 'is', null),
                    eb('removed_in_version', '>', version)
                ])
            )
            .executeTakeFirstOrThrow()

        return Number(row.count)
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
                    .where('added_in_version', '<=', version)
                    .where((eb) =>
                        eb.or([
                            eb('removed_in_version', 'is', null),
                            eb('removed_in_version', '>', version)
                        ])
                    )
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
}
