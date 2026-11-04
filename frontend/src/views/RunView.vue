<template>
    <ErrorPage v-if="loadError !== null" :status="loadError" />

    <template v-else-if="run && !validating">
        <RunAwaiting
            v-if="awaiting"
            :run-id="run.id"
            :busy="busy"
            @validate="onValidate"
            @abandon="onAbandon"
        />

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
        <RunStart :busy="busy" :starting="starting" @start="onStart" />
    </template>

    <ErrorMessage v-if="error && loadError === null">{{ error }}</ErrorMessage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRun } from '../composables/useRun'
import RunActive from '../components/run/active/RunActive.vue'
import RunAwaiting from '../components/run/awaiting/RunAwaiting.vue'
import RunStart from '../components/run/start/RunStart.vue'
import type { Board } from '../lib/types'
import ErrorMessage from '../components/ErrorMessage.vue'
import ErrorPage from '../components/ErrorPage.vue'

const router = useRouter()
const starting = ref(false)
const loadError = ref<number | null>(null)

const {
    run,
    map,
    error,
    errorStatus,
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

await load()

if (error.value) {
    loadError.value = errorStatus.value
}

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

    if (error.value) {
        await refresh()
        return
    }

    await showRun()
}

async function onValidate() {
    await requestValidation()

    if (!error.value) {
        await showRun()
    }
}

async function onAbandon() {
    if (
        !confirm(
            'the run will NOT be validated and will be discarded. this action cannot be undone.'
        )
    ) {
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

async function showRun() {
    if (run.value) {
        await router.push({
            name: 'run-detail',
            params: { id: run.value.id }
        })
    }
}
</script>
