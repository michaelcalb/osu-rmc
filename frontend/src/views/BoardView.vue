<template>
    <section class="title-section">
        <h1 class="title">leaderboards</h1>
        <hr class="separator">
    </section>

    <div class="content-container">
        <nav class="lb-nav">
            <div class="lb-group">
                <div class="lb-toggle-group">
                    <RouterLink to="/boards/no_mod" :class="`lb-toggle ${board === 'no_mod' ? 'active' : ''}`">no mod</RouterLink>
                    <RouterLink to="/boards/free_mod" :class="`lb-toggle ${board === 'free_mod' ? 'active' : ''}`">free mod</RouterLink>
                </div>
                <span class="total-runs">{{ total }} run{{ total === 1 ? '' : 's' }}</span>
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
                    <PaginationPrev class="pagination-jump raw-btn">
                        <ChevronLeft />
                    </PaginationPrev>

                    <div class="pagination-page-group">
                        <template v-for="(item, index) in items" :key="index">
                            <PaginationListItem
                                class="pagination-page raw-btn"
                                v-if="item.type === 'page'"
                                :value="item.value"
                            />
                            <PaginationEllipsis v-else class="pagination-ellipsis" />
                        </template>
                    </div>

                    <PaginationNext class="pagination-jump raw-btn">
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
                        <th>FC</th>
                        <th>score</th>
                        <th>accuracy</th>
                        <th>time</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(row, index) in rows"
                        :key="row.id"
                        :class="`lb-row i-${offset + index + 1}`"
                        @click="router.push(`/runs/${row.id}`)"
                    >
                        <td>
                            <RouterLink :to="`/runs/${row.id}`" @click.stop>
                                {{ offset + index + 1 }}
                            </RouterLink>
                        </td>
                        <td>
                            <div class="user">
                                <RouterLink class="pfp-box" :to="`/users/${row.user_id}`" @click.stop>
                                        <img :src="`https://a.ppy.sh/${row.user_id}`" :alt="row.username" class="pfp" />
                                </RouterLink>
                                <RouterLink class="username" :to="`/users/${row.user_id}`" @click.stop>
                                    {{ row.username }}
                                </RouterLink>
                            </div>
                        </td>
                        <td>
                            {{ row.fc_count }}
                        </td>
                        <td>
                            {{ row.avg_fc_score === null ? '' : score.format(row.avg_fc_score) }}
                        </td>
                        <td>
                            {{ row.avg_fc_accuracy === null ? '' : accuracy.format(row.avg_fc_accuracy) }}
                        </td>
                        <td>
                            <TooltipRoot v-if="row.ended_at">
                                <TooltipTrigger as="time" :datetime="row.ended_at">
                                    {{ timeAgo(row.ended_at) }}
                                </TooltipTrigger>
                                <TooltipPortal>
                                    <TooltipContent class="tooltip" :side-offset="4">
                                        <p>
                                            {{ exactTime(row.ended_at).date }}
                                            <span class="tooltip-time">{{ exactTime(row.ended_at).time }}</span>
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

const LIMIT = 10
const score = new Intl.NumberFormat('en', { maximumFractionDigits: 0 })
const accuracy = new Intl.NumberFormat('en', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

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
.title-section {
    width: fit-content;
    margin-bottom: var(--default-spacing);
}

.separator {
    width: 100%;
    border: none;
    height: 2px;
    border-radius: 1rem;
    background-color: var(--border);
    margin: 5px 0;
}

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
    gap: .1rem;
    align-self: flex-start;
}

.lb-toggle-group {
    width: fit-content;
    display: flex;
    gap: .25rem;
    background-color: var(--bg);
    padding: .25rem .25rem;
    border-radius: .5rem;
}

.lb-toggle {
    padding: .4rem .8rem;
    border-radius: .25rem;
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
    gap: .25rem;
}

.pagination-jump {
    background-color: var(--bg);
    border-radius: .5rem;
    display: flex;
    align-items: center;
    padding: 0 .5rem;
    height: 2rem;
}

.pagination-page-group {
    display: flex;
    align-items: center;
    gap: .25rem;
}

.pagination-page-group > * {
    height: 2rem;
    aspect-ratio: 1;
}

.pagination-page {
    background-color: var(--bg);
    border: 2px solid var(--bg);
    border-radius: .5rem;
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
    border-spacing: 0 .25rem;
}

.lb-table :is(th, td) {
    text-align: left;
    min-width: 3rem;
}

.lb-table :is(th, td):first-child {
    width: 3rem;
    text-align: center;
}

.lb-table td {
    height: 48px;
}

.lb-table td:first-child {
    border-radius: .5rem 0 0 .5rem;
}

.lb-table td:last-child {
    border-radius: 0 .5rem .5rem 0;
}

.lb-h-row > * {
    font-weight: 400;
    color: var(--text-muted-2);
}

.i-1 {
    background-image: linear-gradient(to right, #d4af37, var(--bg) 15%);
    color: #d4af37;
}

.i-2 {
    background-image: linear-gradient(to right, #c0c0c0, var(--bg) 15%);
    color: #c0c0c0;
}
.i-3 {
    background-image: linear-gradient(to right, #cd7f32, var(--bg) 15%);
    color: #cd7f32;
}

.lb-row {
    cursor: pointer;
    background-color: var(--bg);
}

.lb-row > :first-child {
    color: var(--text);
}

.user {
    display: flex;
    align-items: center;
    gap: .5rem;
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

.tooltip-time {
    color: var(--text-muted-2);
}

.pfp {
    height: calc(48px * .8);
}

:deep(.tooltip) {
    background-color: var(--bg);
    border: 1px solid var(--surface);
    border-radius: .5rem;
    padding: .25rem .5rem;
    font-size: 1rem;
    animation: fade-in .1s;
}

:deep(.tooltip[data-state='closed']) {
    animation: fade-out .1s;
}

@keyframes fade-in {
    from {
        scale: .9;
        opacity: 0;
    }
}

@keyframes fade-out {
    to {
        scale: .9;
        opacity: 0;
    }
}
</style>