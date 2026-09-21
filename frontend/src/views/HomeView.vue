<template>
    <section class="title-section">
        <h1 class="h1">welcome to <span class="osu-rmc">osu!<span class="rmc rmc-initial">rmc</span></span></h1>

        <hr class="separator">
        
        <p class="subtitle">
            osu! <span class="rmc-initial">r</span>andom <span class="rmc-initial">m</span>ap <span class="rmc-initial">c</span>hallenge
        </p>
    </section>

    <section class="long-p-section">
        <p class="long-p">
            similarly to <a href="https://flinkblog.de/RMC/" target="_blank" rel="noopener noreferrer">Trackmania's Random Map Challenge</a>, here you have 1 hour to FC as many randomly chosen (ranked) beatmaps as possible. there are some other very important rules tho, so you should definitely take a look at <RouterLink to="/help">how to play</RouterLink> first before hopping into your first run.
        </p>
        <p class="long-p">
            since this is a very <span class="not-that-serious" @mouseenter="seriousHover = true" @mouseleave="seriousHover = false">{{ seriousHover ? 'silly ;)' : 'serious' }}</span> project, there is a whole run-validation process (basically an anti-cheat). oh, and thanks to that there is also official <RouterLink to="/boards/no_mod">leaderboards</RouterLink> to compete on!
        </p>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const seriousHover = ref(false)
</script>

<style scoped>
.title-section {
    width: fit-content;
    margin-bottom: var(--content-spacing);
}

.h1 {
    font-weight: 500;
    font-size: 3rem;
}

.osu-rmc {
    cursor: default;
}

.rmc-initial {
    transition: .2s;
}

.title-section:has(.osu-rmc:hover) .rmc-initial {
    color: var(--accent);
}

.rmc {
    font-size: 1.4em;
}

.separator {
    width: 100%;
    border: none;
    height: 2px;
    border-radius: 1rem;
    background-color: var(--border);
    margin: 5px 0;
}

.subtitle {
    font-size: 2rem;
}

.long-p-section {
    display: flex;
    flex-direction: column;
    gap: calc(var(--content-spacing) / 2);
}

.long-p {
    max-width: 50%;
    text-align: justify;
    font-size: 1.2rem;
}

a {
    color: var(--a);
    transition: .2s;
}

a:hover {
    color: var(--accent);
}
</style>