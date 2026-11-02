<template>
    <AppHeader />

    <main class="main" v-show="ready">
        <RouterView v-slot="{ Component, route }">
            <Suspense
                v-if="Component"
                @pending="navigating = true"
                @resolve="onResolve"
            >
                <component :is="Component" :key="route.path" />
            </Suspense>
        </RouterView>
    </main>

    <AppFooter v-show="ready" />

    <div v-if="navigating" class="page-loading">
        <LoaderCircle class="spinner" :size="48" />
    </div>

    <RateLimitDialog />
</template>

<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import RateLimitDialog from './components/RateLimitDialog.vue'
import { ref } from 'vue'

const navigating = ref(false)
const ready = ref(false)

function onResolve() {
    navigating.value = false
    ready.value = true
}
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

.page-loading {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: grid;
    place-items: center;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    animation: reveal 0.2s 1s both;
}

.spinner {
    color: var(--text-muted);
    animation: spin 1s linear infinite;
}

@keyframes reveal {
    from {
        opacity: 0;
        visibility: hidden;
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
