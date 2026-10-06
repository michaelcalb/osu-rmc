<template>
    <section>
        <h3>clock</h3>
        <p>main seconds left: {{ Math.floor(mainSecondsLeft) }}</p>
        <p>prep seconds left: {{ Math.floor(prepSecondsLeft) }}</p>
        <p>phase: {{ phase }}</p>
        <p v-if="!canSignalStart">
            please, click on "start map" before starting the map!
        </p>
        <p v-else>main clock starts in {{ Math.ceil(prepSecondsLeft) }}</p>
        <p v-if="timeUp">
            time over! you should be redirected to the validation screen soon.
            if nothing happens, try reloading the page ;)
        </p>
    </section>
</template>

<script setup lang="ts">
import type { RunPhase } from '../../../lib/types'

defineProps<{
    mainSecondsLeft: number
    prepSecondsLeft: number
    phase: RunPhase
    canSignalStart: boolean
    timeUp: boolean
}>()
</script>
