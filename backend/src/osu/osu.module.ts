import { Module } from '@nestjs/common'
import { OsuService } from './osu.service'
import { OsuController } from './osu.controller'

@Module({
    providers: [OsuService],
    exports: [OsuService],
    controllers: [OsuController]
})
export class OsuModule {}
