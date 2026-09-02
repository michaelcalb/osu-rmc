import { readonly, ref } from "vue";
import { get, goToLogin, post } from "../lib/api";
import type { Identity } from "../lib/types";

const currentUser = ref<Identity | null>(null)
const isLoading = ref(true)

const user = readonly(currentUser)
const loading = readonly(isLoading)

let ready: Promise<void> | null = null

async function refresh(): Promise<void> {
    isLoading.value = true

    try {
        currentUser.value = await get<Identity | null>('/auth/me')
    } catch {
        currentUser.value = null
    } finally {
        isLoading.value = false
    }
}

async function logout(): Promise<void> {
    await post('/auth/logout')
    currentUser.value = null
}

export function useSession() {
    ready ??= refresh()

    return { user, loading, ready, refresh, login: goToLogin, logout }
}