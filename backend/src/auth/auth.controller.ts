import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    Req,
    Res,
    UnauthorizedException
} from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import {
    SESSION_COOKIE,
    STATE_COOKIE,
    STATE_COOKIE_PATH,
    readSession,
    sessionCookieOptions,
    sessionValue,
    stateCookieOptions
} from './session'

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Get('login')
    login(@Res() res: Response) {
        const state = randomBytes(16).toString('hex')

        res.cookie(STATE_COOKIE, state, stateCookieOptions())
        res.redirect(this.auth.buildAuthorizeUrl(state))
    }

    @Get('callback')
    async callback(
        @Query('code') code: string | undefined,
        @Query('state') state: string | undefined,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const expected = req.signedCookies?.[STATE_COOKIE]

        res.clearCookie(STATE_COOKIE, { path: STATE_COOKIE_PATH })

        if (
            !code ||
            !state ||
            typeof expected !== 'string' ||
            state !== expected
        ) {
            throw new UnauthorizedException('invalid login attempt')
        }

        const identity = await this.auth.login(code)

        res.cookie(
            SESSION_COOKIE,
            sessionValue(identity.id),
            sessionCookieOptions()
        )

        const frontend = process.env.FRONTEND_URL

        if (!frontend) {
            throw new Error('FRONTEND_URL is not set')
        }

        res.redirect(frontend)
    }

    @Get('me')
    async me(@Req() req: Request) {
        const userId = readSession(req)

        if (userId === null) {
            return null
        }

        return this.auth.findUser(userId)
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie(SESSION_COOKIE, { path: '/' })
    }
}
