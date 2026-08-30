import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { PoolModule } from '../pool/pool.module';
import { RunsService } from './runs.service';
import { RunsController } from './runs.controller';
import { ValidationModule } from '../validation/validation.module';

@Module({
  imports: [DbModule, PoolModule, ValidationModule],
  providers: [RunsService],
  controllers: [RunsController],
  exports: [RunsService]
})
export class RunsModule {}
