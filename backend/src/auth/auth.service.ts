import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { Kysely } from 'kysely'
import type { Database } from '../db/database'
import { KYSELY } from '../db/db.module'
import { requireEnv } from '../common/env'

const OSU_ROOT = 'https://osu.ppy.sh'
const TIMEOUT_MS = 15_000
const SCOPE = 'identify'

export interface OsuIdentity {
    id: number
    username: string
}

@Injectable()
export class AuthService {
    constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

    buildAuthorizeUrl(state: string): string {
        const url = new URL(`${OSU_ROOT}/oauth/authorize`)

        url.searchParams.set('client_id', requireEnv('OSU_CLIENT_ID'))
        url.searchParams.set('redirect_uri', requireEnv('OSU_REDIRECT_URI'))
        url.searchParams.set('response_type', 'code')
        url.searchParams.set('scope', SCOPE)
        url.searchParams.set('state', state)

        return url.toString()
    }

    async login(code: string): Promise<OsuIdentity> {
        const token = await this.exchangeCode(code)
        const identity = await this.fetchIdentity(token)

        await this.upsertUser(identity)

        return identity
    }

    async findUser(osuUserId: number): Promise<OsuIdentity | null> {
        const user = await this.db
            .selectFrom('users')
            .select(['osu_user_id', 'username'])
            .where('osu_user_id', '=', osuUserId)
            .executeTakeFirst()

        if (!user) {
            return null
        }

        return { id: user.osu_user_id, username: user.username }
    }

    private async exchangeCode(code: string): Promise<string> {
        const res = await fetch(`${OSU_ROOT}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                client_id: Number(requireEnv('OSU_CLIENT_ID')),
                client_secret: requireEnv('OSU_CLIENT_SECRET'),
                grant_type: 'authorization_code',
                code,
                redirect_uri: requireEnv('OSU_REDIRECT_URI')
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS)
        })

        if (!res.ok) {
            throw new UnauthorizedException('osu! rejected the login code')
        }

        const body = (await res.json()) as { access_token: string }

        return body.access_token
    }

    private async fetchIdentity(token: string): Promise<OsuIdentity> {
        const res = await fetch(`${OSU_ROOT}/api/v2/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            },
            signal: AbortSignal.timeout(TIMEOUT_MS)
        })

        if (!res.ok) {
            throw new UnauthorizedException('could not read osu! identity')
        }

        const body = (await res.json()) as { id: number; username: string }

        return { id: body.id, username: body.username }
    }

    private async upsertUser(identity: OsuIdentity): Promise<void> {
        await this.db
            .insertInto('users')
            .values({
                osu_user_id: identity.id,
                username: identity.username
            })
            .onConflict((oc) =>
                oc
                    .column('osu_user_id')
                    .doUpdateSet({ username: identity.username })
            )
            .execute()
    }
}
