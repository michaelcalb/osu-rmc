<template>
    <h1 class="title">how to play</h1>

    <div class="layout">
        <nav class="toc">
            <a href="#basics">the basics</a>
            <a href="#skips">skipping maps</a>
            <a href="#mods">mods</a>
            <a href="#validation">validation</a>
            <a href="#void">the void</a>
        </nav>

        <div class="content">
            <section id="basics" class="content-section">
                <h2 class="section-title">the basics</h2>
                <p>
                    your goal is to FC as many maps as you can within one hour.
                    the maps are drawn at random from all
                    <span class="strong">ranked maps</span> and revealed to you
                    one at a time.
                </p>
                <ul>
                    <li>
                        <span class="strong"
                            >an FC is any score with no misses and no
                            slider-breaks.</span
                        >
                        missed slider-ends are allowed, and your rank doesn't
                        matter.
                    </li>
                    <li>
                        runs are played on
                        <span class="strong">osu!lazer only</span>, in
                        osu!standard.
                    </li>
                    <li>
                        only scores you set
                        <span class="strong">after the map is revealed</span>
                        count. an FC you already had on that map before the run
                        doesn't.
                    </li>
                    <li>
                        you can retry each map as many times as you want. only
                        your best score on it counts.
                    </li>
                </ul>
                <p>for each map:</p>
                <ol>
                    <li>
                        when the map is revealed, a
                        <span class="strong">1-minute prep timer</span> starts.
                        your hour is paused while it runs. use it to download
                        the map and get ready to play.
                    </li>
                    <li>
                        click <span class="strong">start map</span> right before
                        you start playing. if more than 10 seconds are left on
                        the prep timer, it drops to 10, which is enough time to
                        find the map and hit play. if 10 or fewer are left, the
                        button is disabled and you can start playing right away.
                    </li>
                    <li>
                        once you FC the map, click
                        <span class="strong">next map</span> to reveal the next
                        one.
                    </li>
                </ol>
                <p>
                    if the hour runs out while you're playing a map, finish it.
                    an FC on that map still counts. when you're done, click
                    <span class="strong">start validation</span> to submit your
                    run.
                </p>
                <p>
                    the clock on screen is an
                    <span class="strong">estimate</span>. your real time is
                    calculated during
                    <a href="#validation" class="link-1">validation</a>, and it
                    can be slightly lower than what the clock showed. clicking
                    <span class="strong">start map</span> on every map keeps the
                    two as close as possible.
                </p>
            </section>

            <section id="skips" class="content-section">
                <h2 class="section-title">skipping maps</h2>
                <p>
                    if you can't FC a map, there are three ways to move past it:
                </p>
                <ul>
                    <li>
                        <span class="strong">skip (A rank)</span>: set an A rank
                        or better on the map without an FC (a non-FC S rank also
                        works), then click this button. you can use it as many
                        times as you want.
                    </li>
                    <li>
                        <span class="strong">skip (free)</span>: skips the
                        current map with no requirement. you can only use it
                        <span class="strong">once per run</span>.
                    </li>
                    <li>
                        <span class="strong">unplayable</span>: use it only if
                        the map was deleted, can't be downloaded, or is no
                        longer ranked.
                    </li>
                </ul>
            </section>

            <section id="mods" class="content-section">
                <h2 class="section-title">mods</h2>
                <p>
                    you can use any mod combination, and you can change it from
                    one map to the next. there are two leaderboards, and the
                    mods you play with decide which one your run goes to:
                </p>
                <ul>
                    <li>
                        <span class="strong">no mod</span>: every map was played
                        with no mods, or only with the allowed mods below.
                    </li>
                    <li>
                        <span class="strong">free mod</span>: at least one map
                        was played with any other mod.
                    </li>
                </ul>
                <p>
                    the following mods are
                    <span class="strong">allowed</span> in no mod runs:
                </p>
                <ModList :mods="ALLOWED_MODS" />
                <p>
                    the following mods are
                    <span class="strong">strictly banned</span> from all runs
                    and leaderboards:
                </p>
                <ModList :mods="BANNED_MODS" />
                <p>
                    you pick a leaderboard before starting the run, but the mods
                    you actually use take priority. if you pick no mod and play
                    even one map with a gameplay-changing mod, your run is moved
                    to free mod.
                </p>
            </section>

            <section id="validation" class="content-section">
                <h2 class="section-title">validation</h2>
                <p>
                    during your run, as you will soon find out, nothing stops
                    you from lying the outcomes of each map. that's why the
                    validation process exists.
                </p>
                <p>your entire run is validated once, after it ends.</p>
                <p>
                    in short, it compares the claims you made with what your
                    osu! profile actually has to say about them, checking map by
                    map. if you get caught lying, you will be
                    <span class="firetruck">firetrucked</span>.
                </p>
                <p>
                    for a more in depth version of how the validation process
                    works, refer to this documentation.
                </p>
            </section>

            <section id="void" class="content-section">
                <h2 class="section-title">the void</h2>
                <p>
                    if an error on my end stops your run from being validated,
                    the run is marked <span class="strong">void</span>. voided
                    runs don't show on your profile or the leaderboards. this is
                    never a penalty, and the run
                    <span class="strong">can be recovered</span>.
                </p>
                <p>
                    to recover a voided run, send
                    <a
                        href="https://osu.ppy.sh/users/13955247"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="link-1"
                        >me</a
                    >
                    a dm in osu! with the run id (the number at the top of the
                    run page) and a short description of what happened
                    <span class="mono">&semi;&rpar;</span>
                </p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ALLOWED_MODS, BANNED_MODS } from '../lib/mods'
import ModList from '../components/ModList.vue'
</script>

<style scoped>
.layout {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: var(--default-spacing);
    align-items: start;
    margin-top: var(--default-spacing);
}

.toc {
    position: sticky;
    top: calc(var(--h-height) + 1rem);
    display: flex;
    flex-direction: column;
    border-right: 2px solid var(--border);
}

.toc a {
    color: var(--text-muted);
    padding: 0.5rem 0;
}

.toc a:hover {
    color: var(--accent);
}

.content {
    display: flex;
    flex-direction: column;
    gap: var(--default-spacing);
}

.content-section {
    display: flex;
    flex-direction: column;
    gap: calc(var(--default-spacing) / 2);
}

.content-section > * {
    text-align: justify;
    list-style-position: inside;
    font-size: 1.1rem;
}

.section-title {
    font-weight: 300;
    font-size: 2rem;
}

@media (max-width: 700px) {
    .layout {
        grid-template-columns: 1fr;
    }

    .toc {
        position: static;
        flex-direction: row;
        flex-wrap: wrap;
        column-gap: 1rem;
        border-right: none;
        border-bottom: 2px solid var(--border);
    }
}
</style>
