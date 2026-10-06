<template>
    <section>
        <h2>run {{ runId }}</h2>
        <p>time's up, your run is ready to be validated</p>
        <p>
            if you are still playing the last map, finish it first before
            starting validation.
        </p>
        <button :disabled="busy" @click="emit('validate')">
            start validation
        </button>
        <button :disabled="busy" @click="emit('abandon')">
            delete run (will be discarded)
        </button>
    </section>
</template>

<script setup lang="ts">
defineProps<{
    runId: number
    busy: boolean
}>()

const emit = defineEmits<{
    validate: []
    abandon: []
}>()
</script>
