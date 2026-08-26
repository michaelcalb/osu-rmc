import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { DevRoutesGuard } from '../common/dev-routes.guard';
import type { Board } from '../db/database';
import { RunsService } from './runs.service';

const BOARDS: Board[] = ['no_mod', 'free_mod']

function devUserId(): number {
    const raw = process.env.DEV_USER_ID

    if (!raw) {
        throw new Error('DEV_USER_ID is not set')
    }

    return Number(raw)
}

@UseGuards(DevRoutesGuard)
@Controller('runs')
export class RunsController {
    constructor(private readonly runsService: RunsService) {}

    @Post()
    start(@Body('declaredMode') declaredMode: string) {
        if (!BOARDS.includes(declaredMode as Board)) {
            throw new BadRequestException(
                `declaredMode must be one of: ${BOARDS.join(', ')}`
            )
        }

        return this.runsService.startRun(devUserId(), declaredMode as Board)
    }

    @Post(':id/abandon')
    @HttpCode(HttpStatus.NO_CONTENT)
    abandon(@Param('id', ParseIntPipe) id: number) {
        return this.runsService.abandonRun(devUserId(), id)
    }
}
