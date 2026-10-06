<template>
    <section>
        <h2>run {{ runId }}</h2>
        <p>
            this run couldn't be validated,
            <RouterLink to="/help">but it can still be saved.</RouterLink>
        </p>
    </section>
</template>

<script setup lang="ts">
defineProps<{ runId: number }>()
</script>
