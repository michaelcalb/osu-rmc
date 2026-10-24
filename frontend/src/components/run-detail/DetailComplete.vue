<template>
    <section class="main-stats">
        <div class="stat-box">
            <dt class="stat-label">FC</dt>
            <dd class="stat-value">
                {{ detail.run.fc_count }}
            </dd>
        </div>
        <!-- <p>claimed: {{ claimedFcCount }}</p> -->
        <!-- <p v-if="unconfirmed > 0">not confirmed: {{ unconfirmed }}</p> -->
        <!-- <p v-if="truncationText">
            counting stopped at map
            {{ (detail.run.truncated_at_index ?? 0) + 1
            }}<span v-if="truncatedMap"> ({{ mapName(truncatedMap) }})</span>:
            {{ truncationText }}
        </p> -->
        <!-- <p v-else>every map played was judged</p> -->
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
        <p v-if="detail.run.avg_fc_score !== null">
            average run score:
            {{ formatScore(detail.run.avg_fc_score) }}
        </p>
        <p v-if="detail.run.avg_fc_accuracy !== null">
            average run accuracy:
            {{ formatAccuracy(detail.run.avg_fc_accuracy) }}
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
            {{ formatStars(avgFcStars) }}
        </p>
        <p v-if="avgServedStars !== null">
            average star rating served: {{ formatStars(avgServedStars) }}
        </p>
        <p v-if="avgFcBpm !== null">
            average bpm of confirmed fcs: {{ Math.round(avgFcBpm) }}
        </p>
        <p v-if="hardestFc">
            hardest fc:
            {{ formatStars(hardestFc.original_star_rating) }}&#9733; -
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
                    {{ formatStars(m.original_star_rating) }}&#9733; -
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
                <p v-if="m.total_score !== null">
                    {{ formatScore(m.total_score) }}
                </p>
                <p v-if="m.accuracy !== null">
                    accuracy: {{ formatAccuracy(m.accuracy) }}
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

<script setup lang="ts">
import { computed } from 'vue'
import type {
    MapOutcome,
    RunDetail,
    RunDetailMap
    /* TruncationReason */
} from '../../lib/types'
import { formatDuration } from '../../lib/time'
import { formatAccuracy, formatScore, formatStars } from '../../lib/format'

const props = defineProps<{ detail: RunDetail }>()

const OUTCOME_LABELS: Record<MapOutcome, string> = {
    unjudged: 'not judged',
    fc: 'full combo',
    a_skip: 'a-skip',
    free_skip: 'free skip',
    unplayable: 'unplayable',
    incomplete_final: 'unfinished, time ran out'
}

/* const TRUNCATION_LABELS: Record<TruncationReason, string> = {
    banned_mod: 'the score on it used a banned mod',
    rejected_unplayable:
        'it was marked unplayable, but its status did not justify that',
    missing_score: 'no score was found for it',
    over_limit:
        'it was full-comboed, but the score landed outside the time limit',
    not_qualifying: 'the score was neither a full combo nor good enough to skip'
} */

const maps = computed(() => props.detail.maps)

const fcMaps = computed(() => maps.value.filter((m) => m.outcome === 'fc'))

/* const unconfirmed = computed(
    () =>
        maps.value.filter(
            (m) => m.claimed_outcome === 'fc' && m.outcome !== 'fc'
        ).length
) */

/* const claimedFcCount = computed(() => fcMaps.value.length + unconfirmed.value) */

/* const truncatedMap = computed(
    () =>
        maps.value.find(
            (m) => m.seq_index === props.detail.run.truncated_at_index
        ) ?? null
) */

/* const truncationText = computed(() => {
    const reason = props.detail.run.truncation_reason

    return reason ? TRUNCATION_LABELS[reason] : null
}) */

const outcomeCounts = computed(() => tally(maps.value.map((m) => m.outcome)))

const modCounts = computed(() =>
    tally(maps.value.flatMap((m) => (m.mods ?? []).map((mod) => mod.acronym)))
)

const avgFcStars = computed(() =>
    average(fcMaps.value.map((m) => m.original_star_rating))
)

const avgServedStars = computed(() =>
    average(maps.value.map((m) => m.original_star_rating))
)

const avgFcBpm = computed(() => average(fcMaps.value.map((m) => m.bpm)))

const hardestFc = computed(() =>
    best(fcMaps.value, (m) => m.original_star_rating)
)

const fastestFc = computed(() => best(fcMaps.value, (m) => m.bpm ?? 0))

const longestFc = computed(() => best(fcMaps.value, (m) => m.total_length))

const fcSeconds = computed(() =>
    fcMaps.value.reduce((total, m) => total + m.total_length, 0)
)

const wallSeconds = computed(() => {
    const run = props.detail.run

    return run.ended_at ? secondsBetween(run.started_at, run.ended_at) : null
})

const pausedSeconds = computed(() =>
    wallSeconds.value === null
        ? null
        : Math.max(0, wallSeconds.value - props.detail.run.active_elapsed)
)

const disagreements = computed(() =>
    maps.value.filter(
        (m) =>
            m.claimed_outcome !== null &&
            m.outcome !== 'unjudged' &&
            m.claimed_outcome !== m.outcome
    )
)

function average(values: (number | null)[]): number | null {
    const present = values.filter((value) => value !== null)

    return present.length
        ? present.reduce((total, value) => total + value, 0) / present.length
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
        ? secondsBetween(m.score_started_at, m.score_ended_at)
        : null
}

function prepSeconds(m: RunDetailMap): number | null {
    return m.score_started_at
        ? Math.max(0, secondsBetween(m.served_at, m.score_started_at))
        : null
}

function secondsBetween(from: string, to: string): number {
    return Math.round((Date.parse(to) - Date.parse(from)) / 1000)
}

function tally<T>(keys: T[]): [T, number][] {
    const counts = new Map<T, number>()

    for (const key of keys) {
        counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    return [...counts.entries()].sort((a, b) => b[1] - a[1])
}
</script>
