import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PoolService } from './pool.service';

@Controller('pool')
export class PoolController {
    constructor(private readonly poolService: PoolService) {}

    @Get(':version/count')
    count(@Param('version', ParseIntPipe) version: number) {
        return this.poolService.countMapsInVersion(version)
    }

    @Get(':version/maps')
    maps(
        @Param('version', ParseIntPipe) version: number,
        @Query('at') at: string
    ) {
        return this.poolService.getMapsAtIndices(
            version,
            at.split(',').map(Number)
        )
    }
}
