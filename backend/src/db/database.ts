import type { Generated } from 'kysely'

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

export interface Database {
    pool_versions: PoolVersionsTable
    pool_maps: PoolMapsTable
    pool_sets: PoolSetsTable
}
