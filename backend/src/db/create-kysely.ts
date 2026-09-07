import 'dotenv/config'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './database'

export function createKysely(): Kysely<Database> {
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
