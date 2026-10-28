<template>
    <AppHeader />

    <main class="main">
        <RouterView />
    </main>

    <AppFooter />

    <RateLimitDialog />
</template>

<script setup lang="ts">
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import RateLimitDialog from './components/RateLimitDialog.vue'
</script>

<style scoped>
.main {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-self: center;
    width: 100%;
    max-width: var(--content-max-width);
    border-radius: 0 0 1rem 1rem;
    background: linear-gradient(to bottom, var(--h-bg), var(--surface)) fixed
        border-box;
    padding: calc(var(--default-spacing) / 2) var(--default-spacing);
}
</style>
