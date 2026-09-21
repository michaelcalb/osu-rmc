<template>
    <div ref="root">
        <HoverCardRoot :open-delay="100" :close-delay="100">
            <HoverCardTrigger as-child>
                <slot name="trigger" />
            </HoverCardTrigger>

            <HoverCardContent class="content-container" align="start" :side-offset="8" @pointer-down-outside="keepOpenOnTriggerClick">
                <slot />
            </HoverCardContent>
        </HoverCardRoot>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { HoverCardContent, HoverCardRoot, HoverCardTrigger, type PointerDownOutsideEvent } from 'reka-ui';

const root = ref<HTMLElement>()

function keepOpenOnTriggerClick(event: PointerDownOutsideEvent) {
    if (root.value?.contains(event.detail.originalEvent.target as Node)) event.preventDefault()
}
</script>

<style scoped>
:deep([data-side]) {
    animation: fade-in 100ms;
}

:deep([data-side][data-state='closed']) {
    animation: fade-out 100ms;
}

@keyframes fade-in {
    from {
        opacity: 0;
    }
}

@keyframes fade-out {
     to {
        opacity: 0;
    }
}

:deep(.content-container) {
    background-color: var(--bg);
    border: 2px solid var(--surface);
    border-radius: 1rem;
    corner-shape: squircle;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

:deep(.content-container) > * {
    padding: .5rem;
    padding-right: 4rem;
    cursor: pointer;
    user-select: none;
}

:deep(.content-container) > *:hover {
    background-color: var(--surface);
}
</style>