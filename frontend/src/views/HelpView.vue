<template>
    <div class="title-row">
        <h1 class="title">how to play</h1>
        <button
            class="raw-btn tldr-btn"
            :aria-pressed="tldr"
            @click="tldr = !tldr"
        >
            tl;dr
        </button>
    </div>

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
                <template v-if="tldr">
                    <p>FC as many random maps as you can in one hour.</p>
                    <ul>
                        <li>
                            <span class="strong"
                                >FC = no misses and no slider-breaks.</span
                            >
                            missed slider-ends are fine, and rank doesn't
                            matter.
                        </li>
                        <li>
                            maps are drawn at random from all
                            <span class="strong">ranked maps</span>.
                        </li>
                        <li>
                            <span class="strong">osu!lazer only.</span>
                            (standard)
                        </li>
                    </ul>
                    <p>for each map:</p>
                    <ol>
                        <li>
                            after the map is revealed a
                            <span class="strong">1-minute prep timer</span>
                            starts. your hour is paused while it runs.
                        </li>
                        <li>
                            download the map and make sure you're ready to
                            start.
                        </li>
                        <li>
                            click <span class="strong">start map</span> before
                            hopping into osu!. if the button is disabled, just
                            go.
                        </li>
                        <li>
                            retry as often as you want. once you FC it, click
                            <span class="strong">next map</span>.
                        </li>
                    </ol>
                    <p>
                        when the hour runs out, you can still finish the map
                        you're on, and an FC on it counts. then click
                        <span class="strong">start validation</span>.
                    </p>
                    <p>
                        heads up: the clock on screen is an
                        <span class="strong">estimate</span>. your real time is
                        worked out during
                        <a href="#validation" class="link-1">validation</a>.
                        that's why properly using the
                        <span class="strong">start map</span> button is
                        recommended.
                    </p>
                </template>

                <template v-else>
                    <p>
                        the main goal in random map challenge is to FC as many
                        random beatmaps as possible in the span of an hour. an
                        FC is
                        <span class="strong"
                            >any score without misses or slider-breaks.
                            slider-ends and score ranks don't matter</span
                        >. the map pool consists of ranked maps only. the maps
                        are rolled and revealed to you, one at a time, through a
                        seed-based system. runs are played on
                        <span class="strong">osu!lazer only</span>, in
                        osu!standard.
                    </p>
                    <p>
                        after each map is revealed, a 1-minute timer will start
                        ticking, that's known as the "preparation timer". while
                        it runs, your hour is paused. it gives you enough time
                        to download the beatmap, take a deep breath, or even
                        practise it, since it's your minute to spend. when
                        you're heading into osu! to play, click the
                        <span class="strong">start map</span> button. if there
                        are more than 10 seconds left on the prep timer, it
                        drops to 10, just enough time to find the map and hit
                        play. if there are 10 or fewer, the button is disabled,
                        so just go.
                    </p>
                    <p>
                        you can retry the maps for as long as you like, and
                        after you manage to successfully FC each one, just hit
                        the <span class="strong">next map</span> button and
                        repeat the process until the hour is over. if time runs
                        out while you're mid-map, finish it anyway, because an
                        FC on it still counts. after that, click on the
                        <span class="strong">start validation</span> button to
                        begin the
                        <a href="#validation" class="link-1">validation</a>
                        process of your run.
                    </p>
                    <p>
                        one thing to keep in mind: the hour you see on screen is
                        an <span class="strong">estimate</span>, not the real
                        clock. your real time is only worked out during
                        <a href="#validation" class="link-1">validation</a>. the
                        two can drift apart, so you may have a bit less time
                        than shown. clicking
                        <span class="strong">start map</span> on every map keeps
                        the estimate close to the real thing.
                    </p>
                </template>
            </section>

            <section id="skips" class="content-section">
                <h2 class="section-title">skipping maps</h2>
                <template v-if="tldr">
                    <p>stuck on a map? there are three ways past it:</p>
                    <ul>
                        <li>
                            <span class="strong">skip (A rank)</span>: get an A
                            rank or better without an FC (a non-FC S works too).
                            no limit.
                        </li>
                        <li>
                            <span class="strong">skip (free)</span>: skip any
                            map, no conditions.
                            <span class="strong">once per run.</span>
                        </li>
                        <li>
                            <span class="strong">unplayable</span>: only if the
                            map is deleted, can't be downloaded, or is no longer
                            ranked.
                        </li>
                    </ul>
                </template>

                <template v-else>
                    <p>
                        there are some ways to skip beatmaps, and the one you
                        will be using the most is the A rank skip. if you manage
                        to get an A rank or better on the map without an FC (a
                        non-FC S rank works too), you can click on the
                        <span class="strong">skip (A rank)</span> button,
                        revealing the next map. you can also skip any map in the
                        run whenever you like by using the
                        <span class="strong">skip (free)</span> button, however,
                        this skip method can only be used
                        <span class="strong">once per run</span>, so choose
                        wisely.
                    </p>
                    <p>
                        the last skip method is the "unplayable" one and should
                        only be used if the map you rolled:
                    </p>
                    <ul>
                        <li>doesn't exist anymore</li>
                        <li>can't be downloaded (no .osz file)</li>
                        <li>is no longer ranked</li>
                    </ul>
                    <p>
                        this skip method exists because there can be a slight
                        desync between osu!'s database and mine, which can cause
                        rolled maps to be unplayable. hopefully, you will never
                        have to use this button.
                    </p>
                </template>
            </section>

            <section id="mods" class="content-section">
                <h2 class="section-title">using mods</h2>
                <template v-if="tldr">
                    <p>
                        any mod is allowed
                        <span class="strong"
                            >except relax, autopilot, autoplay and cinema.</span
                        >
                        you can switch mods between maps.
                    </p>
                    <p>there are two leaderboards:</p>
                    <ul>
                        <li>
                            <span class="strong">no mod</span>: no mods on any
                            map. classic (CL) is fine.
                        </li>
                        <li>
                            <span class="strong">free mod</span>: at least one
                            map cleared with a mod.
                        </li>
                    </ul>
                </template>

                <template v-else>
                    <p>
                        you are free to use any mod combination during your run,
                        <span class="strong"
                            >except relax, autopilot, autoplay and cinema</span
                        >. you can also freely change mod combinations for
                        different maps. depending on which mods you use, there
                        are 2 leaderboard categories your run can fall into,
                        either <span class="strong">no mod</span> or
                        <span class="strong">free mod</span>.
                    </p>
                    <p>
                        <span class="strong">no mod</span> runs are those where
                        every map has been cleared without any mods. the only
                        exception is Classic, so using Classic still results in
                        a no mod run, but using Hidden results in a free mod
                        run, for example.
                    </p>
                    <p>
                        <span class="strong">free mod</span> runs are those that
                        at least one map has been cleared with the use of
                        gameplay changing mods.
                    </p>
                    <p>
                        before starting a run, you have to select which
                        leaderboard to compete on. however, if you choose to
                        play a no mod run and, at any point, clear a map with a
                        gameplay changing mod, your run will be submitted for
                        the free mod leaderboard instead.
                    </p>
                </template>
            </section>

            <section id="validation" class="content-section">
                <h2 class="section-title">validation</h2>
                <template v-if="tldr">
                    <p>
                        your run isn't checked while you play. once you
                        validate, every map is checked against your real osu!
                        scores.
                    </p>
                    <p>
                        <span class="strong"
                            >your run ends at the first map that fails a
                            check.</span
                        >
                        everything before it still counts. a map fails if:
                    </p>
                    <ul>
                        <li>no score was found for it</li>
                        <li>
                            you skipped it with
                            <span class="strong">skip (A rank)</span> but didn't
                            get an A rank or better
                        </li>
                        <li>
                            you marked it
                            <span class="strong">unplayable</span> but it was
                            still playable
                        </li>
                        <li>you used a banned mod on it</li>
                        <li>you started it after your hour was up</li>
                    </ul>
                    <p>
                        so yes, you can lie, but you'll get
                        <span class="firetruck">firetrucked</span>.
                    </p>
                </template>

                <template v-else>
                    <p>
                        by now, you may have noticed that you can easily lie in
                        your run by claiming hard maps as "unplayable" or
                        spamming <span class="strong">skip (A rank)</span> until
                        an easy, short map appears for you to clear. while it's
                        true you can do that (and other things too), the moment
                        your run validates you will be
                        <span class="firetruck">firetrucked</span>.
                    </p>
                    <p>
                        once you start validation, every map in your run is
                        checked against your real osu! scores.
                        <span class="strong"
                            >your run ends at the first map that fails a
                            check</span
                        >, and everything before it still counts. a map fails if
                        no score was found for it, if you A rank skipped it
                        without an A rank, if you marked it unplayable while it
                        was still playable, if you used a banned mod on it, or
                        if you started it after your hour was up.
                    </p>
                    <p>
                        the validation process exists because your run is not
                        validated in real time. this is intended to make the run
                        itself go more smoothly, save on server resources, but
                        mainly to not go past osu!'s API usage limit.
                    </p>
                    <p>
                        if you want to fully understand how the validation
                        process works, you can check out this
                        <a href="#" class="link-1">documentation</a>.
                    </p>
                </template>
            </section>
            <section id="void" class="content-section">
                <h2 class="section-title">the void</h2>
                <template v-if="tldr">
                    <p>
                        very rarely, validation hits an error on my end and your
                        run is marked <span class="strong">void</span>. it won't
                        show on your profile or the leaderboards, but
                        <span class="strong">it isn't lost</span>.
                    </p>
                </template>

                <template v-else>
                    <p>
                        under very rare and specific circumstances your run can
                        receive the "void" status. voided runs do not show up on
                        your profile or the leaderboards page. this only happens
                        when an error on my end stops your run from being
                        validated, never as a punishment. if you ever see the
                        message that your run has been voided or if it seemingly
                        vanished after validating, don't worry, it can still be
                        recovered.
                    </p>
                </template>

                <p>
                    if you want to recover a voided run, feel free to contact me
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
                    >.
                </p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const tldr = ref(true)
</script>

<style scoped>
.title-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
}

.tldr-btn {
    font-size: 1.2rem;
    color: var(--text-muted);
    border: 2px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.25rem 1rem;
    transition: 0.2s;
}

.tldr-btn:hover {
    color: var(--accent);
    border-color: var(--accent);
}

.tldr-btn[aria-pressed='true'] {
    color: var(--bg);
    background-color: var(--accent);
    border-color: var(--accent);
}

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
    font-size: 1.2rem;
    color: var(--text-muted-3);
    list-style-position: inside;
}

.section-title {
    font-weight: 300;
    font-size: 2rem;
    color: inherit;
}
</style>
