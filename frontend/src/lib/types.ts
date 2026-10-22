export type Board = 'no_mod' | 'free_mod'
export type RunPhase = 'download' | 'running'
export type ClaimedOutcome = 'fc' | 'a_skip' | 'free_skip' | 'unplayable'
export type SkipKind = 'a_skip' | 'free_skip'

export type RunStatus =
    | 'active'
    | 'pending_final'
    | 'validating'
    | 'complete'
    | 'void'
    | 'abandoned'

export type MapOutcome =
    | 'unjudged'
    | 'fc'
    | 'a_skip'
    | 'free_skip'
    | 'unplayable'
    | 'incomplete_final'

export interface APIMod {
    acronym: string
    settings?: Record<string, unknown>
}

export interface Identity {
    id: number
    username: string
}

export interface ServedMap {
    seq_index: number
    map_id: number
    set_id: number
    served_at: string
    original_star_rating: number
    difficulty_name: string
    hit_length: number
    total_length: number
    map_max_combo: number | null
    artist: string
    artist_unicode: string | null
    title: string
    title_unicode: string | null
    creator: string
    bpm: number | null
    cover_updated_at: string | null
    nsfw: boolean
}

export interface Clock {
    serverNow: string
    phase: RunPhase
    mainSecondsLeft: number
    prepSecondsLeft: number
}

export interface RunState extends Clock {
    id: number
    status: RunStatus
    awaitingValidation: boolean
    fcCount: number | null
    freeSkipUsed: boolean
    currentMap: ServedMap | null
    claimedFcCount: number
}

export interface StartedRun {
    id: number
    pool_version: number
    declared_mode: Board
    status: RunStatus
    started_at: string
}

export interface BoardRow {
    id: number
    user_id: number
    username: string
    fc_count: number | null
    resolved_board: Board | null
    pool_version: number
    active_elapsed: number
    ended_at: string | null
    avg_fc_score: number | null
    avg_fc_accuracy: number | null
}

export interface BoardPage {
    rows: BoardRow[]
    total: number
}

export interface RunDetailMap {
    seq_index: number
    map_id: number
    set_id: number
    claimed_outcome: ClaimedOutcome | null
    outcome: MapOutcome
    confirmed: boolean
    original_star_rating: number
    difficulty_name: string
    total_length: number
    map_max_combo: number | null
    mods: APIMod[] | null
    score_max_combo: number | null
    confirmed_score_id: string | null
    total_score: number | null
    accuracy: number | null
    served_at: string
    score_started_at: string | null
    score_ended_at: string | null
    artist: string
    artist_unicode: string | null
    title: string
    title_unicode: string | null
    creator: string
    bpm: number | null
    cover_updated_at: string | null
    nsfw: boolean
}

export interface RunDetail {
    status: 'complete'
    run: {
        id: number
        user_id: number
        username: string
        seed: string
        pool_version: number
        declared_mode: Board
        resolved_board: Board | null
        fc_count: number | null
        active_elapsed: number
        started_at: string
        ended_at: string | null
        truncated_at_index: number | null
        truncation_reason: TruncationReason | null
    }
    maps: RunDetailMap[]
}

export interface UnfinishedRun {
    status: Exclude<RunStatus, 'complete'>
    id: number
    delayed: boolean
    awaitingValidation: boolean
}

export type RunLookup = RunDetail | UnfinishedRun

export type TruncationReason =
    | 'banned_mod'
    | 'over_limit'
    | 'missing_score'
    | 'rejected_unplayable'
    | 'not_qualifying'

export interface ProfileBoard {
    board: Board
    best: {
        id: number
        fc_count: number | null
        ended_at: string | null
        pool_version: number
    } | null
    rank: number | null
}

export interface Profile {
    user: {
        osu_user_id: number
        username: string
    }
    completedRuns: number
    totalFcs: number
    totalElapsed: number
    runsByBoard: Record<Board, number>
    accuracy: number | null
    boards: ProfileBoard[]
}
