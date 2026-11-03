import type { CookieOptions, Request } from 'express'

export const SESSION_COOKIE = 'rmc_session'
export const STATE_COOKIE = 'rmc_oauth_state'

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const STATE_MAX_AGE_MS = 10 * 60 * 1000

export const STATE_COOKIE_PATH = '/auth'

function baseOptions(): CookieOptions {
    return {
        httpOnly: true,
        signed: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
}

export function sessionCookieOptions(): CookieOptions {
    return { ...baseOptions(), path: '/', maxAge: SESSION_MAX_AGE_MS }
}

export function sessionValue(userId: number): string {
    return `${userId}:${Date.now()}`
}

export function stateCookieOptions(): CookieOptions {
    return {
        ...baseOptions(),
        path: STATE_COOKIE_PATH,
        maxAge: STATE_MAX_AGE_MS
    }
}

export function readSession(req: Request): number | null {
    const raw = req.signedCookies?.[SESSION_COOKIE]

    if (typeof raw !== 'string') {
        return null
    }

    const [id, issuedAt] = raw.split(':').map(Number)

    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(issuedAt)) {
        return null
    }

    return Date.now() - issuedAt < SESSION_MAX_AGE_MS ? id : null
}
