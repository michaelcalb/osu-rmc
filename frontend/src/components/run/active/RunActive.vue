<template>
    <section>
        <h2>run {{ run.id }}</h2>
        <p>status: {{ run.status }}</p>
        <p>claimed fcs: {{ run.claimedFcCount }}</p>
    </section>

    <RunClock
        :main-seconds-left="mainSecondsLeft"
        :prep-seconds-left="prepSecondsLeft"
        :phase="run.phase"
        :can-signal-start="canSignalStart"
        :time-up="timeUp"
    />

    <RunMap v-if="map" :map="map" />

    <RunControls
        :has-map="map !== null"
        :busy="busy"
        :can-signal-start="canSignalStart"
        :free-skip-used="run.freeSkipUsed"
        @reveal="emit('reveal')"
        @start-map="emit('startMap')"
        @skip="emit('skip', $event)"
        @unplayable="emit('unplayable')"
        @end="emit('end')"
        @abandon="emit('abandon')"
    />
</template>

<script setup lang="ts">
import type { RunState, ServedMap, SkipKind } from '../../../lib/types'
import RunClock from './RunClock.vue'
import RunControls from './RunControls.vue'
import RunMap from './RunMap.vue'

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
</script>
