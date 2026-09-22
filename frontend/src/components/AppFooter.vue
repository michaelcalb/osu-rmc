<template>
    <footer class="footer">
        <div class="f-content">
            <span class="version">
                v{{ version }}
            </span>
            <span class="f-text">made with <abbr title="love, passion &amp; coffee" class="ily" @mousedown="doYouLoveMeLoveMeLoveMe = true" @mouseup="doYouLoveMeLoveMeLoveMe = false"><Heart :size="16" /></abbr> by <a href="https://osu.ppy.sh/users/13955247" target="_blank" rel="noopener noreferrer" class="michas">michas</a></span>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { Heart } from '@lucide/vue';
import { version } from '../../package.json'
import { ref, watch } from 'vue';

const doYouLoveMeLoveMeLoveMe = ref(false)
let previousTitle = ''

watch(doYouLoveMeLoveMeLoveMe, (love) => {
  if (love) {
    previousTitle = document.title
    document.title = 'do you love me love me love me'
  } else {
    document.title = previousTitle
  }
})
</script>

<style scoped>
.footer {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: calc(var(--content-padding) / 2) var(--content-padding);
    color: var(--text-muted-2);
}

.f-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
    max-width: var(--content-max-width);
}

.ily {
    color: var(--accent);
    cursor: pointer;
}

.ily svg {
    vertical-align: middle;
    fill: transparent;
    transition: fill .2s;
}

.ily:hover svg {
    fill: var(--accent);
}

.michas {
    transition: .2s;
}

.michas:hover {
    color: var(--accent);
}

.version {
    opacity: .273;
}
</style>