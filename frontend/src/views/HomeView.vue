<template>
    <section class="title-section">
        <h1 class="title">
            welcome to
            <span class="osu-rmc"
                >osu!<span class="rmc-initial">rmc</span></span
            >
        </h1>

        <hr class="separator" />

        <p class="subtitle">
            osu! <span class="rmc-initial">r</span>andom
            <span class="rmc-initial">m</span>ap
            <span class="rmc-initial">c</span>hallenge
        </p>
    </section>

    <div class="content-container">
        <section class="intro-section">
            <p>
                similarly to
                <a
                    href="https://flinkblog.de/RMC/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link-1"
                    >Trackmania's Random Map Challenge</a
                >, here you have 1 hour to FC as many random beatmaps as
                possible. there are some other very important rules though, so
                you should definitely take a look at
                <RouterLink to="/help" class="link-1">how to play</RouterLink>
                first before hopping into your first run.
            </p>
            <p>
                if you're having trouble, have any questions or just want to
                share your thoughts on this project, feel free to contact me
                through
                <a
                    href="https://osu.ppy.sh/users/13955247"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link-1"
                    >osu!</a
                >
                or
                <a
                    href="https://discord.com/users/316699326581702657"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link-1"
                    >Discord</a
                >. thanks for stopping by. <span class="mono">&lt;3</span>
            </p>
            <p>
                this project is not affiliated with
                <a
                    href="https://osu.ppy.sh/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link-1"
                    >osu!</a
                >
            </p>
            <p>glhf! <span class="mono">;&rpar;</span></p>
        </section>
        <section class="actions-section">
            <RouterLink to="/help" class="action-link">
                <p class="action-text">check the rules</p>
                <CircleQuestionMark
                    :stroke-width="0.5"
                    :size="112"
                    class="action-icon"
                />
            </RouterLink>
            <RouterLink to="/boards/no_mod" class="action-link">
                <p class="action-text">view the leaderboards</p>
                <Trophy :stroke-width="0.5" :size="112" class="action-icon" />
            </RouterLink>
            <RouterLink to="/run" class="action-link">
                <p class="action-text">start a new run</p>
                <Dices :stroke-width="0.5" :size="112" class="action-icon" />
            </RouterLink>
        </section>
    </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { CircleQuestionMark, Dices, Trophy } from '@lucide/vue'
</script>

<style scoped>
.osu-rmc {
    cursor: default;
}

.rmc-initial {
    transition: 0.2s;
}

.title-section:has(.osu-rmc:hover) .rmc-initial {
    color: var(--accent);
}

.content-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--default-spacing);
}

.intro-section {
    display: flex;
    flex-direction: column;
    gap: calc(var(--default-spacing) / 2);
}

.intro-section {
    text-align: justify;
    font-size: 1.1rem;
}

.actions-section {
    display: grid;
    gap: calc(var(--default-spacing) / 2);
}

.action-link {
    min-height: 80px;
    position: relative;
    border-radius: 0.5rem;
    border: 2px solid transparent;
    overflow: hidden;
    text-shadow: 1px 1px 2px #000;
    background:
        linear-gradient(
                180deg,
                var(--bg-2),
                rgb(from var(--accent) r g b / 0.1)
            )
            padding-box,
        linear-gradient(var(--bg-2), var(--bg-2)) padding-box,
        linear-gradient(180deg, var(--bg-2), var(--accent)) border-box;
}

.action-link:hover {
    background: rgb(from var(--accent) r g b / 0.1) padding-box;
    border-color: var(--accent);
}

.action-link:hover .action-icon {
    transform: scale(1.1) rotate(-2deg);
}

.action-link > * {
    margin: 1rem;
}

.action-text {
    position: relative;
    z-index: 1;
    font-size: 1.2rem;
}

.action-icon {
    position: absolute;
    inset-block: 0;
    right: 0;
    margin-block: auto;
    color: rgb(from var(--accent) r g b / 0.5);
    transition: 0.2s;
}

@media (max-width: 700px) {
    .content-container {
        grid-template-columns: 1fr;
    }
}
</style>
