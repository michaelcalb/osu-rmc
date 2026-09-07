import { PREP_WINDOW_SECONDS, RUN_LIMIT_SECONDS } from '../runs/clock'

export interface TimedMap {
    seq_index: number
    served_at: Date
    resolved_at: Date
    play_started_at: Date | null
}

export interface ChargeResult {
    seq_index: number
    chargedSeconds: number
    cumulativeAtPlayStart: number
    withinLimit: boolean
}

function seconds(from: Date, to: Date): number {
    return Math.max(0, (to.getTime() - from.getTime()) / 1000)
}

export function chargeSequence(maps: TimedMap[]): ChargeResult[] {
    let cumulative = 0

    return maps.map((map) => {
        const elapsed = seconds(map.served_at, map.resolved_at)

        const prep = map.play_started_at
            ? seconds(map.served_at, map.play_started_at)
            : elapsed

        const justified = Math.min(PREP_WINDOW_SECONDS, prep)

        const cumulativeAtPlayStart =
            cumulative + Math.max(0, prep - PREP_WINDOW_SECONDS)

        const chargedSeconds = Math.max(0, elapsed - justified)

        const result = {
            seq_index: map.seq_index,
            chargedSeconds,
            cumulativeAtPlayStart,
            withinLimit: cumulativeAtPlayStart < RUN_LIMIT_SECONDS
        }

        cumulative += chargedSeconds

        return result
    })
}
