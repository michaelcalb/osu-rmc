<template>
    <section v-if="loading">
        <p>loading...</p>
    </section>

    <section v-else-if="!user">
        <p>you need to be logged in to start a run</p>
    </section>

    <section v-else-if="current">
        <h2>run in progress</h2>
        <p>run id: {{ current.id }}</p>
        <p>status: {{ current.status }}</p>
        <p>claimed fcs: {{ current.claimedFcCount }}</p>
        <p v-if="current.status === 'active'">
            time left: {{ current.mainSecondsLeft }}
        </p>
        <p v-else-if="current.awaitingValidation">
            this run is waiting on your action
        </p>
        <RouterLink to="/run">resume</RouterLink>
    </section>

    <p v-if="error">error: {{ error }}</p>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ApiError, get } from '../lib/api'
import { useSession } from '../composables/useSession'
import type { RunState } from '../lib/types'

const { user, ready } = useSession()

const current = ref<RunState | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
    await ready

    if (!user.value) {
        loading.value = false
        return
    }

    try {
        current.value = await get<RunState | null>('/runs/current')
    } catch (e) {
        error.value = e instanceof ApiError ? e.message : 'could not load your runs'
    } finally {
        loading.value = false
    }
})
</script>
