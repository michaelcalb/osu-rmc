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
    hit_length: number
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

export type Board = 'no_mod' | 'free_mod'

export interface UsersTable {
    osu_user_id: number
    username: string
}

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
    active_elapsed: Generated<number>
    rest_used: Generated<number>
    free_skip_used: Generated<boolean>
    fc_count: number | null
    resolved_board: Board | null
}

export interface Database {
    pool_versions: PoolVersionsTable
    pool_maps: PoolMapsTable
    pool_sets: PoolSetsTable
    users: UsersTable
    runs: RunsTable
}
