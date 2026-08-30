import type { Board, MapOutcome } from "../db/database";
import type { OsuScore } from "../osu/osu.service";
import {
    hasBannedMod,
    isFullCombo,
    isNoModEquivalent,
    isSkipWorthy,
    unplayableClaimUpheld
} from "./predicates";

export interface Position {
    seq_index: number
    claimed: MapOutcome
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
    board: Board
    truncatedAt: number | null
}

export function judgeRun(positions: Position[]): RunVerdict {
    const verdicts: PositionVerdict[] = []
    let fcCount = 0
    let truncatedAt: number | null = null
    let allNoMod = true

    for (const position of positions) {
        const { seq_index, score } = position

        if (score && hasBannedMod(score.mods)) {
            truncatedAt = seq_index
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
                break
            }

            verdicts.push({
                seq_index,
                outcome: 'fc',
                confirmed: true,
                score
            })
            fcCount++
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
        break
    }

    return {
        positions: verdicts,
        fcCount,
        board: allNoMod ? 'no_mod' : 'free_mod',
        truncatedAt
    }
}