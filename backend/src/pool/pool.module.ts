import { Module } from '@nestjs/common'
import { DbModule } from '../db/db.module'
import { PoolService } from './pool.service'

@Module({
    imports: [DbModule],
    providers: [PoolService],
    exports: [PoolService]
})
export class PoolModule {}
