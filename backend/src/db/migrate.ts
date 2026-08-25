import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import { FileMigrationProvider, Migrator } from 'kysely/migration'
import { createKysely } from './create-kysely'

async function migrateToLatest() {
    const db = createKysely()

    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: path.join(__dirname, 'migrations'),
            import: (filePath) => import(pathToFileURL(filePath).href)
        })
    })

    const { error, results } = await migrator.migrateToLatest()

    for (const result of results ?? []) {
        if (result.status === 'Success') {
            console.log(`applied ${result.migrationName}`)
        } else if (result.status === 'Error') {
            console.error(`FAILED ${result.migrationName}`)
        }
    }

    await db.destroy()

    if (error) {
        console.error(error)
        process.exit(1)
    }
}

migrateToLatest().catch((err) => {
    console.error(err)
    process.exit(1)
})