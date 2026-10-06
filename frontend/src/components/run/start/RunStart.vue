<template>
    <section>
        <h2>start a run</h2>

        <label>
            mode
            <select v-model="declaredMode">
                <option value="no_mod">no_mod</option>
                <option value="free_mod">free_mod</option>
            </select>
        </label>

        <button :disabled="busy" @click="emit('start', declaredMode)">
            {{ starting ? 'starting...' : 'start' }}
        </button>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Board } from '../../../lib/types'

defineProps<{
    busy: boolean
    starting: boolean
}>()

const emit = defineEmits<{
    start: [mode: Board]
}>()

const declaredMode = ref<Board>('no_mod')
</script>
