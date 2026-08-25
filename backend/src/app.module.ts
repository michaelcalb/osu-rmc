import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DbModule } from './db/db.module'
import { PoolModule } from './pool/pool.module';

@Module({
    imports: [DbModule, PoolModule],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
