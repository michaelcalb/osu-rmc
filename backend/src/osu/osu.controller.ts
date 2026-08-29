import { Controller, Get, UseGuards } from '@nestjs/common';
import { DevRoutesGuard } from '../common/dev-routes.guard';
import { OsuService } from './osu.service';

@UseGuards(DevRoutesGuard)
@Controller('osu')
export class OsuController {
    constructor(private readonly osu: OsuService) {}

    @Get('recent')
    recent() {
        return this.osu.getRecentScores(Number(process.env.DEV_USER_ID))
    }
}
