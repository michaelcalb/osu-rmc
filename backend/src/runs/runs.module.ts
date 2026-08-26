import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { PoolModule } from '../pool/pool.module';
import { RunsService } from './runs.service';
import { RunsController } from './runs.controller';

@Module({
  imports: [DbModule, PoolModule],
  providers: [RunsService],
  controllers: [RunsController],
  exports: [RunsService]
})
export class RunsModule {}
