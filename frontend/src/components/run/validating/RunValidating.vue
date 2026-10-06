<template>
    <p v-if="slow">
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
}>()
</script>
