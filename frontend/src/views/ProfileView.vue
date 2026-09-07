<template>
    <p v-if="loading">loading...</p>
    <p v-else-if="error">error: {{ error }}</p>

    <template v-else-if="profile">
        <section>
            <img
                :src="`https://a.ppy.sh/${profile.user.osu_user_id}`"
                :alt="profile.user.username"
            />
            <h2>{{ profile.user.username }}</h2>
            <p>osu! id: {{ profile.user.osu_user_id }}</p>
            <a
                :href="`https://osu.ppy.sh/users/${profile.user.osu_user_id}`"
                target="_blank"
                rel="noreferrer"
                >osu! profile</a
            >
        </section>

        <section>
            <h3>stats</h3>
            <p>completed runs: {{ profile.completedRuns }}</p>
            <p>total fcs: {{ profile.totalFcs }}</p>
            <p>fcs per run: {{ fcsPerRun ?? '0' }}</p>
        </section>

        <section>
            <h3>best runs</h3>
            <ul>
                <li v-for="b in profile.boards" :key="b.board">
                    <p>board: {{ b.board }}</p>
                    <template v-if="b.best">
                        <p>fcs: {{ b.best.fc_count }}</p>
                        <p>rank: {{ b.rank }}</p>
                        <p>pool version: {{ b.best.pool_version }}</p>
                        <p>ended at: {{ b.best.ended_at }}</p>
                        <RouterLink :to="`/runs/${b.best.id}`"
                            >view run</RouterLink
                        >
                    </template>
                    <p v-else>no run yet</p>
                </li>
            </ul>
        </section>
    </template>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ApiError, get } from '../lib/api'
import type { Profile } from '../lib/types'

const props = defineProps<{ id: string }>()

const profile = ref<Profile | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const fcsPerRun = computed(() =>
    profile.value && profile.value.completedRuns > 0
        ? profile.value.totalFcs / profile.value.completedRuns
        : null
)

watch(
    () => props.id,
    async (id) => {
        loading.value = true
        error.value = null

        try {
            profile.value = await get<Profile>(`/users/${id}`)
        } catch (e) {
            error.value =
                e instanceof ApiError ? e.message : 'could not load profile'
            profile.value = null
        } finally {
            loading.value = false
        }
    },
    { immediate: true }
)
</script>
