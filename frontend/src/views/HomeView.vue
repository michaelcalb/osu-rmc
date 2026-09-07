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
        <RouterLink to="/run">resume</RouterLink>
    </section>

    <section v-else>
        <h2>start a run</h2>

        <label>
            mode
            <select v-model="declaredMode">
                <option value="no_mod">no_mod</option>
                <option value="free_mod">free_mod</option>
            </select>
        </label>

        <button :disabled="starting" @click="start">
            {{ starting ? 'starting...' : 'start' }}
        </button>
    </section>

    <p v-if="error">error: {{ error }}</p>

    <section v-if="user && runs.length > 0">
        <h3>your runs</h3>
        <ul>
            <li v-for="r in runs" :key="r.id">
                <p>run {{ r.id }}: {{ r.status }}</p>
                <p>
                    declared: {{ r.declared_mode }} / board:
                    {{ r.resolved_board }}
                </p>
                <p>fcs: {{ r.fc_count }}</p>
                <p>active elapsed: {{ r.active_elapsed }}</p>
                <p>started: {{ r.started_at }}</p>
                <p>ended: {{ r.ended_at }}</p>
                <RouterLink
                    v-if="r.status === 'complete'"
                    :to="`/runs/${r.id}`"
                >
                    view run
                </RouterLink>
                <RouterLink v-else-if="r.status === 'void'" to="/help">
                    this run couldn't be validated
                </RouterLink>
                <RouterLink
                    v-else-if="
                        r.status === 'pending_final' ||
                        r.status === 'validating'
                    "
                    to="/run"
                >
                    still validating
                </RouterLink>
            </li>
        </ul>
    </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ApiError, get, post } from '../lib/api'
import { useSession } from '../composables/useSession'
import type { Board, RunState, StartedRun, RunSummary } from '../lib/types'

const router = useRouter()
const { user, ready } = useSession()

const current = ref<RunState | null>(null)
const declaredMode = ref<Board>('no_mod')
const loading = ref(true)
const starting = ref(false)
const error = ref<string | null>(null)
const runs = ref<RunSummary[]>([])

function describe(e: unknown, fallback: string): string {
    return e instanceof ApiError ? e.message : fallback
}

onMounted(async () => {
    await ready

    if (!user.value) {
        loading.value = false
        return
    }

    try {
        const [state, mine] = await Promise.all([
            get<RunState | null>('/runs/current'),
            get<RunSummary[]>('/runs/mine')
        ])

        current.value = state
        runs.value = mine
    } catch (e) {
        error.value = describe(e, 'could not load your runs')
    } finally {
        loading.value = false
    }
})

async function start() {
    starting.value = true
    error.value = null

    try {
        await post<StartedRun>('/runs', { declaredMode: declaredMode.value })
        await router.push({ name: 'run' })
    } catch (e) {
        error.value = describe(e, 'could not start run')
    } finally {
        starting.value = false
    }
}
</script>
