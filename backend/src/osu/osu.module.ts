import { Module } from '@nestjs/common'
import { OsuService } from './osu.service'

@Module({
    providers: [OsuService],
    exports: [OsuService]
})
export class OsuModule {}
