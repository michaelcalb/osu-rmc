<template>
    <DialogRoot :open="limited" @update:open="dismiss">
        <DialogPortal>
            <DialogOverlay class="rate-limit-overlay" />
            <DialogContent class="rate-limit-content">
                <DialogTitle class="rate-limit-title"
                    >slow down!
                    <span class="mono">&gt;&colon;&lpar;</span></DialogTitle
                >
                <DialogDescription>
                    you're making too many requests. please try again later.
                </DialogDescription>
                <DialogClose class="rate-limit-close">ok, sorry</DialogClose>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>

<script setup lang="ts">
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle
} from 'reka-ui'
import { useRateLimit } from '../composables/useRateLimit'

const { limited, dismiss } = useRateLimit()
</script>

<style>
.rate-limit-overlay {
    position: fixed;
    inset: 0;
    z-index: 69420;
    background-color: rgba(0, 0, 0, 0.5);
}

.rate-limit-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 69420;
    width: 90%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: var(--default-spacing);
    padding: 1.5rem;
    background-color: var(--bg);
    border-radius: 1rem;
}

.rate-limit-title {
    display: flex;
    justify-content: space-between;
    color: var(--accent);
    font-weight: 500;
}

.rate-limit-close {
    align-self: flex-end;
    padding: 0.5rem 2rem;
    border-radius: 0.5rem;
    background-color: var(--surface);
}
</style>
