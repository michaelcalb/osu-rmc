<template>
    <img
        :src="coverUrl(map.set_id, map.cover_updated_at, variant)"
        :alt="`${map.artist} - ${map.title}`"
        @error="useDefaultBg"
    />
</template>

<script setup lang="ts">
import { coverUrl, type CoverVariant } from '../lib/covers';
import type { ServedMap } from '../lib/types'
import defaultBg from '../assets/default-map-bg.jpg'

const { map, variant = 'cover' } = defineProps<{
    map: Pick<ServedMap, 'set_id' | 'cover_updated_at' | 'artist' | 'title'>
    variant?: CoverVariant
}>()

function useDefaultBg(event: Event) {
    ;(event.target as HTMLImageElement).src = defaultBg
}
</script>