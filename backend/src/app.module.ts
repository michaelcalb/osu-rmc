import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DbModule } from './db/db.module'
import { PoolModule } from './pool/pool.module';
import { RunsModule } from './runs/runs.module';
import { OsuModule } from './osu/osu.module';

@Module({
    imports: [ScheduleModule.forRoot(), DbModule, PoolModule, RunsModule, OsuModule],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
