import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LeaderboardsService } from './leaderboards.service';
import { LeaderboardsController } from './leaderboards.controller';

@Module({
  imports: [DbModule],
  providers: [LeaderboardsService],
  controllers: [LeaderboardsController]
})
export class LeaderboardsModule {}
