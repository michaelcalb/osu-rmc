import { BeatmapAvailability } from '../osu/osu.service'

const BANNED_MODS: readonly string[] = ['AT', 'CN', 'RX', 'AP']
const NO_MOD_EQUIVALENT: readonly string[] = ['CL']
const SKIP_RANKS: readonly string[] = ['A', 'S', 'SH', 'X', 'XH']

const LEGACY_KEYS: readonly string[] = [
    'count_300',
    'count_100',
    'count_50',
    'count_geki',
    'count_katu',
    'count_miss'
]

const SUBMITTABLE_STATUSES: readonly string[] = [
    'ranked',
    'approved',
    'qualified',
    'loved'
]

export interface Mod {
    acronym: string
}

export type Statistics = Record<string, number>

export function assertModernShape(statistics: Statistics): void {
    for (const key of LEGACY_KEYS) {
        if (key in statistics) {
            throw new Error(
                `legacy judgement shape (${key}) - x-api-version 20220705 was not sent`
            )
        }
    }
}

export function isFullCombo(statistics: Statistics): boolean {
    assertModernShape(statistics)

    return (
        (statistics.miss ?? 0) === 0 && (statistics.large_tick_miss ?? 0) === 0
    )
}

export function isSkipWorthy(rank: string, statistics: Statistics): boolean {
    return SKIP_RANKS.includes(rank) && !isFullCombo(statistics)
}

export function hasBannedMod(mods: Mod[]): boolean {
    return mods.some((mod) => BANNED_MODS.includes(mod.acronym))
}

export function isNoModEquivalent(mods: Mod[]): boolean {
    return mods.every((mod) => NO_MOD_EQUIVALENT.includes(mod.acronym))
}

export function isSubmittable(status: string | null): boolean {
    return status !== null && SUBMITTABLE_STATUSES.includes(status)
}

export function unplayableClaimUpheld(
    availability: BeatmapAvailability
): boolean {
    return (
        availability.deleted ||
        availability.downloadDisabled ||
        !isSubmittable(availability.status)
    )
}
