<template>
    <section>
        <h2>{{ board }}</h2>

        <p v-if="loading">loading...</p>
        <p v-else-if="error">error: {{ error }}</p>
        <p v-else-if="rows.length === 0">no runs yet</p>

        <ol v-else :start="offset + 1">
            <li v-for="row in rows" :key="row.id">
                <!-- <p>run id: {{ row.id }}</p> -->
                <RouterLink class="pfp-box" :to="`/users/${row.user_id}`">
                    <img :src="`https://a.ppy.sh/${row.user_id}`" :alt="row.username" class="pfp" />
                </RouterLink>
                <span>
                        {{ row.username }}
                </span>
                <span>{{ row.fc_count }}</span>
                <span>{{ row.avg_fc_score }}</span>
                <p>{{ row.active_elapsed }}</p>
                <p>pool version: {{ row.pool_version }}</p>
                <p>ended at: {{ row.ended_at }}</p>
                <RouterLink :to="`/runs/${row.id}`">view run</RouterLink>
            </li>
        </ol>
    </section>

    <section>
        <PaginationRoot
            :page="page"
            :total="total"
            :items-per-page="LIMIT"
            :sibling-count="2"
            :disabled="loading"
            @update:page="goTo"
        >
            <PaginationList v-slot="{ items }">
                <PaginationFirst>
                    <ChevronsLeft />
                </PaginationFirst>

                <PaginationPrev>
                    <ChevronLeft />
                </PaginationPrev>

                <template v-for="(item, index) in items" :key="index">
                    <PaginationListItem
                        v-if="item.type === 'page'"
                        :value="item.value"
                    />
                    <PaginationEllipsis v-else />
                </template>

                <PaginationNext>
                    <ChevronRight />
                </PaginationNext>

                <PaginationLast>
                    <ChevronsRight />
                </PaginationLast>
            </PaginationList>
        </PaginationRoot>
        <RouterLink to="/boards/no_mod">no_mod</RouterLink>
        <RouterLink to="/boards/free_mod">free_mod</RouterLink>
    </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from '@lucide/vue'
import {
    PaginationEllipsis,
    PaginationFirst,
    PaginationLast,
    PaginationList,
    PaginationListItem,
    PaginationNext,
    PaginationPrev,
    PaginationRoot
} from 'reka-ui'
import { ApiError, get } from '../lib/api'
import type { BoardPage, BoardRow } from '../lib/types'

const LIMIT = 10

const route = useRoute()
const board = computed(() => String(route.params.board))

const rows = ref<BoardRow[]>([])
const page = ref(1)
const offset = computed(() => (page.value - 1) * LIMIT)
const loading = ref(true)
const error = ref<string | null>(null)
const total = ref(0)

let latest = 0

async function load() {
    const token = ++latest

    loading.value = true
    error.value = null

    try {
        const result = await get<BoardPage>(
            `/leaderboards/${board.value}?limit=${LIMIT}&offset=${offset.value}`
        )

        if (token !== latest) {
            return
        }

        rows.value = result.rows
        total.value = result.total
    } catch (e) {
        if (token !== latest) {
            return
        }

        error.value = e instanceof ApiError ? e.message : 'could not load board'
        rows.value = []
        total.value = 0
    } finally {
        if (token === latest) {
            loading.value = false
        }
    }
}

function goTo(value: number) {
    page.value = value
    void load()
}

watch(
    board,
    () => {
        page.value = 1
        void load()
    },
    { immediate: true }
)
</script>

<style scoped>

</style>