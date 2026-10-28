import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { DbModule } from './db/db.module'
import { PoolModule } from './pool/pool.module'
import { RunsModule } from './runs/runs.module'
import { OsuModule } from './osu/osu.module'
import { ValidationModule } from './validation/validation.module'
import { AuthModule } from './auth/auth.module'
import { LeaderboardsModule } from './leaderboards/leaderboards.module'
import { ProfilesModule } from './profiles/profiles.module'

@Module({
    imports: [
        ScheduleModule.forRoot(),
        ThrottlerModule.forRoot([
            { ttl: 60_000, limit: 120, blockDuration: 0 }
        ]),
        DbModule,
        PoolModule,
        RunsModule,
        OsuModule,
        ValidationModule,
        AuthModule,
        LeaderboardsModule,
        ProfilesModule
    ],
    providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
})
export class AppModule {}
