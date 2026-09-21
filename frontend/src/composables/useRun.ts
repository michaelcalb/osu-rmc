import { computed, onScopeDispose, ref } from 'vue'
import { ApiError, get, post } from '../lib/api'
import type { Board, Clock, RunState, ServedMap } from '../lib/types'

const TICK_MS = 500
const START_GRACE_SECONDS = 10

export function useRun() {
    const run = ref<RunState | null>(null)
    const map = ref<ServedMap | null>(null)
    const clock = ref<Clock | null>(null)
    const claimedFc = ref(0)
    const error = ref<string | null>(null)
    const busy = ref(false)

    const syncedAt = ref(0)
    const now = ref(Date.now())

    const timer = setInterval(() => {
        now.value = Date.now()
    }, TICK_MS)

    onScopeDispose(() => clearInterval(timer))

    const sinceSync = computed(() =>
        clock.value ? Math.max(0, (now.value - syncedAt.value) / 1000) : 0
    )

    const prepSecondsLeft = computed(() =>
        clock.value
            ? Math.max(0, clock.value.prepSecondsLeft - sinceSync.value)
            : 0
    )

    const mainSecondsLeft = computed(() => {
        if (!clock.value) {
            return 0
        }

        const spent = Math.max(0, sinceSync.value - clock.value.prepSecondsLeft)

        return Math.max(0, clock.value.mainSecondsLeft - spent)
    })

    const signalled = computed(() => clock.value?.phase === 'running')

    const canSignalStart = computed(
        () => !signalled.value && prepSecondsLeft.value > START_GRACE_SECONDS
    )

    const timeUp = computed(
        () => clock.value !== null && mainSecondsLeft.value <= 0
    )

    function applyState(state: RunState | null) {
        run.value = state
        map.value = state?.currentMap ?? null
        claimedFc.value = state?.claimedFcCount ?? 0
        clock.value = state
        syncedAt.value = Date.now()
        now.value = syncedAt.value
    }

    async function call<T>(fn: () => Promise<T>): Promise<T | null> {
        busy.value = true
        error.value = null

        try {
            return await fn()
        } catch (e) {
            error.value = e instanceof ApiError ? e.message : 'request failed'
            return null
        } finally {
            busy.value = false
        }
    }

    function path(suffix: string): string {
        return `/runs/${run.value?.id}${suffix}`
    }

    async function start(declaredMode: Board) {
        const started = await call(() => post('/runs', { declaredMode }))

        if (started) {
            await load()
        }
    }

    async function load() {
        const state = await call(() => get<RunState | null>('/runs/current'))

        applyState(state)

        return state
    }

    async function refresh() {
        const state = await call(() => get<RunState>(path('/state')))

        if (state) {
            applyState(state)
        }
    }

    async function advance(suffix: string, body?: unknown) {
        const state = await call(async () => {
            await post(path(suffix), body)

            return get<RunState>(path('/state'))
        })

        if (state) {
            applyState(state)
        }
    }

    function reveal() {
        return advance('/reveal')
    }

    function skip(kind: 'a_skip' | 'free_skip') {
        return advance('/skip', { kind })
    }

    function unplayable() {
        return advance('/unplayable')
    }

    async function startPlaying() {
        await call(() => post(path('/playing')))
        await refresh()
    }

    async function end() {
        await call(() => post(path('/end')))
    }

    async function requestValidation() {
        const state = await call(() => post<RunState>(path('/validate')))

        if (state) {
            applyState(state)
        }
    }

    async function abandon() {
        await call(() => post(path('/abandon')))
    }

    return {
        run,
        map,
        clock,
        claimedFc,
        error,
        busy,
        prepSecondsLeft,
        mainSecondsLeft,
        signalled,
        canSignalStart,
        timeUp,
        start,
        load,
        refresh,
        reveal,
        skip,
        unplayable,
        startPlaying,
        end,
        requestValidation,
        abandon
    }
}
