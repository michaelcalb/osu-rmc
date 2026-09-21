<template>

    <AppHeader />

    <main class="main">
        <RouterView />
    </main>

    <AppFooter />
</template>

<script setup lang="ts">
import AppFooter from './components/AppFooter.vue';
import AppHeader from './components/AppHeader.vue';

</script>

<style scoped>
.main {
    display: flex;
    flex-direction: column;
    justify-self: center;
    width: 100%;
    max-width: var(--content-max-width);
    border-radius: 0 0 1rem 1rem;
    background: linear-gradient(to bottom, var(--h-bg), var(--surface)) border-box;
    padding: var(--content-padding);
}
</style>