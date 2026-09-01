import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [DbModule],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
