import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';

@Module({
  imports: [DbModule],
  providers: [ProfilesService],
  controllers: [ProfilesController]
})
export class ProfilesModule {}
