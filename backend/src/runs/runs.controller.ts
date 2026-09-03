import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionGuard } from '../auth/session.guard';
import { BOARDS, type Board } from '../db/database';
import { RunsService } from './runs.service';

const SKIP_KINDS = ['a_skip', 'free_skip'] as const

@UseGuards(SessionGuard)
@Controller('runs')
export class RunsController {
    constructor(private readonly runsService: RunsService) {}

    @Post()
    start(
        @CurrentUser() userId: number,
        @Body('declaredMode') declaredMode: string
    ) {
        if (!BOARDS.includes(declaredMode as Board)) {
            throw new BadRequestException(
                `declaredMode must be one of: ${BOARDS.join(', ')}`
            )
        }

        return this.runsService.startRun(userId, declaredMode as Board)
    }

    @Post(':id/abandon')
    @HttpCode(HttpStatus.NO_CONTENT)
    abandon(
        @CurrentUser() userId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.runsService.abandonRun(userId, id)
    }

    @Post(':id/reveal')
    reveal(
        @CurrentUser() userId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.runsService.revealNext(userId, id)
    }

    @Get(':id/state')
    state(
        @CurrentUser() userId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.runsService.getRunState(userId, id)
    }

    @Get(':id/result')
    result(
        @CurrentUser() userId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.runsService.getRunResult(userId, id)
    }

    @Post(':id/playing')
    @HttpCode(HttpStatus.NO_CONTENT)
    playing(
        @CurrentUser() userId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.runsService.startPlaying(userId, id)
    }

    @Post(':id/skip')
    skip(
        @CurrentUser() userId: number,
        @Param('id', ParseIntPipe) id: number,
        @Body('kind') kind: string
    ) {
        if (!SKIP_KINDS.includes(kind as (typeof SKIP_KINDS)[number])) {
            throw new BadRequestException(
                `kind must be one of: ${SKIP_KINDS.join(', ')}`
            )
        }
        
        return this.runsService.advanceMap(
            userId,
            id,
            kind as 'a_skip' | 'free_skip'
        )
    }

    @Post(':id/unplayable')
    unplayable(
        @CurrentUser() userId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.runsService.advanceMap(userId, id, 'unplayable')
    }

    @Post(':id/end')
    @HttpCode(HttpStatus.NO_CONTENT)
    end(
        @CurrentUser() userId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.runsService.endRun(userId, id)
    }

    @Get('current')
    current(@CurrentUser() userId: number) {
        return this.runsService.getCurrentRun(userId)
    }

    @Get('mine')
    mine(@CurrentUser() userId: number) {
        return this.runsService.listRuns(userId)
    }
}
