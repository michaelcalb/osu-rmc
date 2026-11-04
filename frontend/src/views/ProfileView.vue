<template>
    <ErrorPage v-if="error !== null" :status="error" />
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
                    <dl
                        class="board-stats"
                        v-for="b in profile.boards"
                        :key="b.board"
                    >
                        <div>
                            <dt class="board-label">
                                {{ formatBoard(b.board) }} rank
                            </dt>
                            <dd :class="`board-value run-rank rank-${b.rank}`">
                                {{ b.rank ? `#${b.rank}` : '-' }}
                            </dd>
                        </div>
                        <div>
                            <dt class="board-label">
                                {{ formatBoard(b.board) }} runs
                            </dt>
                            <dd>
                                {{ profile.runsByBoard[b.board] }}
                            </dd>
                        </div>
                    </dl>
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
import { ref } from 'vue'
import { ApiError, get } from '../lib/api'
import type { Profile } from '../lib/types'
import { formatHours } from '../lib/time'
import { formatAccuracy, formatBoard } from '../lib/format.ts'
import { ExternalLink } from '@lucide/vue'
import ErrorPage from '../components/ErrorPage.vue'

const props = defineProps<{ id: string }>()

const profile = ref<Profile | null>(null)
const error = ref<number | null>(null)

try {
    profile.value = await get<Profile>(`/users/${props.id}`)
} catch (e) {
    error.value = e instanceof ApiError ? e.status : 0
}
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
    font-size: 1.2rem;
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
    font-size: 1.1rem;
    font-weight: 300;
    color: var(--text-muted-2);
}

.board-value {
    font-size: 2rem;
    font-weight: 500;
}

.stats-box {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.5rem 2rem;
    align-content: start;
    font-size: 1.1rem;
}

.stats-box dt {
    font-weight: 300;
}

.stats-box dd {
    color: var(--text-muted-3);
}

@media (max-width: 700px) {
    .box {
        grid-template-columns: 1fr;
    }

    .v-separator {
        width: auto;
        height: 2px;
        margin: 0;
    }
}
</style>
