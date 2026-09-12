import type {
    Board,
    ClaimedOutcome,
    MapOutcome,
    TruncationReason
} from '../db/database'
import type { OsuScore } from '../osu/osu.service'
import {
    hasBannedMod,
    isFullCombo,
    isNoModEquivalent,
    isSkipWorthy,
    unplayableClaimUpheld
} from './predicates'

export interface Position {
    seq_index: number
    claimed: ClaimedOutcome | null
    score: OsuScore | null
    withinLimit: boolean
    beatmapStatus: string | null
    isLast: boolean
}

export interface PositionVerdict {
    seq_index: number
    outcome: MapOutcome
    confirmed: boolean
    score: OsuScore | null
}

export interface RunVerdict {
    positions: PositionVerdict[]
    fcCount: number
    avgFcScore: number | null
    board: Board
    truncatedAt: number | null
    truncationReason: TruncationReason | null
}

export function judgeRun(positions: Position[]): RunVerdict {
    const verdicts: PositionVerdict[] = []
    let fcCount = 0
    let fcScoreSum = 0
    let truncatedAt: number | null = null
    let truncationReason: TruncationReason | null = null
    let allNoMod = true

    for (const position of positions) {
        const { seq_index, score } = position

        if (score && hasBannedMod(score.mods)) {
            truncatedAt = seq_index
            truncationReason = 'banned_mod'
            break
        }

        if (position.claimed === 'free_skip') {
            verdicts.push({
                seq_index,
                outcome: 'free_skip',
                confirmed: true,
                score: null
            })
            continue
        }

        if (position.claimed === 'unplayable') {
            if (!unplayableClaimUpheld(position.beatmapStatus)) {
                truncatedAt = seq_index
                truncationReason = 'rejected_unplayable'
                break
            }

            verdicts.push({
                seq_index,
                outcome: 'unplayable',
                confirmed: true,
                score: null
            })
            continue
        }

        if (!score) {
            if (!position.isLast) {
                truncatedAt = seq_index
                truncationReason = 'missing_score'
                break
            }

            verdicts.push({
                seq_index,
                outcome: 'incomplete_final',
                confirmed: false,
                score: null
            })
            continue
        }

        if (!isNoModEquivalent(score.mods)) {
            allNoMod = false
        }

        if (isFullCombo(score.statistics)) {
            if (!position.withinLimit) {
                truncatedAt = seq_index
                truncationReason = 'over_limit'
                break
            }

            verdicts.push({
                seq_index,
                outcome: 'fc',
                confirmed: true,
                score
            })
            fcCount++
            fcScoreSum += score.total_score
            continue
        }

        if (isSkipWorthy(score.rank, score.statistics)) {
            verdicts.push({
                seq_index,
                outcome: 'a_skip',
                confirmed: true,
                score
            })
            continue
        }

        truncatedAt = seq_index
        truncationReason = 'not_qualifying'
        break
    }

    return {
        positions: verdicts,
        fcCount,
        avgFcScore: fcCount > 0 ? fcScoreSum / fcCount : null,
        board: allNoMod ? 'no_mod' : 'free_mod',
        truncatedAt,
        truncationReason
    }
}
