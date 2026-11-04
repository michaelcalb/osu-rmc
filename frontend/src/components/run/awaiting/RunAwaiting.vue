<template>
    <section class="title-section">
        <h1 class="title">time is over!</h1>
        <hr class="separator" />
    </section>
    <section class="content">
        <p>if you are still playing the last map, finish it first.</p>
        <p>
            then, either start the validation (literally just click the button
            below) or delete it.
        </p>
        <p>if no action is taken in 8 hours, your run will be deleted.</p>
    </section>
    <section class="controls">
        <button
            class="validation-btn"
            :disabled="busy"
            @click="emit('validate')"
        >
            start validation
        </button>
        <button class="delete-btn" :disabled="busy" @click="emit('abandon')">
            delete run
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

<style scoped>
.content {
    display: flex;
    flex-direction: column;
    font-size: 1.1rem;
}

.controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--default-spacing);
    margin-top: var(--default-spacing);
}

.controls > * {
    border-radius: 1rem;
    corner-shape: squircle;
    font-size: 1.25rem;
    padding: 0.5rem 1rem;
}

.validation-btn {
    background-color: var(--accent-2);
}

.delete-btn {
    background-color: #722727;
}
</style>
