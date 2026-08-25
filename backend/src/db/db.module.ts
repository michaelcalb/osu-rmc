import { Inject, Module, OnModuleDestroy } from '@nestjs/common'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './database'

export const KYSELY = 'KYSELY'

@Module({
    providers: [
        {
            provide: KYSELY,
            useFactory: () => {
                const connectionString = process.env.DATABASE_URL

                if (!connectionString) {
                    throw new Error('DATABASE_URL is not set')
                }

                return new Kysely<Database>({
                    dialect: new PostgresDialect({
                        pool: new Pool({ connectionString })
                    })
                })
            }
        }
    ],
    exports: [KYSELY]
})
export class DbModule implements OnModuleDestroy {
    constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

    async onModuleDestroy() {
        await this.db.destroy()
    }
}
