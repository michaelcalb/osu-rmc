import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { DbModule } from './db/db.module'
import { PoolModule } from './pool/pool.module';
import { RunsModule } from './runs/runs.module';
import { OsuModule } from './osu/osu.module';
import { ValidationModule } from './validation/validation.module';
import { AuthModule } from './auth/auth.module';
import { LeaderboardsModule } from './leaderboards/leaderboards.module';

@Module({
    imports: [ScheduleModule.forRoot(), DbModule, PoolModule, RunsModule, OsuModule, ValidationModule, AuthModule, LeaderboardsModule],
})
export class AppModule {}
