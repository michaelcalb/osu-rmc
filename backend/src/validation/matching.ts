import type { OsuScore } from '../osu/osu.service'
import { isFullCombo } from './predicates'

const RANK_ORDER: readonly string[] = ['D', 'C', 'B', 'A', 'S', 'SH', 'X', 'XH']

export interface ServedMap {
    seq_index: number
    map_id: number
    served_at: Date
}

export function matchScore(
    map: ServedMap,
    scores: OsuScore[]
): OsuScore | null {
    const candidates = scores.filter(
        (score) =>
            score.beatmap_id === map.map_id &&
            new Date(score.ended_at) > map.served_at
    )

    if (candidates.length === 0) {
        return null
    }

    const fc = candidates.find((score) => isFullCombo(score.statistics))

    if (fc) {
        return fc
    }

    return candidates.reduce((best, score) =>
        RANK_ORDER.indexOf(score.rank) > RANK_ORDER.indexOf(best.rank)
            ? score
            : best
    )
}
