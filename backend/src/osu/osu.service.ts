import { Injectable } from '@nestjs/common';

const OSU_ROOT = 'https://osu.ppy.sh'
const API = `${OSU_ROOT}/api/v2`
const API_VERSION = '20220705'
const TIMEOUT_MS = 15_000
const TOKEN_MARGIN_SECONDS = 60

export interface OsuMod {
    acronym: string
    settings?: Record<string, unknown>
}

export interface OsuScore {
    id: number
    beatmap_id: number
    rank: string
    mods: OsuMod[]
    passed: boolean
    ranked: boolean
    max_combo: number
    statistics: Record<string, number>
    maximum_statistics: Record<string, number>
    started_at: string
    ended_at: string
}

function requireEnv(name: string): string {
    const value = process.env[name]

    if (!value) {
        throw new Error(`${name} is not set`)
    }

    return value
}

@Injectable()
export class OsuService {
    private token: string | null = null
    private tokenExpiresAt = 0

    async getRecentScores(osuUserId: number): Promise<OsuScore[]> {
        return this.get<OsuScore[]>(`/users/${osuUserId}/scores/recent`, {
            limit: '100'
        })
    }

    private async get<T>(
        endpoint: string,
        params: Record<string, string> = {}
    ): Promise<T> {
        const url = new URL(`${API}${endpoint}`)

        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value)
        }

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${await this.getToken()}`,
                Accept: 'application/json',
                'x-api-version': API_VERSION
            },
            signal: AbortSignal.timeout(TIMEOUT_MS)
        })

        if (!res.ok) {
            throw new Error(
                `osu! GET ${url.pathname}${url.search} -> ${res.status} ${await res.text()}`
            )
        }

        return (await res.json()) as T
    }

    private async getToken(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpiresAt) {
            return this.token
        }

        const res = await fetch(`${OSU_ROOT}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                client_id: Number(requireEnv('OSU_CLIENT_ID')),
                client_secret: requireEnv('OSU_CLIENT_SECRET'),
                grant_type: 'client_credentials',
                scope: 'public'
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS)
        })

        if (!res.ok) {
            throw new Error(
                `osu! token request failed: ${res.status} ${await res.text()}`
            )
        }

        const body = (await res.json()) as {
            access_token: string
            expires_in: number
        }

        this.token = body.access_token
        this.tokenExpiresAt = Date.now() + (body.expires_in - TOKEN_MARGIN_SECONDS) * 1000

        return this.token
    }
}
