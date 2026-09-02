<template>
    <p v-if="loading">loading...</p>
    <p v-else-if="error">error: {{ error }}</p>

    <template v-else-if="result">
        <section v-if="waiting">
            <h2>validating</h2>
            <p>status: {{ result.run.status }}</p>
            <p v-if="secondsUntilResolvable > 0">
                waiting for your last score, about
                {{ Math.ceil(secondsUntilResolvable) }}s
            </p>
            <p v-else>checking with osu!</p>
        </section>

        <template v-else>
            <section>
                <h2>run {{ result.run.id }}</h2>
                <p>status: {{ result.run.status }}</p>
                <p>claimed fcs: {{ result.claimedFcCount }}</p>
                <p>confirmed fcs: {{ result.run.fc_count }}</p>
                <p>unconfirmed: {{ unconfirmed }}</p>
                <p>declared mode: {{ result.run.declared_mode }}</p>
                <p>resolved board: {{ result.run.resolved_board }}</p>
                <p>active elapsed: {{ result.run.active_elapsed }}</p>
                <p>pool version: {{ result.run.pool_version }}</p>
                <p>started at: {{ result.run.started_at }}</p>
                <p>ended at: {{ result.run.ended_at }}</p>
                <p>truncated at index: {{ result.run.truncated_at_index }}</p>
                <p>truncation reason: {{ result.run.truncation_reason }}</p>
            </section>

            <section>
                <h3>maps</h3>
                <ol>
                    <li v-for="m in result.maps" :key="m.seq_index">
                        <p>seq_index: {{ m.seq_index }}</p>
                        <p>map_id: {{ m.map_id }}</p>
                        <p>{{ m.artist }} - {{ m.title }} ({{ m.creator }})</p>
                        <p>star rating: {{ m.original_star_rating }}</p>
                        <p>total_length: {{ m.total_length }}</p>
                        <p>claimed: {{ m.claimed_outcome }}</p>
                        <p>outcome: {{ m.outcome }}</p>
                        <p>confirmed: {{ m.confirmed }}</p>
                        <p>mods: {{ m.mods }}</p>
                        <p>
                            combo: {{ m.score_max_combo }} /
                            {{ m.map_max_combo }}
                        </p>
                        <p>score id: {{ m.confirmed_score_id }}</p>
                        <p>served_at: {{ m.served_at }}</p>
                        <p>score_started_at: {{ m.score_started_at }}</p>
                        <p>score_ended_at: {{ m.score_ended_at }}</p>
                    </li>
                </ol>
            </section>
        </template>
    </template>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref } from 'vue';
import { ApiError, get } from '../lib/api';
import type { RunResult } from '../lib/types';

const props = defineProps<{ id: string }>()

const POLL_MS = 3000
const PREP_WINDOW_SECONDS = 60
const SCORE_PUBLISH_DELAY_SECONDS = 10

const result = ref<RunResult | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const waiting = computed(
    () =>
        result.value?.run.status === 'pending_final' ||
        result.value?.run.status === 'validating'
)

const unconfirmed = computed(() =>
    result.value
        ? result.value.claimedFcCount - (result.value.run.fc_count ?? 0)
        : 0
)

const secondsUntilResolvable = computed(() => {
    const last = result.value?.maps.at(-1)

    if (!last) {
        return 0
    }

    const resolvable =
        new Date(last.served_at).getTime() +
        (PREP_WINDOW_SECONDS +
            last.total_length +
            SCORE_PUBLISH_DELAY_SECONDS) *
            1000

    return Math.max(0, (resolvable - Date.now()) / 1000)
})

let timer: ReturnType<typeof setTimeout> | null = null

onScopeDispose(() => {
    if (timer) {
        clearTimeout(timer)
    }
})

async function fetchResult() {
    try {
        result.value = await get<RunResult>(`/runs/${props.id}/result`)
    } catch (e) {
        error.value = e instanceof ApiError ? e.message : 'could not load result'
    } finally {
        loading.value = false
    }

    if (waiting.value) {
        timer = setTimeout(fetchResult, POLL_MS)
    }
}

onMounted(fetchResult)
</script>