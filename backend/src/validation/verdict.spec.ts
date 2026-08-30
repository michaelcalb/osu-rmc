import { describe, expect, it } from '@jest/globals'
import type { OsuScore } from '../osu/osu.service'
import { judgeRun, type Position } from './verdict'

function score(overrides: Partial<OsuScore> = {}): OsuScore {
    return {
        id: 1,
        beatmap_id: 100,
        rank: 'S',
        mods: [],
        passed: true,
        ranked: true,
        max_combo: 100,
        statistics: {},
        maximum_statistics: {},
        started_at: '2026-08-29T12:00:00Z',
        ended_at: '2026-08-29T12:02:00Z',
        ...overrides
    }
}

function position(overrides: Partial<Position> = {}): Position {
    return {
        seq_index: 0,
        claimed: 'unjudged',
        score: score(),
        withinLimit: true,
        beatmapStatus: null,
        isLast: false,
        ...overrides
    }
}

function sequence(...positions: Partial<Position>[]): Position[] {
    return positions.map((overrides, index) =>
        position({
            seq_index: index,
            isLast: index === positions.length - 1,
            ...overrides
        })
    )
}

describe('judgeRun', () => {
    it('counts a clean run', () => {
        const verdict = judgeRun(sequence({}, {}, {}))

        expect(verdict.fcCount).toBe(3)
        expect(verdict.truncatedAt).toBeNull()
        expect(verdict.board).toBe('no_mod')
    })

    it('truncates at a gap and keeps what came before', () => {
        const verdict = judgeRun(
            sequence({}, {}, { score: null }, {}, {})
        )

        expect(verdict.fcCount).toBe(2)
        expect(verdict.truncatedAt).toBe(2)
    })

    it('allows a missing score on the final position', () => {
        const verdict = judgeRun(sequence({}, {}, { score: null }))

        expect(verdict.fcCount).toBe(2)
        expect(verdict.truncatedAt).toBeNull()
        expect(verdict.positions[2].outcome).toBe('incomplete_final')
        expect(verdict.positions[2].confirmed).toBe(false)
    })

    it('truncates at a banned mod', () => {
        const verdict = judgeRun(
            sequence({}, { score: score({ mods: [{ acronym: 'RX' }] }) }, {})
        )

        expect(verdict.fcCount).toBe(1)
        expect(verdict.truncatedAt).toBe(1)
    })

    it('accepts a free skip with no score at all', () => {
        const verdict = judgeRun(
            sequence({}, { claimed: 'free_skip', score: null }, {})
        )

        expect(verdict.fcCount).toBe(2)
        expect(verdict.truncatedAt).toBeNull()
        expect(verdict.positions[1].outcome).toBe('free_skip')
    })

    it('upholds an unplayable claim on a deleted map', () => {
        const verdict = judgeRun(
            sequence(
                {},
                { claimed: 'unplayable', score: null, beatmapStatus: null },
                {}
            )
        )

        expect(verdict.fcCount).toBe(2)
        expect(verdict.truncatedAt).toBeNull()
    })

    it('truncates on an unplayable claim for a map that still submits', () => {
        const verdict = judgeRun(
            sequence(
                {},
                { claimed: 'unplayable', score: null, beatmapStatus: 'ranked' },
                {}
            )
        )

        expect(verdict.fcCount).toBe(1)
        expect(verdict.truncatedAt).toBe(1)
    })

    it('accepts an A-rank that is not an FC as a skip', () => {
        const verdict = judgeRun(
            sequence(
                {},
                { score: score({ rank: 'A', statistics: { miss: 1 } }) },
                {}
            )
        )

        expect(verdict.fcCount).toBe(2)
        expect(verdict.positions[1].outcome).toBe('a_skip')
        expect(verdict.truncatedAt).toBeNull()
    })

    it('truncates on a pass that is neither an FC nor good enough to skip', () => {
        const verdict = judgeRun(
            sequence(
                {},
                { score: score({ rank: 'B', statistics: { miss: 4 } }) },
                {}
            )
        )

        expect(verdict.fcCount).toBe(1)
        expect(verdict.truncatedAt).toBe(1)
    })

    it('truncates when a map was played after the hour was spent', () => {
        const verdict = judgeRun(sequence({}, {}, { withinLimit: false }))

        expect(verdict.fcCount).toBe(2)
        expect(verdict.truncatedAt).toBe(2)
    })

    it('treats Classic as no-mod', () => {
        const verdict = judgeRun(
            sequence({ score: score({ mods: [{ acronym: 'CL' }] }) })
        )

        expect(verdict.board).toBe('no_mod')
    })

    it('routes to free-mod on any other mod', () => {
        const verdict = judgeRun(
            sequence({}, { score: score({ mods: [{ acronym: 'HD' }] }) })
        )

        expect(verdict.board).toBe('free_mod')
    })

    it('routes on skipped maps too, not just FCs', () => {
        const verdict = judgeRun(
            sequence({
                score: score({
                    rank: 'A',
                    mods: [{ acronym: 'DT' }],
                    statistics: { miss: 1 }
                })
            })
        )

        expect(verdict.board).toBe('free_mod')
    })
})