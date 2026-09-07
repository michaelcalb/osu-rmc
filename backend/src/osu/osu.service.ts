import { Injectable } from '@nestjs/common';
import { requireEnv } from '../common/env';

const OSU_ROOT = 'https://osu.ppy.sh'
const API = `${OSU_ROOT}/api/v2`
const API_VERSION = '20220705'
const TIMEOUT_MS = 15_000
const TOKEN_MARGIN_SECONDS = 60
const MIN_REQUESTS_INTERVAL_MS = 1000

export const SCORE_PUBLISH_DELAY_SECONDS = 10

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

export interface OsuBeatmap {
    id: number
    beatmapset_id: number
    status: string
    total_length: number
    hit_length: number
}

export class OsuHttpError extends Error {
    constructor(
        readonly status: number,
        message: string
    ) {
        super(message)
    }
}

@Injectable()
export class OsuService {
    private token: string | null = null
    private tokenExpiresAt = 0
    private queue: Promise<unknown> = Promise.resolve()
    private lastRequestAt = 0

    async getRecentScores(osuUserId: number): Promise<OsuScore[]> {
        return this.get<OsuScore[]>(`/users/${osuUserId}/scores/recent`, {
            mode: 'osu',
            include_fails: '0',
            limit: '100'
        })
    }

    private get<T>(
        endpoint: string,
        params: Record<string, string> = {}
    ): Promise<T> {
        return this.schedule(async () => {
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
                throw new OsuHttpError(
                    res.status,
                    `osu! GET ${url.pathname}${url.search} -> ${res.status} ${await res.text()}`
                )
            }
            
            return (await res.json()) as T
        })
    }

    private schedule<T>(fn: () => Promise<T>): Promise<T> {
        const result = this.queue.then(async () => {
            const wait = this.lastRequestAt + MIN_REQUESTS_INTERVAL_MS - Date.now()

            if (wait > 0) {
                await new Promise((resolve) => setTimeout(resolve, wait))
            }

            this.lastRequestAt = Date.now()

            return fn()
        })

        this.queue = result.catch(() => undefined)

        return result
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

    async getBeatmapStatus(beatmapId: number): Promise<string | null> {
        try {
            const beatmap = await this.get<OsuBeatmap>(`/beatmaps/${beatmapId}`)

            return beatmap.status
        } catch (error) {
            if (error instanceof OsuHttpError && error.status === 404) {
                return null
            }

            throw error
        }
    }
}
