import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { DevRoutesGuard } from '../common/dev-routes.guard';
import type { Board } from '../db/database';
import { RunsService } from './runs.service';

const BOARDS: Board[] = ['no_mod', 'free_mod']
const SKIP_KINDS = ['a_skip', 'free_skip'] as const

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

    @Post(':id/reveal')
    reveal(@Param('id', ParseIntPipe) id: number) {
        return this.runsService.revealNext(devUserId(), id)
    }

    @Get(':id/state')
    state(@Param('id', ParseIntPipe) id: number) {
        return this.runsService.getRunState(devUserId(), id)
    }

    @Post(':id/playing')
    @HttpCode(HttpStatus.NO_CONTENT)
    playing(@Param('id', ParseIntPipe) id: number) {
        return this.runsService.startPlaying(devUserId(), id)
    }

    @Post(':id/skip')
    skip(
        @Param('id', ParseIntPipe) id: number,
        @Body('kind') kind: string
    ) {
        if (!SKIP_KINDS.includes(kind as (typeof SKIP_KINDS)[number])) {
            throw new BadRequestException(
                `kind must be one of: ${SKIP_KINDS.join(', ')}`
            )
        }
        
        return this.runsService.advanceMap(
            devUserId(),
            id,
            kind as 'a_skip' | 'free_skip'
        )
    }

    @Post(':id/unplayable')
    unplayable(@Param('id', ParseIntPipe) id: number) {
        return this.runsService.advanceMap(devUserId(), id, 'unplayable')
    }

    @Post(':id/end')
    @HttpCode(HttpStatus.NO_CONTENT)
    end(@Param('id', ParseIntPipe) id: number) {
        return this.runsService.endRun(devUserId(), id)
    }

    @Get('current')
    current() {
        return this.runsService.getCurrentRun(devUserId())
    }
}
