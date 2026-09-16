import type { OsuScore } from '../osu/osu.service'
import { isFullCombo } from './predicates'

const RANK_ORDER: readonly string[] = ['D', 'C', 'B', 'A', 'S', 'SH', 'X', 'XH']

export interface ServedMap {
    seq_index: number
    map_id: number
    served_at: Date
}

function isBetter(score: OsuScore, best: OsuScore): boolean {
    const scoreFc = isFullCombo(score.statistics)
    const bestFc = isFullCombo(best.statistics)

    if (scoreFc !== bestFc) {
        return scoreFc
    }

    if (!scoreFc && score.rank !== best.rank) {
        return RANK_ORDER.indexOf(score.rank) > RANK_ORDER.indexOf(best.rank)
    }

    return score.total_score > best.total_score
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

    return candidates.reduce((best, score) =>
        isBetter(score, best) ? score : best
    )
}
