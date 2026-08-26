import type { RunPhase } from "../db/database";

export const PREP_WINDOW_SECONDS = 60
export const RUN_LIMIT_SECONDS = 3600

export interface ClockInput {
    active_elapsed: number
    phase: RunPhase
    phase_since: Date
}

export interface ClockSnapshot {
    activeElapsed: number
    mainSecondsLeft: number
    prepSecondsLeft: number
    expired: boolean
}

export function readClock(run: ClockInput, now: Date): ClockSnapshot {
    const sincePhase = (now.getTime() - run.phase_since.getTime()) / 1000

    const prepSecondsLeft =
        run.phase === 'download'
            ? Math.max(0, PREP_WINDOW_SECONDS - sincePhase)
            : 0
    
    const runningSeconds = 
        run.phase === 'download'
        ? Math.max(0, sincePhase - PREP_WINDOW_SECONDS)
        : sincePhase

    const activeElapsed = run.active_elapsed + runningSeconds

    return {
        activeElapsed,
        mainSecondsLeft: Math.max(0, RUN_LIMIT_SECONDS - activeElapsed),
        prepSecondsLeft,
        expired: activeElapsed >= RUN_LIMIT_SECONDS
    }
}

export function bankedElapsed(run: ClockInput, now: Date): number {
    return Math.round(readClock(run, now).activeElapsed)
}