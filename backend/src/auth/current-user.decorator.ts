import {
    createParamDecorator,
    ExecutionContext,
    UnauthorizedException
} from '@nestjs/common'
import { Request } from 'express'
import { readSession } from './session'

export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext): number => {
        const req = context.switchToHttp().getRequest<Request>()
        const userId = readSession(req)

        if (userId === null) {
            throw new UnauthorizedException('not signed in')
        }

        return userId
    }
)
