import { Inject, Module, OnModuleDestroy } from '@nestjs/common'
import { Kysely } from 'kysely'
import type { Database } from './database'
import { createKysely } from './create-kysely'

export const KYSELY = 'KYSELY'

@Module({
    providers: [
        {
            provide: KYSELY,
            useFactory: createKysely
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
