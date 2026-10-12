<template>
    <p v-if="loading">loading...</p>

    <template v-else-if="run && !validating">
        <RunAwaiting
            v-if="awaiting"
            :run-id="run.id"
            :busy="busy"
            @validate="onValidate"
            @abandon="onAbandon"
        />

        <RunVoid v-if="run.status === 'void'" :run-id="run.id" />

        <RunActive
            v-else-if="run.status === 'active'"
            :run="run"
            :map="map"
            :busy="busy"
            :main-seconds-left="mainSecondsLeft"
            :prep-seconds-left="prepSecondsLeft"
            :can-signal-start="canSignalStart"
            :time-up="timeUp"
            @reveal="onReveal"
            @start-map="startPlaying"
            @skip="skip"
            @unplayable="unplayable"
            @end="onEnd"
            @abandon="onAbandon"
        />
    </template>

    <template v-else>
        <RunValidating v-if="validating && run" :run-id="run.id" :slow="slow" />
        <RunStart :busy="busy" :starting="starting" @start="onStart" />
    </template>

    <p v-if="error" class="error mono">error: {{ error }}</p>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRun } from '../composables/useRun'
import RunActive from '../components/run/active/RunActive.vue'
import RunAwaiting from '../components/run/awaiting/RunAwaiting.vue'
import RunStart from '../components/run/start/RunStart.vue'
import RunValidating from '../components/run/validating/RunValidating.vue'
import RunVoid from '../components/run/void/RunVoid.vue'
import type { Board } from '../lib/types'

const POLL_MS = 10000
const MAX_POLLS = 3

const router = useRouter()
const loading = ref(true)
const starting = ref(false)
const polls = ref(0)

const {
    run,
    map,
    error,
    busy,
    prepSecondsLeft,
    mainSecondsLeft,
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
} = useRun()

const awaiting = computed(() => run.value?.awaitingValidation === true)

const validating = computed(
    () =>
        !awaiting.value &&
        (run.value?.status === 'pending_final' ||
            run.value?.status === 'validating')
)

const slow = computed(() => validating.value && polls.value >= MAX_POLLS)

let timer: ReturnType<typeof setTimeout> | null = null

onScopeDispose(() => {
    if (timer) {
        clearTimeout(timer)
    }
})

function armPoll() {
    if (timer || polls.value >= MAX_POLLS) {
        return
    }

    timer = setTimeout(poll, POLL_MS)
}

async function poll() {
    timer = null
    polls.value += 1

    await refresh()

    if (validating.value && polls.value < MAX_POLLS) {
        armPoll()
    }
}

onMounted(async () => {
    await load()

    loading.value = false
})

async function onStart(mode: Board) {
    starting.value = true

    await start(mode)

    starting.value = false
}

async function onReveal() {
    await reveal()

    if (error.value) {
        await refresh()
    }
}

async function onEnd() {
    if (!confirm('end run?\nvalidation will start instantly.')) {
        return
    }

    await end()
    await refresh()
}

async function onValidate() {
    if (
        !confirm(
            'if you are still playing the last map, finish it first. start validation?'
        )
    ) {
        return
    }

    await requestValidation()

    if (validating.value) {
        armPoll()
    }
}

async function onAbandon() {
    if (!confirm('abandon run?\nit will not be validated and will be discarded. this action cannot be undone.')) {
        return
    }

    await abandon()
    await load()
}

watch(timeUp, async (over) => {
    if (over) {
        await refresh()
    }
})

watch(
    () => run.value?.status,
    async (status) => {
        const current = run.value

        if (!current || !status || status === 'active') {
            return
        }

        if (status === 'complete') {
            await router.replace({
                name: 'run-detail',
                params: { id: current.id }
            })

            return
        }

        if (validating.value) {
            armPoll()
        }
    }
)
</script>
