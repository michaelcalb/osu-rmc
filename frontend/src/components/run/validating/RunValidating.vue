<template>
    <p v-if="delayed">
        run {{ runId }} couldn't be validated yet, osu! may be having trouble.
        we'll keep trying to validate your run, feel free to close this page.
        starting a new run won't affect it.
    </p>
    <p v-else-if="slow">
        run {{ runId }} is taking longer than usual to validate. don't worry,
        we're handling everything. starting a new run won't affect it.
    </p>
    <p v-else>
        run {{ runId }} is still validating. starting a new run won't affect it.
    </p>
</template>

<script setup lang="ts">
defineProps<{
    runId: number
    slow: boolean
    delayed: boolean
}>()
</script>
