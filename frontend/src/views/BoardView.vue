<template>
    <section>
        <h2>{{ board }}</h2>

        <p v-if="loading">loading...</p>
        <p v-else-if="error">error: {{ error }}</p>
        <p v-else-if="rows.length === 0">no runs yet</p>

        <ol v-else :start="offset + 1">
            <li v-for="row in rows" :key="row.id">
                <p>run id: {{ row.id }}</p>
                <p>
                    user:
                    <RouterLink :to="`/users/${row.user_id}`">{{
                        row.username
                    }}</RouterLink>
                </p>
                <p>fcs: {{ row.fc_count }}</p>
                <p>board: {{ row.resolved_board }}</p>
                <p>avg fc score: {{ row.avg_fc_score }}</p>
                <p>active elapsed: {{ row.active_elapsed }}</p>
                <p>pool version: {{ row.pool_version }}</p>
                <p>ended at: {{ row.ended_at }}</p>
                <RouterLink :to="`/runs/${row.id}`">view run</RouterLink>
            </li>
        </ol>
    </section>

    <section>
        <button :disabled="loading || offset === 0" @click="prev">prev</button>
        <button :disabled="loading || !hasNext" @click="next">
            next
        </button>
        <RouterLink to="/boards/no_mod">no_mod</RouterLink>
        <RouterLink to="/boards/free_mod">free_mod</RouterLink>
    </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ApiError, get } from '../lib/api'
import type { BoardRow } from '../lib/types'

const LIMIT = 25

const route = useRoute()
const board = computed(() => String(route.params.board))

const rows = ref<BoardRow[]>([])
const offset = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)
const hasNext = ref(false)

let latest = 0

async function load() {
    const token = ++latest

    loading.value = true
    error.value = null

    try {
        const page = await get<BoardRow[]>(
            `/leaderboards/${board.value}?limit=${LIMIT + 1}&offset=${offset.value}`
        )

        if (token !== latest) {
            return
        }

        hasNext.value = page.length > LIMIT
        rows.value = page.slice(0, LIMIT)
    } catch (e) {
        if (token !== latest) {
            return
        }

        error.value = e instanceof ApiError ? e.message : 'could not load board'
        rows.value = []
        hasNext.value = false
    } finally {
        if (token === latest) {
            loading.value = false
        }
    }
}

function next() {
    offset.value += LIMIT
    void load()
}

function prev() {
    offset.value = Math.max(0, offset.value - LIMIT)
    void load()
}

watch(
    board,
    () => {
        offset.value = 0
        void load()
    },
    { immediate: true }
)
</script>

<style scoped>

</style>