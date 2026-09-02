<template>
    <p v-if="loading">loading...</p>
    <p v-else-if="error">error: {{ error }}</p>

    <template v-else-if="detail">
        <section>
            <h2>run {{ detail.run.id }}</h2>
            <p>user: {{ detail.run.username }} ({{ detail.run.user_id }})</p>
            <p>fcs: {{ detail.run.fc_count }}</p>
            <p>declared mode: {{ detail.run.declared_mode }}</p>
            <p>resolved board: {{ detail.run.resolved_board }}</p>
            <p>active elapsed: {{ detail.run.active_elapsed }}</p>
            <p>pool version: {{ detail.run.pool_version }}</p>
            <p>seed: {{ detail.run.seed }}</p>
            <p>started at: {{ detail.run.started_at }}</p>
            <p>ended at: {{ detail.run.ended_at }}</p>
        </section>

        <section>
            <h3>mods used</h3>
            <p v-if="modCounts.length === 0">none</p>
            <ul v-else>
                <li v-for="[acronym, count] in modCounts" :key="acronym">
                    {{ acronym }}: {{ count }}
                </li>
            </ul>
        </section>

        <section>
            <h3>maps</h3>
            <ol>
                <li v-for="m in detail.maps" :key="m.seq_index">
                    <p>seq_index: {{ m.seq_index }}</p>
                    <p>map_id: {{ m.map_id }}</p>
                    <p>{{ m.artist }} - {{ m.title }} ({{ m.creator }})</p>
                    <p>star rating: {{ m.original_star_rating }}</p>
                    <p>bpm: {{ m.bpm }}</p>
                    <p>total_length: {{ m.total_length }}</p>
                    <p>outcome: {{ m.outcome }}</p>
                    <p>confirmed: {{ m.confirmed }}</p>
                    <p>mods: {{ m.mods }}</p>
                    <p>
                        combo: {{ m.score_max_combo }} / {{ m.map_max_combo }}
                    </p>
                    <p>score id: {{ m.confirmed_score_id }}</p>
                    <p>nsfw: {{ m.nsfw }}</p>
                    <a
                        :href="`https://osu.ppy.sh/b/${m.map_id}`"
                        target="_blank"
                        rel="noreferrer"
                        >open beatmap</a
                    >
                </li>
            </ol>
        </section>
    </template>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ApiError, get } from '../lib/api'
import type { RunDetail } from '../lib/types'

const props = defineProps<{ id: string }>()

const detail = ref<RunDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const modCounts = computed<[string, number][]>(() => {
    const counts = new Map<string, number>()

    for (const map of detail.value?.maps ?? []) {
        for (const mod of map.mods ?? []) {
            counts.set(mod.acronym, (counts.get(mod.acronym) ?? 0) + 1)
        }
    }

    return [...counts.entries()].sort((a, b) => b[1] - a[1])
})

watch(
    () => props.id,
    async (id) => {
        loading.value = true
        error.value = null

        try {
            detail.value = await get<RunDetail>(`/leaderboards/runs/${id}`)
        } catch (e) {
            error.value =
                e instanceof ApiError ? e.message : 'could not load run'
            detail.value = null
        } finally {
            loading.value = false
        }
    },
    { immediate: true }
)
</script>