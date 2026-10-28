<template>
    <div>
        <section>
            <h3>run</h3>
            <p>run time: {{ formatDuration(detail.run.active_elapsed) }}</p>
            <p v-if="pausedSeconds !== null">
                prep time: {{ formatDuration(pausedSeconds) }}
            </p>
            <p v-if="wallSeconds !== null">
                total time: {{ formatDuration(wallSeconds) }}
            </p>
        </section>
        <hr />
        <p>pool version: {{ detail.run.pool_version }}</p>
        <p>seed: {{ detail.run.seed }}</p>
        <hr />
        <section>
            <h3>mods used</h3>
            <p v-if="modCounts.length === 0">none</p>
            <ul v-else>
                <li v-for="[acronym, count] in modCounts" :key="acronym">
                    {{ acronym }}: {{ count }}
                </li>
            </ul>
        </section>
        <hr />
        <section>
            <h3>outcomes</h3>
            <ul>
                <li v-for="[outcome, count] in outcomeCounts" :key="outcome">
                    {{ OUTCOME_LABELS[outcome] }}: {{ count }}
                </li>
            </ul>
        </section>
        <hr />
    </div>
    <dl class="stat-board">
        <dt class="stat-label">board</dt>
        <dd class="stat-value">
            {{ formatBoard(detail.run.resolved_board) }}
            {{
                detail.run.declared_mode !== detail.run.resolved_board
                    ? '(converted)'
                    : null
            }}
        </dd>
    </dl>
    <dl class="main-stats">
        <div class="stat-box">
            <dt class="stat-label">FCs</dt>
            <dd class="stat-value">
                {{ detail.run.fc_count }}
            </dd>
        </div>
        <div class="stat-box">
            <dt class="stat-label">score</dt>
            <dd class="stat-value">
                {{ formatScore(detail.run.avg_fc_score) }}
            </dd>
        </div>
        <div class="stat-box">
            <dt class="stat-label">accuracy</dt>
            <dd class="stat-value">
                {{ formatAccuracy(detail.run.avg_fc_accuracy) }}
            </dd>
        </div>
    </dl>
    <section class="timeline-section">
        <h2 class="section-title">
            timeline
        </h2>
        <TooltipProvider :delay-duration="0">
            <table class="maps-table">
                <tbody>
                    <template v-for="m in maps" :key="m.seq_index">
                        <tr
                            v-if="m.seq_index === detail.run.truncated_at_index"
                            class="truncation-row"
                        >
                            <td class="map-index">
                                <span class="index-dot"><Flag :size="18" /></span>
                            </td>
                            <td :colspan="hasDisagreements ? 4 : 3">
                                <div class="truncation">
                                    <hr class="separator" />
                                    <span class="truncation-text">
                                        validation stopped: {{ truncationText }}
                                    </span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="map-index">
                                <span class="index-dot">{{ m.seq_index + 1 }}</span>
                            </td>
                            <td class="mono map-served-time">
                                {{
                                    formatClock(
                                        secondsBetween(
                                            detail.run.started_at,
                                            m.served_at
                                        )
                                    )
                                }}
                            </td>
                            <td>
                                <a
                                    :href="mapHref(m)"
                                    target="_blank"
                                    rel="noreferrer"
                                    :class="`map-link ${!m.confirmed_score_id && 'no-score'}`"
                                >
                                    <div class="map-info">
                                        <div class="map-difficulty">
                                            <span
                                                :style="{
                                                    backgroundColor: starColor(
                                                        m.original_star_rating
                                                    ),
                                                    color: starTextColor(
                                                        m.original_star_rating
                                                    )
                                                }"
                                                class="star-rating-label"
                                            >
                                                <Star
                                                    :size="14"
                                                    :fill="
                                                        starTextColor(
                                                            m.original_star_rating
                                                        )
                                                    "
                                                />
                                                {{
                                                    formatStars(m.original_star_rating)
                                                }}
                                            </span>
                                        </div>
                                        <span class="map-title">{{ m.title }}</span>
                                        <span v-if="m.mods?.length" class="map-mods">
                                            <template
                                                v-for="mod in m.mods"
                                                :key="mod.acronym"
                                            >
                                                <img
                                                    v-if="modIcon(modName(mod.acronym))"
                                                    :src="modIcon(modName(mod.acronym))"
                                                    :alt="mod.acronym"
                                                    :title="modName(mod.acronym)"
                                                    class="mod-icon"
                                                />
                                                <span v-else>{{
                                                    mod.acronym
                                                }}</span>
                                            </template>
                                        </span>
                                    </div>
                                    <MapCover
                                        :map="m"
                                        variant="slimcover"
                                        class="map-img"
                                    />
                                </a>
                            </td>
                            <td>
                                <div :class="`map-outcome outcome-${m.outcome}`">
                                    <component
                                        :is="OUTCOME_ICONS[m.outcome]"
                                    />
                                    <span>
                                        {{ OUTCOME_LABELS[m.outcome] }}
                                    </span>
                                </div>
                            </td>
                            <td v-if="hasDisagreements" class="map-claim">
                                <TooltipRoot v-if="disagrees(m)">
                                    <TooltipTrigger class="claim-trigger">
                                        <TriangleAlert 
                                            :size="20"
                                            :aria-label="`invalid claim on map ${m.seq_index + 1}`"
                                        />
                                    </TooltipTrigger>
                                    <TooltipPortal>
                                        <TooltipContent
                                            class="tooltip"
                                            :side-offset="4"
                                        >
                                            {{ CLAIM_TEXT[m.claimed_outcome!] }}
                                            <br />
                                            but
                                            {{ VERDICT_TEXT[m.outcome] }}
                                        </TooltipContent>
                                    </TooltipPortal>
                                </TooltipRoot>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </TooltipProvider>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
    ClaimedOutcome,
    MapOutcome,
    RunDetail,
    RunDetailMap,
    TruncationReason
} from '../../lib/types'
import { formatClock, formatDuration } from '../../lib/time'
import {
    formatAccuracy,
    formatBoard,
    formatScore,
    formatStars
} from '../../lib/format'
import MapCover from '../MapCover.vue'
import { modIcon, modName } from '../../lib/mods'
import { starColor, starTextColor } from '../../lib/stars'
import { CircleCheck, CircleChevronsRight, CircleDashed, CircleOff, Flag, Star, Ticket, TimerOff, TriangleAlert, type LucideIcon } from '@lucide/vue'
import {
    TooltipContent,
    TooltipPortal,
    TooltipProvider,
    TooltipRoot,
    TooltipTrigger
} from 'reka-ui'

const props = defineProps<{ detail: RunDetail }>()

const OUTCOME_LABELS: Record<MapOutcome, string> = {
    unjudged: 'unjudged',
    fc: 'FC',
    a_skip: 'skip',
    free_skip: 'free skip',
    unplayable: 'unplayable',
    incomplete_final: 'unfinished'
}

const CLAIM_TEXT: Record<ClaimedOutcome, string> = {
    fc: 'the player moved on, which counts as claiming an FC',
    a_skip: 'the player skipped this map with an A rank',
    free_skip: 'the player used their free skip here',
    unplayable: 'the player marked this map as unplayable'
}

const VERDICT_TEXT: Record<MapOutcome, string> = {
    unjudged: 'it was never judged',
    fc: 'the score is a full combo, so it counts as an FC',
    a_skip: 'the score has a miss, so it counts as an A-rank skip',
    free_skip: 'it counts as the free skip',
    unplayable: 'it counts as unplayable',
    incomplete_final: 'no score was found, so as the last map it counts as unfinished'
}

const OUTCOME_ICONS: Record<MapOutcome, LucideIcon> = {
    unjudged: CircleDashed,
    fc: CircleCheck,
    a_skip: CircleChevronsRight,
    free_skip: Ticket,
    unplayable: CircleOff,
    incomplete_final: TimerOff
}

const TRUNCATION_LABELS: Record<TruncationReason, string> = {
    banned_mod: 'banned mod used',
    rejected_unplayable:
        'invalid unplayable claim',
    missing_score: 'no score found',
    over_limit:
        'played after time ran out',
    not_qualifying: 'no FC or A rank'
}

const maps = computed(() => props.detail.maps)

const truncationText = computed(() => {
    const reason = props.detail.run.truncation_reason

    return reason ? TRUNCATION_LABELS[reason] : null
})

const outcomeCounts = computed(() => tally(maps.value.map((m) => m.outcome)))

const modCounts = computed(() =>
    tally(maps.value.flatMap((m) => (m.mods ?? []).map((mod) => mod.acronym)))
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

function disagrees(m: RunDetailMap): boolean {
    return (
        m.claimed_outcome !== null &&
        m.outcome !== 'unjudged' &&
        m.claimed_outcome !== m.outcome
    )
}

const hasDisagreements = computed(() => maps.value.some(disagrees))

function mapHref(m: RunDetailMap): string {
    return m.confirmed_score_id
        ? `https://osu.ppy.sh/scores/${m.confirmed_score_id}`
        : `https://osu.ppy.sh/b/${m.map_id}`
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

<style scoped>
.main-stats {
    display: flex;
}

.stat-board {
    display: flex;
}

.section-title {
    font-weight: 400;
    font-size: 1.5rem;
    background-color: var(--bg-2);
    width: fit-content;
    margin-left: .5rem;
    padding: .25rem 1rem;
    border-radius: 0.5rem 0.5rem 0 0;
    border: 2px solid var(--border);
    border-bottom: 2px solid var(--bg-2);
    transform: translateY(2px);
}

.timeline-section {
    margin-top: var(--default-spacing);
}

.maps-table {
    background-color: var(--bg-2);
    border: 2px solid var(--border);
    width: 100%;
    border-spacing: 0 .5rem;
    padding-right: .5rem;
    border-radius: .5rem;
}

.maps-table td {
    white-space: nowrap;
    text-align: left;
    padding: 0 .5rem;
    height: 50px;
    background-color: var(--bg);
}

.maps-table td:nth-child(2) {
    border-radius: .25rem 0 0 .25rem;
}

.maps-table td:last-child {
    border-radius: 0 .25rem .25rem 0;
}

.maps-table .map-index {
    position: relative;
    text-align: center;
    background-color: transparent;
    color: var(--text-muted-2);
}

.map-index::before {
    content: '';
    position: absolute;
    top: -.25rem;
    bottom: -.25rem;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    background-color: var(--surface);
}

tr:first-child .map-index::before {
    top: 50%;
}

tr:last-child .map-index::before {
    bottom: 50%;
}

.index-dot {
    position: relative;
    display: inline-grid;
    place-items: center;
    padding: .25rem;
    border-radius: 50%;
    border: 2px solid var(--surface);
    width: 100%;
    aspect-ratio: 1 / 1;
    background-color: var(--bg-2);
}

.maps-table .truncation-row td {
    background-color: transparent;
}

.truncation {
    display: grid;
    align-items: center;
    justify-items: center;
}

.truncation > * {
    grid-area: 1 / 1;
}

.truncation-text {
    padding: 0 .5rem;
    background-color: var(--bg-2);
    color: var(--text-muted-2);
    font-size: 1rem;
}

.maps-table .map-served-time {
    text-align: center;
}

.map-link {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    overflow: hidden;
    border-radius: .5rem;
}

.map-link > * {
    grid-area: 1 / 1;
}

.map-info {
    z-index: 1;
    display: flex;
    align-items: center;
    font-weight: 500;
    padding: 0 0.5rem;
    gap: 0.5rem;
    text-shadow: 1px 1px 2px #000;
}

.map-title {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    padding: 1rem 0 1rem 1rem;
    margin: -1rem 0 -1rem -1rem;
    mask-image: linear-gradient(to right, black 90%, transparent 95%);
}

.map-img {
    width: 100%;
    height: 50px;
    filter: brightness(50%);
    transform: scale(1.02);
    object-fit: cover;
    transition: 0.2s;
}

.no-score {
    filter: grayscale(1) brightness(75%);
}

.map-mods {
    display: flex;
    margin-left: auto;
}

.mod-icon {
    height: 1.5rem;
}

.star-rating-label {
    width: fit-content;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.9rem;
    text-shadow: none;
}

.map-outcome {
    display: flex;
    align-items: center;
    gap: .5rem;
}

.claim-trigger {
    display: flex;
    color: var(--text-muted-2);
    cursor: help;
}

.outcome-unjudged {
    color: #8b8fa8;
}

.outcome-fc {
    color: var(--old-7);
}

.outcome-a_skip {
    color: #7dd3fc;
}

.outcome-free_skip {
    color: #93a4f5;
}

.outcome-unplayable {
    color: var(--danger);
}

.outcome-incomplete_final {
    color: #fbbf24;
}
</style>
