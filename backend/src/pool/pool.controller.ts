import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { DevRoutesGuard } from '../common/dev-routes.guard';
import { PoolService } from './pool.service';

@UseGuards(DevRoutesGuard)
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

    @Get(':version/sequence')
    sequence(
        @Param('version', ParseIntPipe) version: number,
        @Query('seed') seed: string
    ) {
        return this.poolService.resolveRunSequence(version, seed)
    }
}
