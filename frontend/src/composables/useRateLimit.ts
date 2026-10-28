import { readonly, ref } from 'vue'

const limited = ref(false)

export function markRateLimited(): void {
    limited.value = true
}

export function useRateLimit() {
    return {
        limited: readonly(limited),
        dismiss: () => {
            limited.value = false
        }
    }
}
