<template>
    <p v-if="loading">loading...</p>

    <section v-else-if="error">
        <p>error: {{ error }}</p>
        <p v-if="needsLogin"><button @click="goToLogin">log in</button></p>
    </section>

    <template v-if="result">
        <section v-if="waiting">
            <h2>validating</h2>
            <p>status: {{ result.run.status }}</p>
            <p v-if="slow">this run is taking a big longer to validate. dont worry, we're handling everything ;)</p>
        </section>

        <section v-else-if="noResult">
            <h2>run: {{ result.run.id }}</h2>
            <p>status: {{ result.run.status }}</p>
            <p v-if="result.run.status === 'void'">
                this run couldn't be validated,
                <RouterLink to="/help">but it can still be saved.</RouterLink>
            </p>
            <p v-else>this run was abandoned</p>
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
                        <p>difficulty: {{ m.difficulty_name }}</p>
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
import { ApiError, get, goToLogin } from '../lib/api';
import type { RunResult } from '../lib/types';

const props = defineProps<{ id: string }>()

const POLL_MS = 10000
const MAX_POLLS = 3

const result = ref<RunResult | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const needsLogin = ref(false)
const permanent = ref(false)
const polls = ref(0)

const waiting = computed(
    () =>
        result.value?.run.status === 'pending_final' ||
        result.value?.run.status === 'validating'
)

const noResult = computed(
    () =>
        result.value?.run.status === 'void' ||
        result.value?.run.status === 'abandoned'
)

const unconfirmed = computed(() =>
    result.value
        ? result.value.claimedFcCount - (result.value.run.fc_count ?? 0)
        : 0
)

const slow = computed(() => waiting.value && polls.value >= MAX_POLLS)

let timer: ReturnType<typeof setTimeout> | null = null

onScopeDispose(() => {
    if (timer) {
        clearTimeout(timer)
    }
})

async function fetchResult() {
    polls.value += 1

    try {
        result.value = await get<RunResult>(`/runs/${props.id}/result`)
        error.value = null
    } catch (e) {
        error.value = e instanceof ApiError ? e.message : 'could not reach the server'
        needsLogin.value = e instanceof ApiError && e.status === 401
        permanent.value = e instanceof ApiError && e.status < 500
    } finally {
        loading.value = false
    }

    const retry = !permanent.value && (waiting.value || error.value !== null)

    if (retry && polls.value < MAX_POLLS) {
        timer = setTimeout(fetchResult, POLL_MS)
    }
}

onMounted(fetchResult)
</script>