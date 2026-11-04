<template>
    <ErrorPage v-if="error !== null" :status="error" />
    <template v-else>
        <div class="heading">
            <div class="title-section">
                <h1 class="title">run {{ id }}</h1>
                <hr class="separator" />
                <p class="run-status subtitle">{{ statusLabel }}</p>
            </div>
            <div v-if="player" class="heading-group">
                <div class="run-author">
                    <span>played by</span>
                    <RouterLink
                        :to="`/users/${player.user_id}`"
                        class="link-1 user-link"
                    >
                        <div class="pfp-box">
                            <img
                                :src="`https://a.ppy.sh/${player.user_id}`"
                                :alt="player.username"
                                class="pfp"
                            />
                        </div>
                        <span class="username">{{ player.username }}</span>
                    </RouterLink>
                </div>
                <TooltipProvider v-if="endedAt" :delay-duration="0">
                    <TooltipRoot>
                        <TooltipTrigger
                            as="time"
                            :datetime="endedAt"
                            class="ended-at"
                        >
                            {{ timeAgo(endedAt) }}
                        </TooltipTrigger>
                        <TooltipPortal>
                            <TooltipContent
                                class="tooltip"
                                :side-offset="4"
                                side="bottom"
                                align="end"
                            >
                                <p>
                                    {{ exactTime(endedAt).date }}
                                    <span class="tooltip-time">
                                        {{ exactTime(endedAt).time }}
                                    </span>
                                </p>
                            </TooltipContent>
                        </TooltipPortal>
                    </TooltipRoot>
                </TooltipProvider>
            </div>
        </div>

        <div class="detail-container">
            <template v-if="pending">
                <DetailValidating
                    v-if="validating"
                    :slow="slow"
                    :delayed="pending.delayed"
                />
                <DetailVoid v-else-if="pending.status === 'void'" />
                <DetailAwaiting v-else-if="pending.awaitingValidation" />
                <DetailActive v-else-if="pending.status === 'active'" />
                <DetailAbandoned v-else />
            </template>
            <DetailComplete v-else-if="detail" :detail="detail" />

            <ErrorMessage v-if="pollError">{{ pollError }}</ErrorMessage>
        </div>
    </template>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { ApiError, get } from '../lib/api'
import type {
    RunDetail,
    RunLookup,
    RunStatus,
    UnfinishedRun
} from '../lib/types'
import DetailValidating from '../components/run-detail/DetailValidating.vue'
import DetailVoid from '../components/run-detail/DetailVoid.vue'
import DetailAwaiting from '../components/run-detail/DetailAwaiting.vue'
import DetailActive from '../components/run-detail/DetailActive.vue'
import DetailAbandoned from '../components/run-detail/DetailAbandoned.vue'
import DetailComplete from '../components/run-detail/DetailComplete.vue'
import ErrorPage from '../components/ErrorPage.vue'
import ErrorMessage from '../components/ErrorMessage.vue'
import { exactTime, timeAgo } from '../lib/time.ts'
import {
    TooltipContent,
    TooltipPortal,
    TooltipProvider,
    TooltipRoot,
    TooltipTrigger
} from 'reka-ui'

const props = defineProps<{ id: string }>()

const STATUS_LABELS: Record<RunStatus, string> = {
    active: 'in progress',
    pending_final: 'validating',
    validating: 'validating',
    complete: 'completed',
    void: 'voided',
    abandoned: 'abandoned'
}

const POLL_MS = 10000
const MAX_POLLS = 6

const detail = ref<RunDetail | null>(null)
const pending = ref<UnfinishedRun | null>(null)
const error = ref<number | null>(null)
const pollError = ref<string | null>(null)
const polls = ref(0)

let timer: ReturnType<typeof setTimeout> | null = null

const validating = computed(
    () =>
        (pending.value?.status === 'pending_final' &&
            !pending.value.awaitingValidation) ||
        pending.value?.status === 'validating'
)

const slow = computed(() => validating.value && polls.value >= MAX_POLLS)

const statusLabel = computed(() => {
    if (detail.value) {
        return STATUS_LABELS.complete
    }

    if (!pending.value) {
        return null
    }

    if (pending.value.awaitingValidation) {
        return 'awaiting validation'
    }

    return STATUS_LABELS[pending.value.status]
})

const player = computed(() => detail.value?.run ?? pending.value)

const endedAt = computed(() => detail.value?.run.ended_at ?? null)

async function fetchRun(id: string) {
    const lookup = await get<RunLookup>(`/leaderboards/runs/${id}`)

    detail.value = lookup.status === 'complete' ? lookup : null
    pending.value = lookup.status === 'complete' ? null : lookup
}

function stopPolling() {
    if (timer) {
        clearTimeout(timer)
        timer = null
    }
}

function armPoll(id: string) {
    if (timer || polls.value >= MAX_POLLS || !validating.value) {
        return
    }

    timer = setTimeout(async () => {
        timer = null
        polls.value += 1

        try {
            await fetchRun(id)
            pollError.value = null
        } catch (e) {
            pollError.value =
                e instanceof ApiError ? e.message : "couldn't refresh run"
        }

        armPoll(id)
    }, POLL_MS)
}

onScopeDispose(stopPolling)

try {
    await fetchRun(props.id)
} catch (e) {
    error.value = e instanceof ApiError ? e.status : 0
}

armPoll(props.id)
</script>

<style scoped>
.heading {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    column-gap: var(--default-spacing);
}

.heading-group {
    text-align: end;
    font-size: 1.2rem;
    margin-bottom: var(--default-spacing);
    min-width: 0;
    flex-shrink: 1;
    margin-left: auto;
}

.ended-at {
    color: var(--text-muted-2);
}

.run-author {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: fit-content;
}

.pfp-box {
    height: 2rem;
    corner-shape: initial;
}

.user-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex-shrink: 1;
}

.username {
    flex-shrink: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.detail-container {
    display: flex;
    flex-direction: column;
    gap: var(--default-spacing);
}
</style>
