import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { OsuModule } from '../osu/osu.module';
import { ValidationService } from './validation.service';

@Module({
    imports: [DbModule, OsuModule],
    providers: [ValidationService],
    exports: [ValidationService]
})
export class ValidationModule {}
