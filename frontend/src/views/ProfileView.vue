<template>
    <Note> this is a temporary design </Note>

    <p v-if="loading">loading...</p>
    <p v-else-if="error">error: {{ error }}</p>
    <template v-else-if="profile">
        <section class="title-section">
            <div>
                <h1 class="title">user profile</h1>
            </div>
            <hr class="separator" />
        </section>

        <section class="user-info">
            <div class="pfp-box">
                <img
                    :src="`https://a.ppy.sh/${profile.user.osu_user_id}`"
                    :alt="profile.user.username"
                    class="pfp"
                />
            </div>
            <div class="user-name">
                <h2 class="username">{{ profile.user.username }}</h2>
                <a
                    :href="`https://osu.ppy.sh/users/${profile.user.osu_user_id}`"
                    target="_blank"
                    rel="noreferrer"
                    class="osu-link"
                >
                    <ExternalLink :size="20" />
                </a>
            </div>
        </section>

        <section class="user-stats">
            <h3 class="box-title">stats</h3>
            <div class="box">
                <div class="boards-box">
                    <div
                        class="board-stats"
                        v-for="b in profile.boards"
                        :key="b.board"
                    >
                        <div>
                            <dt class="board-label">
                                {{ boardName(b.board) }} rank
                            </dt>
                            <dd :class="`board-value run-rank rank-${b.rank}`">
                                {{ b.rank ? `#${b.rank}` : '-' }}
                            </dd>
                        </div>
                        <div>
                            <dt class="board-label">
                                {{ boardName(b.board) }} runs
                            </dt>
                            <dd>
                                {{ profile.runsByBoard[b.board] }}
                            </dd>
                        </div>
                    </div>
                </div>

                <hr class="v-separator" />

                <dl class="stats-box">
                    <dt>completed runs</dt>
                    <dd>{{ profile.completedRuns }}</dd>

                    <dt>weighted accuracy</dt>
                    <dd>
                        {{ formatAccuracy(profile.accuracy) }}
                    </dd>

                    <dt>total FCs</dt>
                    <dd>{{ profile.totalFcs }}</dd>

                    <dt>playtime</dt>
                    <dd>{{ formatHours(profile.totalElapsed) }}</dd>
                </dl>
            </div>
        </section>
    </template>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ApiError, get } from '../lib/api'
import type { Board, Profile } from '../lib/types'
import { formatHours } from '../lib/time'
import { formatAccuracy } from '../lib/format.ts'
import { ExternalLink } from '@lucide/vue'
import Note from '../components/Note.vue'

const props = defineProps<{ id: string }>()

const profile = ref<Profile | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const boardName = (board: Board) => {
    return board === 'no_mod' ? 'no mod' : 'free mod'
}

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

<style scoped>
.user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: var(--default-spacing);
}

.pfp-box {
    border-radius: 2rem;
}

.pfp-box:hover .pfp {
    transform: none;
}

.pfp {
    height: 96px;
}

.user-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.username {
    font-weight: 400;
}

.osu-link {
    display: flex;
    transition: 0.2s;
}

.osu-link:hover {
    color: var(--accent);
}

.box-title {
    width: fit-content;
    background-color: var(--bg-2);
    font-weight: 400;
    font-size: 1.5rem;
    padding: 0.25rem 1rem;
    border: 2px solid var(--border);
    border-bottom: 2px solid transparent;
    border-radius: 0.5rem 0.5rem 0 0;
    transform: translateX(0.5rem) translateY(2px);
}

.box {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    background-color: var(--bg-2);
    border: 2px solid var(--border);
    border-radius: 0.5rem 0.5rem 0.5rem 0.5rem;
    padding: 1rem 1.5rem;
    gap: 1.5rem;
    height: fit-content;
}

.boards-box {
    display: grid;
    grid-template-columns: 1fr 1fr;
}

.board-stats {
    display: flex;
    flex-direction: column;
    gap: var(--default-spacing);
}

.board-label {
    font-size: 1.2rem;
    font-weight: 300;
    color: var(--text-muted-2);
}

.board-value {
    font-size: 2.5rem;
    font-weight: 500;
    color: var(--);
}

.stats-box {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.5rem 2rem;
    align-content: start;
    font-size: 1.2rem;
}

.stats-box dt {
    font-weight: 300;
}

.stats-box dd {
    color: var(--text-muted-3);
}
</style>
