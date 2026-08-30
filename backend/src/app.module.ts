import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DbModule } from './db/db.module'
import { PoolModule } from './pool/pool.module';
import { RunsModule } from './runs/runs.module';
import { OsuModule } from './osu/osu.module';
import { ValidationModule } from './validation/validation.module';

@Module({
    imports: [ScheduleModule.forRoot(), DbModule, PoolModule, RunsModule, OsuModule, ValidationModule],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
