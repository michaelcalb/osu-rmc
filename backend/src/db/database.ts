import type { Generated, JSONColumnType } from 'kysely'

export interface PoolVersionsTable {
    id: Generated<number>
    created_at: Generated<Date>
    map_count: number
}

export interface PoolMapsTable {
    map_id: number
    set_id: number
    star_rating: number
    difficulty_name: string
    hit_length: number
    total_length: number
    added_in_version: number
    removed_in_version: number | null
    max_combo: number | null
}

export interface PoolSetsTable {
    beatmapset_id: number
    artist: string
    artist_unicode: string | null
    title: string
    title_unicode: string | null
    creator: string
    bpm: number | null
    cover_updated_at: Date | null
    nsfw: boolean
}

export type RunStatus =
    | 'active'
    | 'pending_final'
    | 'validating'
    | 'complete'
    | 'void'
    | 'abandoned'

export type Board = 'no_mod' | 'free_mod'

export const BOARDS: Board[] = ['no_mod', 'free_mod']

export interface UsersTable {
    osu_user_id: number
    username: string
}

export type RunPhase = 'download' | 'running'

export type TruncationReason =
    | 'banned_mod'
    | 'over_limit'
    | 'missing_score'
    | 'rejected_unplayable'
    | 'not_qualifying'

export interface RunsTable {
    id: Generated<number>
    user_id: number
    seed: string
    pool_version: number
    declared_mode: Board
    resolved_sequence: JSONColumnType<number[]>
    status: Generated<RunStatus>
    started_at: Generated<Date>
    ended_at: Date | null
    validating_since: Date | null
    validation_requested_at: Date | null
    active_elapsed: Generated<number>
    phase: Generated<RunPhase>
    phase_since: Generated<Date>
    free_skip_used: Generated<boolean>
    fc_count: number | null
    avg_fc_score: number | null
    avg_fc_accuracy: number | null
    resolved_board: Board | null
    truncated_at_index: number | null
    truncation_reason: TruncationReason | null
}

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

type NullableJson<T extends object> = JSONColumnType<
    T | null,
    string | null,
    string | null
>

export type ClaimedOutcome = 'fc' | 'a_skip' | 'free_skip' | 'unplayable'

export interface RunMapsTable {
    run_id: number
    seq_index: number
    map_id: number
    set_id: number
    served_at: Generated<Date>
    outcome: Generated<MapOutcome>
    claimed_outcome: ClaimedOutcome | null
    confirmed: Generated<boolean>

    original_star_rating: number
    difficulty_name: string
    hit_length: number
    total_length: number
    map_max_combo: number | null

    statistics: NullableJson<Record<string, number>>
    maximum_statistics: NullableJson<Record<string, number>>
    mods: NullableJson<APIMod[]>
    confirmed_score_id: string | null
    total_score: number | null
    accuracy: number | null
    score_max_combo: number | null
    score_started_at: Date | null
    score_ended_at: Date | null
}

export interface Database {
    pool_versions: PoolVersionsTable
    pool_maps: PoolMapsTable
    pool_sets: PoolSetsTable
    users: UsersTable
    runs: RunsTable
    run_maps: RunMapsTable
}
