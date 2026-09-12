<template>
    <p v-if="loading">loading...</p>

    <template v-else-if="run">
        <section v-if="validating">
            <h2>validating</h2>
            <p>status: {{ run.status }}</p>
            <p v-if="slow">
                this run is taking a big longer to validate. dont worry, we're
                handling everything ;)
            </p>
        </section>

        <section v-else-if="run.status === 'void'">
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
                    please click on "start map" before hopping into osu!
                </p>
                <p v-else>
                    main clock starts in {{ Math.ceil(prepSecondsLeft) }}
                </p>
                <p v-if="timeUp">time over</p>
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

        <p v-if="error">error: {{ error }}</p>
    </template>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRun } from '../composables/useRun'
import { coverUrl } from '../lib/covers'

const POLL_MS = 10000
const MAX_POLLS = 3

const router = useRouter()
const loading = ref(true)
const polls = ref(0)

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
    load,
    refresh,
    reveal,
    skip,
    unplayable,
    startPlaying,
    end,
    abandon
} = useRun()

const validating = computed(
    () =>
        run.value?.status === 'pending_final' ||
        run.value?.status === 'validating'
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
    const state = await load()

    loading.value = false

    if (!state) {
        await router.push({ name: 'home' })
    }
})

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

async function onAbandon() {
    if (!confirm('abandon run?')) {
        return
    }

    await abandon()
    await refresh()
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

        if (status === 'abandoned') {
            await router.replace({ name: 'home' })

            return
        }

        if (validating.value) {
            armPoll()
        }
    }
)
</script>
