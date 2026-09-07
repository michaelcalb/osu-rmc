import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common'
import { ProfilesService } from './profiles.service'

@Controller('users')
export class ProfilesController {
    constructor(private readonly profiles: ProfilesService) {}

    @Get(':id')
    profile(@Param('id', ParseIntPipe) id: number) {
        return this.profiles.getProfile(id)
    }
}
