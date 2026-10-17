<template>
    <p v-if="loading">loading...</p>
    <p v-else-if="error">error: {{ error }}</p>

    <template v-else-if="pending">
        <RunValidating v-if="validating" :run-id="pending.id" :slow="slow" :delayed="pending.delayed" />
        <RunVoid v-else-if="pending.status === 'void'" :run-id="pending.id" />
        <p v-else-if="pending.status === 'active'">
            run {{ pending.id }} is still in progress
        </p>
        <p v-else>run {{ pending.id }} was abandoned</p>
    </template>

    <template v-else-if="detail">
        <section>
            <h2>{{ detail.run.fc_count }} confirmed fcs</h2>
            <p>run {{ detail.run.id }} by {{ detail.run.username }}</p>
            <p>claimed: {{ claimedFcCount }}</p>
            <p v-if="unconfirmed > 0">not confirmed: {{ unconfirmed }}</p>

            <p v-if="truncationText">
                counting stopped at map
                {{ (detail.run.truncated_at_index ?? 0) + 1
                }}<span v-if="truncatedMap"> ({{ mapName(truncatedMap) }})</span
                >: {{ truncationText }}
            </p>
            <p v-else>every map played was judged</p>
        </section>

        <section>
            <h3>run</h3>
            <p>
                board: {{ detail.run.declared_mode }} &rarr;
                {{ detail.run.resolved_board }}
            </p>
            <p>time played: {{ formatDuration(detail.run.active_elapsed) }}</p>
            <p v-if="wallSeconds !== null">
                wall clock: {{ formatDuration(wallSeconds) }}
            </p>
            <p v-if="pausedSeconds !== null">
                paused / resting: {{ formatDuration(pausedSeconds) }}
            </p>
            <p>maps served: {{ maps.length }}</p>
            <p>time on confirmed fcs: {{ formatDuration(fcSeconds) }}</p>
            <p v-if="avgFcScore !== null">
                average run score:
                {{ Math.round(avgFcScore).toLocaleString() }}
            </p>
            <p v-if="avgFcAccuracy !== null">
                average run accuracy: {{ accuracy.format(avgFcAccuracy) }}
            </p>
            <p>pool version: {{ detail.run.pool_version }}</p>
            <p>seed: {{ detail.run.seed }}</p>
            <p>started: {{ detail.run.started_at }}</p>
            <p>ended: {{ detail.run.ended_at }}</p>
        </section>

        <section>
            <h3>outcomes</h3>
            <ul>
                <li v-for="[outcome, count] in outcomeCounts" :key="outcome">
                    {{ OUTCOME_LABELS[outcome] }}: {{ count }}
                </li>
            </ul>
        </section>

        <section>
            <h3>difficulty</h3>
            <p v-if="avgFcStars !== null">
                average star rating of confirmed fcs:
                {{ avgFcStars.toFixed(2) }}
            </p>
            <p v-if="avgServedStars !== null">
                average star rating served: {{ avgServedStars.toFixed(2) }}
            </p>
            <p v-if="avgFcBpm !== null">
                average bpm of confirmed fcs: {{ Math.round(avgFcBpm) }}
            </p>
            <p v-if="hardestFc">
                hardest fc:
                {{ hardestFc.original_star_rating.toFixed(2) }}&#9733; -
                {{ mapName(hardestFc) }}
            </p>
            <p v-if="fastestFc?.bpm">
                fastest fc: {{ Math.round(fastestFc.bpm) }} bpm -
                {{ mapName(fastestFc) }}
            </p>
            <p v-if="longestFc">
                longest fc: {{ formatDuration(longestFc.total_length) }} -
                {{ mapName(longestFc) }}
            </p>
            <p v-if="fcMaps.length === 0">no confirmed fcs</p>
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

        <section v-if="disagreements.length > 0">
            <h3>claims the validator did not agree with</h3>
            <ul>
                <li v-for="m in disagreements" :key="m.seq_index">
                    map {{ m.seq_index + 1 }}: claimed {{ m.claimed_outcome }},
                    judged
                    {{ OUTCOME_LABELS[m.outcome] }}
                </li>
            </ul>
        </section>

        <section>
            <h3>maps</h3>
            <ol>
                <li v-for="m in maps" :key="m.seq_index">
                    <p>{{ mapName(m) }} ({{ m.creator }})</p>
                    <p>
                        {{ m.original_star_rating.toFixed(2) }}&#9733; -
                        {{ formatDuration(m.total_length) }}
                        <span v-if="m.bpm"> - {{ Math.round(m.bpm) }} bpm</span>
                    </p>
                    <p>
                        {{ OUTCOME_LABELS[m.outcome] }}
                        <span v-if="m.outcome === 'unjudged'"
                            >- the run stopped counting before this map</span
                        >
                        <span v-else-if="!m.confirmed">(unconfirmed)</span>
                    </p>
                    <p v-if="m.claimed_outcome !== m.outcome">
                        claimed: {{ m.claimed_outcome ?? 'no claim' }}
                    </p>
                    <p v-if="m.score_max_combo !== null">
                        combo: {{ m.score_max_combo }} /
                        {{ m.map_max_combo ?? '?' }}
                        <span v-if="comboPercent(m) !== null"
                            >({{ comboPercent(m)!.toFixed(1) }}%)</span
                        >
                    </p>
                    <p v-if="m.mods && m.mods.length > 0">
                        mods: {{ m.mods.map((mod) => mod.acronym).join(', ') }}
                    </p>
                    <p v-if="prepSeconds(m) !== null">
                        time before starting:
                        {{ formatDuration(prepSeconds(m)!) }}
                    </p>
                    <p v-if="playSeconds(m) !== null">
                        time on the map: {{ formatDuration(playSeconds(m)!) }}
                    </p>
                    <p v-if="m.total_score !== null">{{ m.total_score }}</p>
                    <p v-if="m.accuracy !== null">
                        accuracy: {{ accuracy.format(m.accuracy) }}
                    </p>
                    <p v-if="m.confirmed_score_id">
                        score id: {{ m.confirmed_score_id }}
                    </p>
                    <p v-if="m.nsfw">nsfw</p>
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
import { computed, onScopeDispose, ref, watch } from 'vue'
import { ApiError, get } from '../lib/api'
import type {
    MapOutcome,
    RunDetail,
    RunDetailMap,
    RunLookup,
    TruncationReason,
    UnfinishedRun,
} from '../lib/types'
import { formatDuration } from '../lib/time'
import RunValidating from '../components/run/validating/RunValidating.vue'
import RunVoid from '../components/run/void/RunVoid.vue'

const props = defineProps<{ id: string }>()

const OUTCOME_LABELS: Record<MapOutcome, string> = {
    unjudged: 'not judged',
    fc: 'full combo',
    a_skip: 'a-skip',
    free_skip: 'free skip',
    unplayable: 'unplayable',
    incomplete_final: 'unfinished, time ran out'
}

const TRUNCATION_LABELS: Record<TruncationReason, string> = {
    banned_mod: 'the score on it used a banned mod',
    rejected_unplayable:
        'it was marked unplayable, but its status did not justify that',
    missing_score: 'no score was found for it',
    over_limit:
        'it was full-comboed, but the score landed outside the time limit',
    not_qualifying: 'the score was neither a full combo nor good enough to skip'
}

const accuracy = new Intl.NumberFormat('en', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})

const POLL_MS = 10000
const MAX_POLLS = 6

const detail = ref<RunDetail | null>(null)
const pending = ref<UnfinishedRun | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const polls = ref(0)

let timer: ReturnType<typeof setTimeout> | null = null

const validating = computed(
    () =>
        pending.value?.status === 'pending_final' ||
        pending.value?.status === 'validating'
)

const slow = computed(() => validating.value && polls.value >= MAX_POLLS)

const maps = computed(() => detail.value?.maps ?? [])

const fcMaps = computed(() => maps.value.filter((m) => m.outcome === 'fc'))

const claimedFcCount = computed(
    () =>
        maps.value.filter(
            (m) => m.claimed_outcome === 'fc' || m.outcome === 'fc'
        ).length
)

const unconfirmed = computed(
    () =>
        maps.value.filter(
            (m) => m.claimed_outcome === 'fc' && m.outcome !== 'fc'
        ).length
)

const truncatedMap = computed(() => {
    const index = detail.value?.run.truncated_at_index

    return index === null || index === undefined
        ? null
        : (maps.value.find((m) => m.seq_index === index) ?? null)
})

const truncationText = computed(() => {
    const reason = detail.value?.run.truncation_reason

    return reason ? TRUNCATION_LABELS[reason] : null
})

const outcomeCounts = computed<[MapOutcome, number][]>(() => {
    const counts = new Map<MapOutcome, number>()

    for (const m of maps.value) {
        counts.set(m.outcome, (counts.get(m.outcome) ?? 0) + 1)
    }

    return [...counts.entries()].sort((a, b) => b[1] - a[1])
})

const modCounts = computed<[string, number][]>(() => {
    const counts = new Map<string, number>()

    for (const m of maps.value) {
        for (const mod of m.mods ?? []) {
            counts.set(mod.acronym, (counts.get(mod.acronym) ?? 0) + 1)
        }
    }

    return [...counts.entries()].sort((a, b) => b[1] - a[1])
})

const avgFcStars = computed(() =>
    average(fcMaps.value.map((m) => m.original_star_rating))
)

const avgServedStars = computed(() =>
    average(maps.value.map((m) => m.original_star_rating))
)

const avgFcBpm = computed(() =>
    average(
        fcMaps.value
            .map((m) => m.bpm)
            .filter((bpm): bpm is number => bpm !== null)
    )
)

const avgFcScore = computed(() =>
    average(
        fcMaps.value
            .map((m) => m.total_score)
            .filter((score): score is number => score !== null)
    )
)

const avgFcAccuracy = computed(() =>
    average(
        fcMaps.value
            .map((m) => m.accuracy)
            .filter((value): value is number => value !== null)
    )
)

const hardestFc = computed(() =>
    best(fcMaps.value, (m) => m.original_star_rating)
)

const fastestFc = computed(() => best(fcMaps.value, (m) => m.bpm ?? 0))

const longestFc = computed(() => best(fcMaps.value, (m) => m.total_length))

const fcSeconds = computed(() =>
    fcMaps.value.reduce((total, m) => total + m.total_length, 0)
)

const wallSeconds = computed(() => {
    const run = detail.value?.run

    return run?.ended_at
        ? Math.round(
              (Date.parse(run.ended_at) - Date.parse(run.started_at)) / 1000
          )
        : null
})

const pausedSeconds = computed(() =>
    wallSeconds.value === null
        ? null
        : Math.max(
              0,
              wallSeconds.value - (detail.value?.run.active_elapsed ?? 0)
          )
)

const disagreements = computed(() =>
    maps.value.filter(
        (m) =>
            m.claimed_outcome !== null &&
            m.outcome !== 'unjudged' &&
            m.claimed_outcome !== m.outcome
    )
)

function average(values: number[]): number | null {
    return values.length
        ? values.reduce((total, value) => total + value, 0) / values.length
        : null
}

function best(
    candidates: RunDetailMap[],
    score: (m: RunDetailMap) => number
): RunDetailMap | null {
    return candidates.reduce<RunDetailMap | null>(
        (top, m) => (!top || score(m) > score(top) ? m : top),
        null
    )
}

function mapName(m: RunDetailMap): string {
    return `${m.artist} - ${m.title} [${m.difficulty_name}]`
}

function comboPercent(m: RunDetailMap): number | null {
    return m.map_max_combo && m.score_max_combo !== null
        ? (m.score_max_combo / m.map_max_combo) * 100
        : null
}

function playSeconds(m: RunDetailMap): number | null {
    return m.score_started_at && m.score_ended_at
        ? Math.round(
              (Date.parse(m.score_ended_at) - Date.parse(m.score_started_at)) /
                  1000
          )
        : null
}

function prepSeconds(m: RunDetailMap): number | null {
    return m.score_started_at
        ? Math.max(
              0,
              Math.round(
                  (Date.parse(m.score_started_at) - Date.parse(m.served_at)) /
                      1000
              )
          )
        : null
}

async function fetchRun(id: string) {
    try {
        const lookup = await get<RunLookup>(`/leaderboards/runs/${id}`)

        error.value = null
        detail.value = lookup.status === 'complete' ? lookup : null
        pending.value = lookup.status === 'complete' ? null : lookup
    } catch (e) {
        error.value = e instanceof ApiError ? e.message : 'could not load run'
        detail.value = null
        pending.value = null
    }
}

function stopPolling() {
    if (timer) {
        clearTimeout(timer)
        timer = null
    }
}

function armPoll(id: string) {
    if (timer || polls.value >= MAX_POLLS || !validating.value) {
        return
    }

    timer = setTimeout(async () => {
        timer = null
        polls.value += 1

        await fetchRun(id)

        armPoll(id)
    }, POLL_MS)
}

watch(
    () => props.id,
    async (id) => {
        stopPolling()
        polls.value = 0
        loading.value = true

        await fetchRun(id)

        loading.value = false
        armPoll(id)
    },
    { immediate: true }
)

onScopeDispose(stopPolling)
</script>
