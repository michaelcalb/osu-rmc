import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException
} from '@nestjs/common'
import type { Request } from 'express'
import { readSession } from './session'

@Injectable()
export class SessionGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request>()

        if (readSession(req) === null) {
            throw new UnauthorizedException('not signed in')
        }

        return true
    }
}