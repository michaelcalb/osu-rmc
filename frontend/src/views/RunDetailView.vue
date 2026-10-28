<template>
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
        <p v-if="loading">loading...</p>
        <p v-else-if="error">error: {{ error }}</p>

        <template v-else-if="pending">
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
    </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from 'vue'
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
const loading = ref(true)
const error = ref<string | null>(null)
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
    try {
        const lookup = await get<RunLookup>(`/leaderboards/runs/${id}`)

        error.value = null
        detail.value = lookup.status === 'complete' ? lookup : null
        pending.value = lookup.status === 'complete' ? null : lookup
    } catch (e) {
        error.value = e instanceof ApiError ? e.message : 'could not load run'
        detail.value = null
        pending.value = null
    }
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

        await fetchRun(id)

        armPoll(id)
    }, POLL_MS)
}

watch(
    () => props.id,
    async (id) => {
        stopPolling()
        polls.value = 0
        loading.value = true

        await fetchRun(id)

        loading.value = false
        armPoll(id)
    },
    { immediate: true }
)

onScopeDispose(stopPolling)
</script>

<style scoped>
.heading {
    display: flex;
    justify-content: space-between;
}

.heading-group {
    text-align: end;
    font-size: 1.2rem;
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
}

.detail-container {
    display: flex;
    flex-direction: column;
    gap: var(--default-spacing);
}
</style>
