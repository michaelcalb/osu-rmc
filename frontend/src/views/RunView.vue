<template>
    <p v-if="loading">loading...</p>

    <template v-else-if="run">
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
            <p v-if="signalled">
                you may have slightly more time than shown
            </p>
            <p v-else>
                you may have less time than shown.
            </p>
            <p v-if="timeUp">
                time over
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
                <button :disabled="busy || !canSignalStart" @click="startPlaying">
                    start map
                </button>
                <button :disabled="busy" @click="onReveal">
                    next map
                </button>
                <button :disabled="busy" @click="skip('a_skip')">
                    skip (A rank)
                </button>
                <button :disabled="busy || run.freeSkipUsed" @click="skip('free_skip')">
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

        <p v-if="error">error: {{ error }}</p>
    </template>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useRun } from '../composables/useRun';
import { coverUrl } from '../lib/covers';

const router = useRouter()
const loading = ref(true)

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

onMounted(async () => {
    const state = await load()

    loading.value = false

    if (!state) {
        await router.push({ name: 'home' })
    }
})

async function goToResult() {
    if (run.value) {
        await router.push({ name: 'result', params: { id: run.value.id } })
    }
}

async function onReveal() {
    await reveal()

    if (!error.value) {
        return
    }

    await refresh()

    if (run.value && run.value.status !== 'active') {
        await goToResult()
    }
}

async function onEnd() {
    if (!confirm('end run?')) {
        return
    }
    await end()

    if (!error.value) {
        await goToResult()
        return
    }

    await refresh()

    if (run.value && run.value.status !== 'active') {
        await goToResult()
    }
}

async function onAbandon() {
    if (!confirm('abandon run?')) {
        return
    }

    await abandon()

    if (!error.value) {
        await router.push({ name: 'home' })
        return
    }

    await refresh()

    if (run.value && run.value.status !== 'active') {
        await goToResult()
    }
}

watch(timeUp, async (over) => {
    if (!over) {
        return
    }

    await refresh()

    if (run.value && run.value.status !== 'active') {
        await goToResult()
    }
})
</script>