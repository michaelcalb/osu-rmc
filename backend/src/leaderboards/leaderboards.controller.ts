import {
    BadRequestException,
    Controller,
    DefaultValuePipe,
    Get,
    Param,
    ParseIntPipe,
    Query
} from '@nestjs/common'
import { BOARDS, type Board } from '../db/database'
import { MAX_LIMIT, LeaderboardsService } from './leaderboards.service'

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
        @Query('limit', new DefaultValuePipe(MAX_LIMIT), ParseIntPipe)
        limit: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number
    ) {
        if (!BOARDS.includes(board as Board)) {
            throw new BadRequestException(
                `board must be one of ${BOARDS.join(', ')}`
            )
        }

        if (limit < 1 || limit > MAX_LIMIT) {
            throw new BadRequestException(
                `limit must be between 1 and ${MAX_LIMIT}`
            )
        }

        if (offset < 0 || !Number.isSafeInteger(offset)) {
            throw new BadRequestException('offset is out of range')
        }

        return this.leaderboards.getBoard(board as Board, limit, offset)
    }
}
