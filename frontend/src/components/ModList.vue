<template>
    <TooltipProvider :delay-duration="0">
        <div class="mod-list">
            <TooltipRoot v-for="mod in mods" :key="mod">
                <TooltipTrigger
                    as="img"
                    :src="modIcon(modName(mod))"
                    :alt="modName(mod)"
                    class="mod-icon"
                />
                <TooltipPortal>
                    <TooltipContent class="tooltip" :side-offset="4">
                        {{ modName(mod) }}
                    </TooltipContent>
                </TooltipPortal>
            </TooltipRoot>
        </div>
    </TooltipProvider>
</template>

<script setup lang="ts">
import {
    TooltipContent,
    TooltipPortal,
    TooltipProvider,
    TooltipRoot,
    TooltipTrigger
} from 'reka-ui'
import { modIcon, modName } from '../lib/mods'

defineProps<{
    mods: readonly string[]
}>()
</script>

<style scoped>
.mod-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.mod-icon {
    height: 1.75rem;
}
</style>
