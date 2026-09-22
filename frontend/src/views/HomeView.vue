<template>
    <section class="title-section">
        <h1 class="h1">welcome to <span class="osu-rmc">osu!<span class="rmc rmc-initial">rmc</span></span></h1>

        <hr class="separator">
        
        <p class="subtitle">
            osu! <span class="rmc-initial">r</span>andom <span class="rmc-initial">m</span>ap <span class="rmc-initial">c</span>hallenge
        </p>
    </section>

    <section class="content-section">
        <p>
            similarly to <a href="https://flinkblog.de/RMC/" target="_blank" rel="noopener noreferrer">Trackmania's Random Map Challenge</a>, here you have 1 hour to FC as many randomly chosen (ranked) beatmaps as possible. there are some other very important rules tho, so you should definitely take a look at <RouterLink to="/help">how to play</RouterLink> first before hopping into your first run.
        </p>
        <p>
            you can also compete on the <RouterLink to="/boards/no_mod">leaderboards</RouterLink>! that's possible thanks to a server-side run-validation process (basically an anti-cheat) that compares your claimed scores during the run to the scores published in your osu! account.
        </p>
        <p>
            for more information about the validation process and how it works, you can check out this <a href="#">documentation</a>. you don't need to understand it to play, but feel free to read it if you're curious, just keep in mind the language there is somewhat technical.
        </p>
        <p>
            this project is still a work in progress, so expect a lot of changes, design-wise mostly. the core mechanics will most likely remain the same.
        </p>
        <p>
            if you're having trouble, have any questions or just wanna share your thoughts on this project, feel free to hmu on <a href="https://osu.ppy.sh/users/13955247" target="_blank" rel="noopener noreferrer">osu!</a> or <a href="https://discordapp.com/users/316699326581702657" target="_blank" rel="noopener noreferrer">Discord</a>. thanks for playing <span class="mono">;&rpar;</span>
        </p>
        <p>glhf! <span class="mono">&lt;3</span></p>
    </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.title-section {
    width: fit-content;
    margin-bottom: var(--content-spacing);
}

.h1 {
    font-weight: 500;
    font-size: 2.5rem;
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
    font-size: 1.5rem;
}

.content-section {
    display: flex;
    flex-direction: column;
    gap: calc(var(--content-spacing) / 2);
}

.content-section > * {
    max-width: 50%;
    text-align: justify;
    font-size: 1.2rem;
}

a {
    color: var(--text-color-a);
    transition: .2s;
}

a:hover {
    color: var(--accent);
}
</style>