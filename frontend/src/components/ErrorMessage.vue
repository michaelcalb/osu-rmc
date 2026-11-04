<template>
    <p class="error mono">error: <slot /></p>
</template>

<style scoped>
.error {
    color: var(--danger);
    background-color: var(--bg-2);
    font-size: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.25rem 0.5rem;
    width: fit-content;
    position: absolute;
    top: calc(var(--default-spacing) / 2);
    right: var(--default-spacing);
    animation:
        slide-from-top 0.5s cubic-bezier(0.32, 0.08, 0, 1),
        fade-out 0.3s 4.7s forwards;
}

@keyframes fade-out {
    to {
        opacity: 0;
        visibility: hidden;
    }
}
</style>
