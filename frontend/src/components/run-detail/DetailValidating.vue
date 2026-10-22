<template>
    <p v-if="delayed">
        this run couldn't be validated yet, osu! may be having trouble.
        we'll keep trying to validate it at a slower pace. feel free to close this page and check back later.
    </p>
    <p v-else-if="slow">
        this run is taking longer than usual to validate. try refreshing the page in a few minutes.
    </p>
    <p v-else>
        this run is being validated.
    </p>
    <p>
        if this is your run, starting a new one won't affect validation, so feel free to keep playing <span class="mono">&semi;&rpar;</span>
    </p>
</template>

<script setup lang="ts">
defineProps<{
    slow: boolean
    delayed: boolean
}>()
</script>
