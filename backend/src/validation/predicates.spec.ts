import { readFileSync } from "node:fs";
import * as path from 'node:path'
import {
    hasBannedMod,
    isFullCombo,
    isNoModEquivalent,
    isSkipWorthy,
    unplayableClaimUpheld,
    type Mod,
    type Statistics
} from './predicates'

interface Fixture {
    beatmap_id: number
    rank: string
    mods: Mod[]
    statistics: Statistics
}

function load(name: string): Fixture[] {
    return JSON.parse(
        readFileSync(path.join(__dirname, 'fixtures', name), 'utf8')
    ) as Fixture[]
}

const modern = load('scores-v20220705.json')
const legacy = load('scores-legacy.json')

describe('isFullCombo', () => {
    const expected = [false, false, false, false, true, true, true, true]

    expected.forEach((want, index) => {
        it(`fixture ${index} is ${want ? '' : 'not '}an FC`, () => {
            expect(isFullCombo(modern[index].statistics)).toBe(want)
        })
    })

    it('counts a no-mod FC that sits below max combo (forgiven tails)', () => {
        expect(modern[4].statistics.slider_tail_hit).toBe(84)
        expect(isFullCombo(modern[4].statistics)).toBe(true)
    })

    it('ignores small_tick_miss under Classic', () => {
        expect(modern[5].statistics.small_tick_miss).toBe(6)
        expect(isFullCombo(modern[5].statistics)).toBe(true)
    })

    it('rejects a dropped slider tick even at S rank', () => {
        expect(modern[2].statistics.large_tick_miss).toBe(1)
        expect(isFullCombo(modern[2].statistics)).toBe(false)
    })

    it('throws on a legacy shape instead of defaulting to FC', () => {
        expect(() => isFullCombo(legacy[0].statistics)).toThrow(/legacy/)
    })
})

describe('isSkipWorthy', () => {
    it('accepts A-rank that is not an FC', () => {
        expect(isSkipWorthy(modern[1].rank, modern[1].statistics)).toBe(true)
    })

    it('accepts S-rank that is not an FC', () => {
        expect(isSkipWorthy(modern[2].rank, modern[2].statistics)).toBe(true)
    })

    it('rejects an FC — it should advance, not unlock a skip', () => {
        expect(isSkipWorthy(modern[6].rank, modern[6].statistics)).toBe(false)
    })
})

describe('mods', () => {
    it('rejects Relax despite ranked: true and passed: true', () => {
        expect(hasBannedMod(modern[0].mods)).toBe(true)
    })

    it('treats Classic as no-mod', () => {
        expect(isNoModEquivalent(modern[1].mods)).toBe(true)
    })

    it('treats an empty mod array as no-mod', () => {
        expect(isNoModEquivalent(modern[3].mods)).toBe(true)
    })

    it('routes Relax to free-mod, not no-mod', () => {
        expect(isNoModEquivalent(modern[0].mods)).toBe(false)
    })
})

describe('unplayable claims', () => {
    it('upholds a claim on a deleted map', () => {
        expect(unplayableClaimUpheld(null)).toBe(true)
    })

    it('upholds a claim on a graveyarded map', () => {
        expect(unplayableClaimUpheld('graveyard')).toBe(true)
    })

    it('rejects a claim on a map that still submits scores', () => {
        expect(unplayableClaimUpheld('ranked')).toBe(false)
        expect(unplayableClaimUpheld('loved')).toBe(false)
    })
})