<template>
    <section>
        <h3>current map</h3>
        <p>seq_index: {{ map.seq_index }}</p>
        <p>map_id: {{ map.map_id }}</p>
        <p>set_id: {{ map.set_id }}</p>
        <p>artist: {{ map.artist }} / {{ map.artist_unicode }}</p>
        <p>title: {{ map.title }} / {{ map.title_unicode }}</p>
        <p>difficulty: {{ map.difficulty_name }}</p>
        <p>creator: {{ map.creator }}</p>
        <p>star rating: {{ map.original_star_rating }}</p>
        <p>bpm: {{ map.bpm }}</p>
        <p>total_length: {{ map.total_length }}</p>
        <p>hit_length: {{ map.hit_length }}</p>
        <p>map_max_combo: {{ map.map_max_combo }}</p>
        <p>nsfw: {{ map.nsfw }}</p>
        <p>cover_updated_at: {{ map.cover_updated_at }}</p>
        <p>served_at: {{ map.served_at }}</p>
        <a
            :href="`https://osu.ppy.sh/b/${map.map_id}`"
            target="_blank"
            rel="noreferrer"
            >open beatmap</a
        >
        <img
            :src="coverUrl(map.set_id, map.cover_updated_at)"
            :alt="`${map.artist} - ${map.title}`"
        />
    </section>
</template>

<script setup lang="ts">
import { coverUrl } from '../../../lib/covers'
import type { ServedMap } from '../../../lib/types'

defineProps<{ map: ServedMap }>()
</script>
