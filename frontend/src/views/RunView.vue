<template>
    <p v-if="loading">loading...</p>

    <template v-else-if="run && !validating">
        <section v-if="awaiting">
            <h2>run {{ run.id }}</h2>
            <p>time's up, your run is ready to be validated</p>
            <p>
                if you are still playing the last map, finish it first before
                starting validation.
            </p>
            <button :disabled="busy" @click="onValidate">
                start validation
            </button>
            <button :disabled="busy" @click="onAbandon">
                delete run (will be discarded)
            </button>
        </section>

        <section v-if="run.status === 'void'">
            <h2>run {{ run.id }}</h2>
            <p>
                this run couldn't be validated,
                <RouterLink to="/help">but it can still be saved.</RouterLink>
            </p>
        </section>

        <template v-else-if="run.status === 'active'">
            <section>
                <h2>run {{ run.id }}</h2>
                <p>status: {{ run.status }}</p>
                <p>claimed fcs: {{ claimedFc }}</p>
            </section>

            <section>
                <h3>clock</h3>
                <p>main seconds left: {{ Math.floor(mainSecondsLeft) }}</p>
                <p>prep seconds left: {{ Math.floor(prepSecondsLeft) }}</p>
                <p>phase: {{ clock?.phase }}</p>
                <p v-if="!signalled && prepSecondsLeft > 10">
                    please, click on "start map" before starting the map!
                </p>
                <p v-else>
                    main clock starts in {{ Math.ceil(prepSecondsLeft) }}
                </p>
                <p v-if="timeUp">
                    time over! you should be redirected to the validation screen
                    soon. if nothing happens, try reloading the page ;)
                </p>
            </section>

            <section v-if="map">
                <h3>current map</h3>
                <p>seq_index: {{ map.seq_index }}</p>
                <p>map_id: {{ map.map_id }}</p>
                <p>set_id: {{ map.set_id }}</p>
                <p>artist: {{ map.artist }} / {{ map.artist_unicode }}</p>
                <p>title: {{ map.title }} / {{ map.title_unicode }}</p>
                <p>difficulty: {{ map.difficulty_name }}</p>
                <p>creator: {{ map.creator }}</p>
                <p>star rating: {{ map.original_star_rating }}</p>
                <p>bpm: {{ map.bpm }}</p>
                <p>total_length: {{ map.total_length }}</p>
                <p>hit_length: {{ map.hit_length }}</p>
                <p>map_max_combo: {{ map.map_max_combo }}</p>
                <p>nsfw: {{ map.nsfw }}</p>
                <p>cover_updated_at: {{ map.cover_updated_at }}</p>
                <p>served_at: {{ map.served_at }}</p>
                <a
                    :href="`https://osu.ppy.sh/b/${map.map_id}`"
                    target="_blank"
                    rel="noreferrer"
                    >open beatmap</a
                >
                <img
                    :src="coverUrl(map.set_id, map.cover_updated_at)"
                    :alt="`${map.artist} - ${map.title}`"
                />
            </section>

            <section>
                <h3>buttons</h3>

                <button v-if="!map" :disabled="busy" @click="onReveal">
                    begin
                </button>

                <template v-else>
                    <button
                        :disabled="busy || !canSignalStart"
                        @click="startPlaying"
                    >
                        start map
                    </button>
                    <button :disabled="busy" @click="onReveal">next map</button>
                    <button :disabled="busy" @click="skip('a_skip')">
                        skip (A rank)
                    </button>
                    <button
                        :disabled="busy || run.freeSkipUsed"
                        @click="skip('free_skip')"
                    >
                        skip (free)
                    </button>
                    <button :disabled="busy" @click="unplayable">
                        unplayable
                    </button>
                </template>

                <button :disabled="busy" @click="onEnd">
                    end run (submit to lb)
                </button>
                <button :disabled="busy" @click="onAbandon">
                    abandon run (will be discarded)
                </button>
            </section>
        </template>
    </template>

    <section v-else>
        <p v-if="slow">
            run {{ run?.id }} is taking longer than usual to validate. don't worry, we're handling everything. starting a new run won't affect it.
        </p>
        <p v-else-if="validating">
            run {{ run?.id }} is still validating. starting a new run won't affect it.
        </p>

        <h2>start a run</h2>

        <label>
            mode
            <select v-model="declaredMode">
                <option value="no_mod">no_mod</option>
                <option value="free_mod">free_mod</option>
            </select>
        </label>

        <button :disabled="busy" @click="onStart">
            {{ starting ? 'starting...' : 'start' }}
        </button>
    </section>

    <p v-if="error">error: {{ error }}</p>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRun } from '../composables/useRun'
import { coverUrl } from '../lib/covers'
import type { Board } from '../lib/types'

const POLL_MS = 10000
const MAX_POLLS = 3

const router = useRouter()
const loading = ref(true)
const starting = ref(false)
const polls = ref(0)
const declaredMode = ref<Board>('no_mod')

const {
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

async function onStart() {
    starting.value = true

    await start(declaredMode.value)

    starting.value = false
}

async function onReveal() {
    await reveal()

    if (error.value) {
        await refresh()
    }
}

async function onEnd() {
    if (!confirm('end run?')) {
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
    if (!confirm('abandon run?')) {
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
