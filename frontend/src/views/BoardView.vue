<template>
    <section class="title-section">
        <h1 class="title">leaderboards</h1>
        <hr class="separator" />
    </section>

    <div class="content-container">
        <nav class="lb-nav">
            <div class="lb-group">
                <div class="toggle-group">
                    <RouterLink
                        to="/boards/no_mod"
                        :class="`toggle ${board === 'no_mod' ? 'active' : ''}`"
                        >no mod</RouterLink
                    >
                    <RouterLink
                        to="/boards/free_mod"
                        :class="`toggle ${board === 'free_mod' ? 'active' : ''}`"
                        >free mod</RouterLink
                    >
                </div>
                <span class="total-runs"
                    >{{ total }} run{{ total === 1 ? '' : 's' }}</span
                >
            </div>

            <PaginationRoot
                :page="page"
                :total="total"
                :items-per-page="LIMIT"
                :sibling-count="2"
                show-edges
                :disabled="loading"
                @update:page="goTo"
                class="pagination"
            >
                <PaginationList v-slot="{ items }" class="pagination-list">
                    <PaginationPrev class="pagination-jump">
                        <ChevronLeft />
                    </PaginationPrev>

                    <div class="pagination-page-group">
                        <template v-for="(item, index) in items" :key="index">
                            <PaginationListItem
                                class="pagination-page"
                                v-if="item.type === 'page'"
                                :value="item.value"
                            />
                            <PaginationEllipsis
                                v-else
                                class="pagination-ellipsis"
                            />
                        </template>
                    </div>

                    <PaginationNext class="pagination-jump">
                        <ChevronRight />
                    </PaginationNext>
                </PaginationList>
            </PaginationRoot>
        </nav>

        <p v-if="loading">loading...</p>
        <p v-else-if="error">error: {{ error }}</p>
        <p v-else-if="rows.length === 0">no runs yet</p>
        <TooltipProvider v-else :delay-duration="0">
            <table class="lb-table">
                <thead>
                    <tr class="lb-h-row">
                        <th></th>
                        <th></th>
                        <th>FCs</th>
                        <th>score</th>
                        <th>accuracy</th>
                        <th>time</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(row, index) in rows"
                        :key="row.id"
                        class="lb-row"
                        @click="router.push(`/runs/${row.id}`)"
                    >
                        <td>
                            <RouterLink
                                :to="`/runs/${row.id}`"
                                :class="`rank-${offset + index + 1}`"
                                @click.stop
                            >
                                #{{ offset + index + 1 }}
                            </RouterLink>
                        </td>
                        <td>
                            <div class="user">
                                <RouterLink
                                    class="pfp-box"
                                    :to="`/users/${row.user_id}`"
                                    @click.stop
                                >
                                    <img
                                        :src="`https://a.ppy.sh/${row.user_id}`"
                                        :alt="row.username"
                                        class="pfp"
                                    />
                                </RouterLink>
                                <RouterLink
                                    class="username"
                                    :to="`/users/${row.user_id}`"
                                    @click.stop
                                >
                                    {{ row.username }}
                                </RouterLink>
                            </div>
                        </td>
                        <td>
                            {{ row.fc_count }}
                        </td>
                        <td>
                            {{ formatScore(row.avg_fc_score) }}
                        </td>
                        <td>
                            {{ formatAccuracy(row.avg_fc_accuracy) }}
                        </td>
                        <td>
                            <TooltipRoot v-if="row.ended_at">
                                <TooltipTrigger
                                    as="time"
                                    :datetime="row.ended_at"
                                >
                                    {{ timeAgo(row.ended_at) }}
                                </TooltipTrigger>
                                <TooltipPortal>
                                    <TooltipContent
                                        class="tooltip"
                                        :side-offset="4"
                                    >
                                        <p>
                                            {{ exactTime(row.ended_at).date }}
                                            <span class="tooltip-time">{{
                                                exactTime(row.ended_at).time
                                            }}</span>
                                        </p>
                                    </TooltipContent>
                                </TooltipPortal>
                            </TooltipRoot>
                        </td>
                    </tr>
                </tbody>
            </table>
        </TooltipProvider>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import {
    PaginationEllipsis,
    PaginationList,
    PaginationListItem,
    PaginationNext,
    PaginationPrev,
    PaginationRoot,
    TooltipContent,
    TooltipPortal,
    TooltipProvider,
    TooltipRoot,
    TooltipTrigger
} from 'reka-ui'
import { ApiError, get } from '../lib/api'
import type { BoardPage, BoardRow } from '../lib/types'
import { exactTime, timeAgo } from '../lib/time'
import { formatAccuracy, formatScore } from '../lib/format'

const LIMIT = 10

const router = useRouter()

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
.content-container {
    display: flex;
    flex-direction: column;
    gap: var(--default-spacing);
}

.lb-nav {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.lb-group {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    align-self: flex-start;
}

.active {
    background-color: var(--surface);
}

.total-runs {
    align-self: flex-end;
    color: var(--text-muted-2);
}

.pagination-list {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.pagination-jump {
    background-color: var(--bg);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
    height: 2rem;
}

.pagination-page-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.pagination-page-group > * {
    height: 2rem;
    aspect-ratio: 1;
}

.pagination-page {
    background-color: var(--bg);
    border: 2px solid var(--bg);
    border-radius: 0.5rem;
}

.pagination-page[data-selected] {
    background-color: transparent;
}

.pagination-ellipsis {
    display: flex;
    justify-content: center;
    align-items: center;
}

.lb-table {
    width: 100%;
    border-spacing: 0 0.25rem;
}

.lb-table :is(th, td) {
    text-align: left;
    min-width: 3rem;
}

.lb-table :is(th, td):first-child {
    width: 1px;
    padding: 0 0.5rem;
    text-align: center;
}

.lb-table td {
    height: 48px;
}

.lb-table td:first-child {
    border-radius: 0.5rem 0 0 0.5rem;
}

.lb-table td:last-child {
    border-radius: 0 0.5rem 0.5rem 0;
}

.lb-h-row > * {
    font-weight: 400;
}

.lb-row {
    cursor: pointer;
    background-color: var(--bg-2);
    color: var(--text-muted-2);
}

.user {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.username {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex-shrink: 1;
    max-width: 10rem;
}

.username:hover {
    text-decoration: underline;
}

.pfp {
    height: calc(48px * 0.8);
}
</style>
