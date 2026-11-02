<template>
    <section class="error-page">
        <div class="error-container">
            <hr class="v-separator">
            <div class="error-message">
                <h1 class="error-code mono" v-if="status">{{ status }}</h1>
                <p class="error-desc">{{ message }}</p>
            </div>
        </div>
        <img
            src="../assets/error.png"
            class="image"
        />
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { status } = defineProps<{ status: number }>()

const MESSAGES: Record<number, string> = {
    0: "couldn't reach the server. either it's down or you're offline.",
    400: "the server didn't understand that request.",
    404: "page not found."
}

const message = computed(
    () =>
        MESSAGES[status] ??
        (status >= 500
            ? 'something broke on my end, sorry. please try again in a bit.'
            : 'something went wrong.')
)
</script>

<style scoped>
.error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--default-spacing);
}

.error-container {
    display: flex;
    gap: 1rem;
}

.error-message {
    display: flex;
    flex-direction: column;
    gap: .5rem;
}

.error-code {
    font-size: 2.5rem;
}

.error-desc {
    font-size: 1.25rem;
    color: var(--text-muted-2);
    font-style: italic;
}

.image {
    height: 300px;
}
</style>
