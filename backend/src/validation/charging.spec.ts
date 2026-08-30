import { describe, expect, it } from '@jest/globals'
import { chargeSequence, type TimedMap } from './charging'

const T0 = new Date('2026-08-29T12:00:00Z')

function at(seconds: number): Date {
    return new Date(T0.getTime() + seconds * 1000)
}

function map(
    seq_index: number,
    served: number,
    resolved: number,
    playStarted: number | null
): TimedMap {
    return {
        seq_index,
        served_at: at(served),
        resolved_at: at(resolved),
        play_started_at: playStarted === null ? null : at(playStarted)
    }
}

describe('chargeSequence', () => {
    it('charges everything except the prep actually used', () => {
        const [result] = chargeSequence([map(0, 0, 130, 10)])

        expect(result.chargedSeconds).toBe(120)
    })

    it('charges play time even when the whole map fits inside 60 seconds', () => {
        const results = chargeSequence([
            map(0, 0, 50, 10),
            map(1, 50, 100, 60),
            map(2, 100, 150, 110)
        ])

        expect(results.map((r) => r.chargedSeconds)).toEqual([40, 40, 40])
    })

    it('charges nothing for a map dropped inside the window', () => {
        const [result] = chargeSequence([map(0, 0, 5, null)])

        expect(result.chargedSeconds).toBe(0)
    })

    it('caps justified prep at 60 seconds', () => {
        const [result] = chargeSequence([map(0, 0, 300, null)])

        expect(result.chargedSeconds).toBe(240)
    })

    it('accumulates across the sequence', () => {
        const results = chargeSequence([
            map(0, 0, 130, 10),
            map(1, 130, 260, 140)
        ])

        expect(results[0].cumulativeAtPlayStart).toBe(0)
        expect(results[1].cumulativeAtPlayStart).toBe(120)
    })

    it('marks a map whose play began after the hour was spent', () => {
        const results = chargeSequence([
            map(0, 0, 3700, 0),
            map(1, 3700, 3800, 3710)
        ])

        expect(results[0].withinLimit).toBe(true)
        expect(results[1].withinLimit).toBe(false)
    })

    it('a long prep can push the same map over the limit', () => {
        const results = chargeSequence([
            map(0, 0, 3550, 0),
            map(1, 3550, 3800, 3670)
        ])

        expect(results[1].cumulativeAtPlayStart).toBe(3610)
        expect(results[1].withinLimit).toBe(false)
    })
})