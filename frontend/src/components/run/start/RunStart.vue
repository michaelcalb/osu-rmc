<template>
    <section class="title-section">
        <h1 class="title">start run</h1>
        <hr class="separator" />
    </section>

    <div class="toggle-group">
        <button
            :class="`toggle ${declaredMode === 'no_mod' ? 'active' : ''}`"
            @click="declaredMode = 'no_mod'"
        >
            no mod
        </button>
        <button
            :class="`toggle ${declaredMode === 'free_mod' ? 'active' : ''}`"
            @click="declaredMode = 'free_mod'"
        >
            free mod
        </button>
    </div>

    <div class="mode-description">
        <template v-if="declaredMode == 'no_mod'">
            <ul class="mode-rules">
                <li>
                    you are <span class="strong">not</span> allowed to use mods
                    during your run, with a few exceptions.
                </li>
                <li>
                    using (unallowed) mods will result in your run being
                    converted to a <span class="strong">free mod</span> run.
                </li>
            </ul>
            <div class="mod-list-box">
                <p>
                    the following mods are
                    <span class="strong">allowed</span> in no mod runs:
                </p>
                <ModList :mods="ALLOWED_MODS" />
                <p class="advice">
                    keep in mind: average run score is used as tie-breaker for
                    runs with the same FC amount, so using Classic (CL) can give
                    you an unwanted disadvantage since it lowers your score
                    multiplier.
                </p>
            </div>
        </template>
        <template v-else>
            <ul class="mode-rules">
                <li>you are allowed to use any mods during your run.</li>
                <li>you can freely swap mods between maps.</li>
                <li>you can customise the mods (2x DT, etc.)</li>
            </ul>
        </template>
        <div class="mod-list-box">
            <p>
                the following mods are
                <span class="strong">strictly banned</span> from all runs and
                leaderboards:
            </p>
            <ModList :mods="BANNED_MODS" />
        </div>
    </div>

    <button
        :disabled="busy"
        @click="emit('start', declaredMode)"
        :class="`start-btn ${busy && 'busy'}`"
    >
        {{ starting ? 'starting run...' : 'start run' }}
    </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Board } from '../../../lib/types'
import { ALLOWED_MODS, BANNED_MODS } from '../../../lib/mods'
import ModList from '../../ModList.vue'

defineProps<{
    busy: boolean
    starting: boolean
}>()

const emit = defineEmits<{
    start: [mode: Board]
}>()

const declaredMode = ref<Board>('no_mod')
</script>

<style scoped>
.mode-description {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    font-size: 1.1rem;
}

.mode-rules {
    list-style-position: inside;
}

.mod-list-box {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.mod-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.mod-icon {
    height: 1.75rem;
}

.mode-description {
    margin: var(--default-spacing) 0;
}

.start-btn {
    font-size: 1.25rem;
    padding: 0.5rem 1rem;
    background-color: var(--accent-2);
    corner-shape: squircle;
    border-radius: 1rem;
}

.busy {
    opacity: 0.5;
}
</style>
