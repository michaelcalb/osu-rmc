<template>
    <section>
        <h3>buttons</h3>

        <button v-if="!hasMap" :disabled="busy" @click="emit('reveal')">
            begin
        </button>

        <template v-else>
            <button
                :disabled="busy || !canSignalStart"
                @click="emit('startMap')"
            >
                start map
            </button>
            <button :disabled="busy" @click="emit('reveal')">next map</button>
            <button :disabled="busy" @click="emit('skip', 'a_skip')">
                skip (A rank)
            </button>
            <button
                :disabled="busy || freeSkipUsed"
                @click="emit('skip', 'free_skip')"
            >
                skip (free)
            </button>
            <button :disabled="busy" @click="emit('unplayable')">
                unplayable
            </button>
        </template>

        <button :disabled="busy" @click="emit('end')">
            end run (submit to lb)
        </button>
        <button :disabled="busy" @click="emit('abandon')">
            abandon run (will be discarded)
        </button>
    </section>
</template>

<script setup lang="ts">
import type { SkipKind } from '../../../lib/types'

defineProps<{
    hasMap: boolean
    busy: boolean
    canSignalStart: boolean
    freeSkipUsed: boolean
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
