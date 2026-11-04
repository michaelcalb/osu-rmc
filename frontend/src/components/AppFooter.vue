<template>
    <footer class="footer">
        <div class="f-content">
            <span class="version">
                v{{ commit.date }}・<a
                    href="https://github.com/michaelcalb/osu-rmc"
                    target="_blank"
                    rel="noopener noreferrer"
                    >{{ commit.hash }}</a
                >
            </span>
            <span class="f-text"
                >made with&nbsp;
                <abbr
                    title="love, passion &amp; coffee"
                    class="ily"
                    @mousedown="doYouLoveMeLoveMeLoveMe = true"
                    @mouseup="doYouLoveMeLoveMeLoveMe = false"
                    ><Heart :size="16"
                /></abbr>
                &nbsp;by&nbsp;
                <a
                    href="https://osu.ppy.sh/users/13955247"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="michas"
                    >michas</a
                >
            </span>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { Heart } from '@lucide/vue'
import { ref, watch } from 'vue'

const commit = __COMMIT__
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
    padding: 0 var(--default-spacing);
    color: var(--text-muted-2);
}

.f-content {
    display: flex;
    justify-content: space-between;
    flex: 1;
    max-width: var(--content-max-width);
}

.f-text {
    display: flex;
    align-items: center;
}

.ily {
    color: var(--accent);
    cursor: pointer;
}

.ily svg {
    display: block;
    fill: transparent;
    transition: fill 0.2s;
}

.ily:hover svg {
    fill: var(--accent);
}

.michas {
    transition: 0.2s;
}

.michas:hover {
    color: var(--accent);
}

.version {
    opacity: 0.5;
}
</style>
