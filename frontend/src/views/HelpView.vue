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
                    the main goal in random map challenge is to FC as many random beatmaps as possible in the span of an hour. an FC is <span class="strong">any score without misses nor slider-breaks. slider-ends and score ranks don't matter</span>. the map pool consists of ranked maps only. the maps are rolled and revealed to you, one at a time, through a seed-based system.
                </p>
                <p>
                    after each map is revealed, a 1-minute timer will start ticking, that's known as the "preparation timer". it basically gives you enough time to download the beatmap, take a deep breath and start playing it. <span class="strong">this timer must not be used to play the map</span>. instead, if you are ready to start before the prep-timer ends, simply click on the "start map" button and begin.
                </p>
                <p>
                    you can retry the maps for as long as you like, and after you manage to sucessfully FC each one, just hit the "next map" button and repeat the process until the hour is over. after your time is over, simply click on the "validate run" button to begin the <a href="#validation" class="link-1">validation</a> process of your run.
                </p>
            </section>

            <section id="skips" class="content-section">
                <h2 class="section-title">skipping maps</h2>
                <p>
                    there are some ways to skip beatmaps, and the one you will be using the most is known as the "A-rank" skip. if you manage to get an A-rank score on the map (or a non-FC S-rank), you can click on the "A-rank skip" button, revealing the next map. you can also skip any map in the run whenever you like by using the "free skip" button, however, this skip method can only be used <span class="strong">once per run</span>, so choose wisely.
                </p>
                <p>
                    the last skip method is the "unplayable" one and should only be used if the map you rolled:
                </p>
                <ul>
                    <li>doesn't exist anymore</li>
                    <li>can't be downloaded (no .osz file)</li>
                    <li>is no longer ranked</li>
                </ul>
                <p>
                    this skip method exists because there is a slighlty desynchronization between osu!'s database and mine, which can cause rolled maps to be unplayable. hopefully, you will never have to use this button.
                </p>
            </section>

            <section id="mods" class="content-section">
                <h2 class="section-title">using mods</h2>
                <p>
                    you are free to use any <span class="strong">ranked mod</span> combination during your run (mods that, when used, still submit your scores to osu!). you can also freely change mod combinations for different maps. depending on which mods you use, there are 2 leaderboard categories your run can fall into, either <span class="strong">no mod</span> or <span class="strong">free mod</span>.
                </p>
                <p><span class="strong">no mod</span> runs are those that all maps have been cleared without the use of gameplay changing mods, meaning using the Classic mod results in a no mod run, but using Hidden results in a free mod run for example.</p>
                <p><span class="strong">free mod</span> runs are those that at least one map has been cleared with the use of gameplay changing mods.</p>
                <p>before starting a run, you have to select which leaderboard to compete on. however, if you choose to play a no mod run and, at any point, clear a map with a gameplay changing mod, your run will be submitted for the free mod leaderboard instead.</p>
            </section>

            <section id="validation" class="content-section">
                <h2 class="section-title">validation</h2>
                <p>by now, you may have noticed that you can easily lie in your run by claiming hard maps as "unplayable" or spamming the "A-rank skip" button until an easy, short map appears for you to clear. while it's true you can do that (and other things too), the moment your run validates you will be <span class="firetruck">firetrucked</span>.</p>
                <p>the validation process exists because your run is not validated in real time. this is intended to make the run itself be more smoothly, save on server resources but mainly to not go past the osu!'s API usage limit.</p>
                <p>if you want to fully understand how the validation process works, you can check out this <a href="#" class="link-1">documentation</a>.</p>
            </section>
            <section id="void" class="content-section">
                <h2 class="section-title">the void</h2>
                <p>
                    under very rare and specific circumstances your run can receive the "void" status. voided runs do not show up on your profile or the leaderboards' page. the most common causes for this comes from certain errors that can happen in the validation process. if you ever see the message that your run has been voided or if it seemingly vanished after validating, don't worry, it can still be recovered.
                </p>
                <p>
                    if you want to recover a voided run, feel free to contact me through <a href="https://osu.ppy.sh/users/13955247" target="_blank" rel="noopener noreferrer" class="link-1">osu!</a> or <a href="https://discordapp.com/users/316699326581702657" target="_blank" rel="noopener noreferrer" class="link-1">Discord</a>.
                </p>
            </section>
        </div>
    </div>
    
</template>

<script setup lang="ts">

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

.content-section > * {
    margin-bottom: calc(var(--default-spacing) / 2);
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

.strong {
    color: var(--accent);
    font-weight: 500;
}
</style>