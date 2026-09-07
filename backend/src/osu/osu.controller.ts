import { Controller, Get, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { SessionGuard } from '../auth/session.guard'
import { DevRoutesGuard } from '../common/dev-routes.guard'
import { OsuService } from './osu.service'

@UseGuards(DevRoutesGuard, SessionGuard)
@Controller('osu')
export class OsuController {
    constructor(private readonly osu: OsuService) {}

    @Get('recent')
    recent(@CurrentUser() userId: number) {
        return this.osu.getRecentScores(userId)
    }
}
