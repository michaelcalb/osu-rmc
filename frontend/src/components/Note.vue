<template>
    <div class="wip">
        <Info :size="18" />
        <slot />
    </div>
</template>

<script setup lang="ts">
import { Info } from '@lucide/vue';
</script>

<style scoped>
.wip {
    position: absolute;
    top: calc(var(--default-spacing) / 2);
    right: var(--default-spacing);
    background-color: #354561;
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .5rem 1rem;
    border-radius: 100px;
}
</style>