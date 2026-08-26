import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DbModule } from './db/db.module'
import { PoolModule } from './pool/pool.module';
import { RunsModule } from './runs/runs.module';

@Module({
    imports: [DbModule, PoolModule, RunsModule],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
