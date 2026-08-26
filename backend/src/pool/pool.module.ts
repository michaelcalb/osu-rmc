import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { PoolService } from './pool.service';
import { PoolController } from './pool.controller';

@Module({
    imports: [DbModule],
  providers: [PoolService],
  exports: [PoolService],
  controllers: [PoolController]
})
export class PoolModule {}
