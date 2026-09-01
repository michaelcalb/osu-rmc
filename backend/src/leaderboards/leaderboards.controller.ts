import {
    BadRequestException,
    Controller,
    DefaultValuePipe,
    Get,
    Param,
    ParseIntPipe,
    Query
} from '@nestjs/common';
import type { Board } from '../db/database';
import { DEFAULT_LIMIT, LeaderboardsService } from './leaderboards.service';

const BOARDS : Board[] = ['no_mod', 'free_mod']

@Controller('leaderboards')
export class LeaderboardsController {
    constructor(private readonly leaderboards: LeaderboardsService) {}

    @Get('runs/:id')
    run(@Param('id', ParseIntPipe) id: number) {
        return this.leaderboards.getRun(id)
    }

    @Get(':board')
    board(
        @Param('board') board: string,
        @Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe) limit: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number
    ) {
        if (!BOARDS.includes(board as Board)) {
            throw new BadRequestException(
                `board must be one of ${BOARDS.join(', ')}`
            )
        }

        return this.leaderboards.getBoard(board as Board, limit, offset)
    }
}
