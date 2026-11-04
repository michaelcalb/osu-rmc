<template>
    <section class="timer-container">
        <div class="timer-box">
            <span class="timer-label">run timer</span>
            <span :class="`mono timer ${prepSecondsLeft === 0 && 'active'}`">
                {{ formatClock(mainSecondsLeft) }}
            </span>
        </div>
        <div class="timer-box prep-timer-box">
            <span class="timer-label">prep timer</span>
            <span :class="`mono timer ${prepSecondsLeft > 0 && 'active'}`">
                {{ prepSecondsLeft }}
            </span>
        </div>
    </section>

    <hr class="separator" />

    <section class="map-container">
        <template v-if="map">
            <a
                :href="`https://osu.ppy.sh/b/${map.map_id}`"
                target="_blank"
                rel="noreferrer"
                class="map-link"
            >
                <div class="map-info">
                    <div class="map-meta">
                        <div class="map-difficulty">
                            <span
                                :style="{
                                    backgroundColor: starColor(
                                        map.original_star_rating
                                    ),
                                    color: starTextColor(
                                        map.original_star_rating
                                    )
                                }"
                                class="star-rating-label"
                            >
                                <Star
                                    :size="14"
                                    :fill="
                                        starTextColor(map.original_star_rating)
                                    "
                                />
                                {{ formatStars(map.original_star_rating) }}
                            </span>
                            <span class="difficulty-label">
                                {{ map.difficulty_name }}
                            </span>
                        </div>
                        <div class="map-song-meta">
                            <span class="map-title">
                                {{ map.title }}
                            </span>
                            <span class="map-artist">
                                {{ map.artist }}
                            </span>
                        </div>
                        <span class="map-creator">
                            mapped by
                            <span class="creator-name">{{ map.creator }}</span>
                        </span>
                    </div>

                    <div class="map-stats">
                        <span>
                            <Metronome />
                            {{ map.bpm }}
                        </span>
                        <span>
                            <Clock />
                            {{ formatDuration(map.total_length) }}
                        </span>
                    </div>
                </div>

                <MapCover :map="map" class="map-img" />
            </a>
        </template>

        <template v-else>
            <a href="#" class="map-link">
                <img :src="defaultBg" alt="no map" class="map-img" />
            </a>
        </template>

        <div class="timer-swap-btn-group">
            <button
                class="start-map-btn"
                :disabled="busy || !canSignalStart"
                @click="emit('startMap')"
            >
                <Play :size="48" />
                start map
            </button>
            <button
                class="next-map-btn"
                :disabled="busy || prepSecondsLeft > 0"
                @click="emit('reveal')"
            >
                <FastForward :size="48" />
                next map
            </button>
        </div>
    </section>

    <section class="controls-container">
        <button
            :disabled="busy || prepSecondsLeft > 0"
            :class="{ holding: holding === 'a_skip' }"
            @pointerdown="startHold('a_skip', () => emit('skip', 'a_skip'))"
            @pointerup="cancelHold"
            @pointerleave="cancelHold"
            @pointercancel="cancelHold"
        >
            skip (A rank)
        </button>
        <button
            :disabled="busy || run.freeSkipUsed"
            :class="{
                'skip-used': run.freeSkipUsed,
                holding: holding === 'free_skip'
            }"
            @pointerdown="
                startHold('free_skip', () => emit('skip', 'free_skip'))
            "
            @pointerup="cancelHold"
            @pointerleave="cancelHold"
            @pointercancel="cancelHold"
        >
            skip (free)
        </button>
        <button
            :disabled="busy"
            :class="{ holding: holding === 'unplayable' }"
            @pointerdown="startHold('unplayable', () => emit('unplayable'))"
            @pointerup="cancelHold"
            @pointerleave="cancelHold"
            @pointercancel="cancelHold"
        >
            unplayable
        </button>
    </section>

    <hr class="separator" />

    <div class="finish-run-btn-group">
        <button
            :disabled="busy"
            @click="emit('abandon')"
            class="abandon-run-btn"
        >
            abandon run
        </button>
        <button :disabled="busy" @click="emit('end')" class="end-run-btn">
            end run
        </button>
    </div>
</template>

<script setup lang="ts">
import { formatStars } from '../../../lib/format.ts'
import { formatClock, formatDuration } from '../../../lib/time.ts'
import { starColor, starTextColor } from '../../../lib/stars.ts'
import type { RunState, ServedMap, SkipKind } from '../../../lib/types'
import { Clock, FastForward, Metronome, Play, Star } from '@lucide/vue'
import defaultBg from '../../../assets/default-map-bg.jpg'
import { ref } from 'vue'
import MapCover from '../../MapCover.vue'

defineProps<{
    run: RunState
    map: ServedMap | null
    busy: boolean
    mainSecondsLeft: number
    prepSecondsLeft: number
    canSignalStart: boolean
    timeUp: boolean
}>()

const emit = defineEmits<{
    reveal: []
    startMap: []
    skip: [kind: SkipKind]
    unplayable: []
    end: []
    abandon: []
}>()

const HOLD_MS = 500
const holding = ref<string | null>(null)
let holdTimer: ReturnType<typeof setTimeout> | undefined

function startHold(key: string, action: () => void) {
    clearTimeout(holdTimer)
    holding.value = key
    holdTimer = setTimeout(() => {
        holding.value = null
        action()
    }, HOLD_MS)
}

function cancelHold() {
    clearTimeout(holdTimer)
    holding.value = null
}
</script>

<style scoped>
button:disabled {
    opacity: 0.33;
    cursor: not-allowed;
    pointer-events: none;
}

.timer-container {
    display: flex;
    justify-content: space-between;
}

.timer-box {
    display: flex;
    flex-direction: column;
}

.timer-label {
    font-size: 1.2rem;
    color: var(--text-muted-2);
}

.timer {
    font-size: 5rem;
    color: var(--text-muted-2);
}

.prep-timer-box {
    align-items: end;
}

.active {
    color: inherit;
}

.separator {
    margin: var(--default-spacing) 0;
}

.map-container {
    display: flex;
    justify-content: space-between;
    gap: var(--default-spacing);
}

.map-link {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 50%;
    overflow: hidden;
    border-radius: 1rem;
}

.map-link:hover .map-img {
    transform: scale(1.02);
}

.map-link > * {
    grid-area: 1 / 1;
}

.map-info {
    z-index: 1;
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    font-weight: 500;
}

.map-meta {
    flex: 1;
    min-width: 0;
    text-shadow: 1px 1px 2px #000;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.map-img {
    width: 100%;
    filter: brightness(50%);
    height: calc(
        (var(--content-max-width) - 2 * var(--default-spacing)) / 2 * 187 / 500
    );
    object-fit: cover;
    transition: 0.2s;
}

.map-song-meta {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.map-title {
    font-size: 1.6rem;
}

.map-artist {
    font-size: 1.2rem;
    font-weight: normal;
}

.map-difficulty {
    display: flex;
    align-items: center;
    gap: 0.5rem;
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

.difficulty-label {
    font-size: 1.1rem;
}

.map-creator {
    font-weight: 400;
}

.creator-name {
    font-weight: 500;
}

.difficulty-label,
.map-title,
.map-artist {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    padding: 1rem 0 1rem 1rem;
    margin: -1rem 0 -1rem -1rem;
    mask-image: linear-gradient(to right, black 90%, transparent 95%);
}

.map-stats {
    display: flex;
    flex-direction: column;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    border-radius: 0.5rem;
    height: fit-content;
    padding: 0.5rem 0.5rem;
    gap: 1rem;
}

.map-stats > * {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.25rem;
}

.timer-swap-btn-group {
    display: flex;
    gap: var(--default-spacing);
    flex: 1;
}

.timer-swap-btn-group > * {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.5rem;
    border-radius: 0.5rem;
    justify-content: center;
}

.start-map-btn {
    background-color: var(--accent-2);
}

.next-map-btn {
    background-color: var(--success);
}

.controls-container {
    margin-top: calc(var(--default-spacing) * 2);
    display: flex;
    justify-content: space-between;
    gap: var(--default-spacing);
}

.controls-container > * {
    flex: 1;
    padding: 1rem;
    font-size: 1.2rem;
    background: linear-gradient(var(--surface), var(--surface)) left / 0% 100%
        no-repeat var(--border);
    transition: background-size 0.1s;
    border-radius: 0.5rem;
    user-select: none;
    -webkit-touch-callout: none;
}

.controls-container > .holding {
    background-size: 100% 100%;
    transition: background-size 0.5s linear;
}

.skip-used {
    text-decoration: line-through;
}

.finish-run-btn-group {
    display: flex;
    justify-content: space-between;
    gap: var(--default-spacing);
}

.finish-run-btn-group > * {
    flex: 1;
    font-size: 1.2rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
}

.abandon-run-btn {
    background-color: #272727;
}

.end-run-btn {
    background-color: #722727;
}

@media (max-width: 700px) {
    .timer-container,
    .map-container,
    .timer-swap-btn-group,
    .controls-container,
    .finish-run-btn-group {
        flex-direction: column;
    }

    .map-link {
        width: 100%;
    }

    .timer-swap-btn-group > * {
        padding: 1rem;
    }
}
</style>
