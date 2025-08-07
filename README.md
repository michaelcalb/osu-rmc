> [!WARNING]
> ### I'm remaking this project from scratch to include official leaderboards and other gamemodes. (also it's kinda broken rn)

<div align=center>

# osu! Random Map Challenge
</div>
<div align=center>
<img src='public/osu-rmc-card.png'>
</div>

osu!rmc is a project I started working on around mid-February 2025 where **you have 1 hour to FC as many random beatmaps as possible**. It's very similar to Trackmania's RMC, but adapted to make it work well for osu!.

> [!NOTE]
> This project is not affiliated with osu!

## 1. Installation 📦

> [!IMPORTANT]
> In order to make osu!rmc work you need to have [Tosu](https://tosu.app) installed.
* Download the [latest release of osu!rmc](https://github.com/michaelcalb/osu-rmc/releases).
* Launch Setup.exe.
* Despite needing Tosu opened to work, you are not supposed to use the dashboard for this game, neither moving its files to the `static` folder.
* By default, Tosu accepts requests from any `localhost` port. [Follow these steps](#help-tosu-is-not-open) if you're having trouble.
* After launching the app for the first time, open the settings and follow the setup instructions.

> [!NOTE]
> This project's code is not digitally signed, so your antivirus may flag it as suspicious. Rest assured, you're safe. 🙏

## 2. How to Play 🎲

Once you're all set up, click "**Start RMC**". This will roll a random beatmap and start the 1-minute timer.
That means you have **one** minute to download the beatmap (just click on it) and open it in osu!.
> osu! doesn't allow automatic downloads. That's the only manual step, I promise.

After that, hit `Ctrl + V` in-game to paste the beatmap's name and difficulty in the search bar. Once you start the beatmap, the app automatically switches to the 1-hour timer.

When you FC the beatmap, the app automatically switches timers and rolls another beatmap for you.
**Any pass with no misses and no slider breaks counts as an FC, accuracy and slider ends don't matter.**

### Pausing the game
- You have a 10-minute "rest" timer to pause the game between maps.
- This timer can't be activated while playing the beatmap.

### Skipping a beatmap
- You get a **one free skip** per run. Use it whenever you want.
- Passing the beatmap with an **A-rank** allows you to skip it.
  - This skip always take priority over the free skip.
  - You can ignore the skip and keep retrying the beatmap until you FC it.
 
### Keep in mind
- Spamming the pause button reduces the timers by 1 second per click to prevent exploits.
- Using the pause button properly rewards you with +1 second, to account for mouse movement.
- If any timer hits 0, the app automatically switches back to the 1-hour timer.
- Once the main timer hits 0, the challenge is over.
- If the timer hits 0 during a beatmap and you FC it, it still counts.

Besides doing all I could to make this game "unexploitable" you can still just edit all the code and run it. So don't bother taking this to the competitive side (yet) and just try to have fun in osu! for once, please.

glhf!

## 3. Under the Hood ⚙️

### Randomness
Since the osu! API (v2) doesn't provide a built-in way to fetch a random beatmap, I had to come up with my own solution.
<details>
<summary>Here's what I did</summary>
osu! defines 13 genres for beatmaps, and each beatmapset must be assigned exactly one. Two of these are "Unspecified" and "Other", so it's unlikely new genres will be added.
  
That said, my code randomly selects a genre ID between 1-14 (excluding 8, which is skipped for some reason ¯\\\_(ツ)\_/¯), and randomly chooses to sort the results either ascending (oldest first) or descending (newest first).
  
The `/beatmapsets/search` endpoint is limited to 200 pages with 50 results (beatmapsets) per page, meaning you can retrieve up to 10,000 beatmapsets per genre. Since sorting can be done in both directions, that gives a theoretical limit of 20,000 beatmapsets per genre (13x = 260,000). For context, there are currently around [50,000 ranked beatmapsets](https://status.ppy.sh/).

As expected, not all genres fill all 200 pages (in fact, none do based on my rough testing), and requesting a non-existing page results in an error. To prevent that, the code performs a quick binary search to find the last valid page for the selected genre, picks a random valid page and then selects a random beatmapset from it. The difficulty is also randomly chosen.

> I'm open for other ideas, feel free to hmu.

</details>
<details>
<summary>Failed attempts</summary>
  
- [x] GET `/beatmapsets/search` `{g: 0, s: 'ranked'}`
> The API limits search results, leaving a gap of some years, so it's not possible to fetch all ranked beatmapset at once (which is completely reasonable).

- [x] GET `/beatmapsets/search` `{g: 0, s: 'ranked', sort: rankedDesc, page: 1}`
> Use the newest ranked beatmapset ID as a limiter and picking a random number to get a beatmapset. Terrible idea, no explanation needed.
</details>

### Client Credentials
The Client ID and Client Secret are saved in:
  
```
C:\Users\<User>\AppData\Roaming\osu-rmc\config.json
```

> [!CAUTION]
> Please don't open that file while streaming, or honestly, ever.

Here is [the exact endpoint where your client credentials are sent](https://github.com/michaelcalb/osu-rmc/blob/main/server.js#L28).

Here is [what the `saveConfig()` function does](https://github.com/michaelcalb/osu-rmc/blob/main/config.js#L36).

Feel free to read through the rest of the code (There are some smelly spaghetti, especially inside `index.js`. You've been warned).

## 4. Help
<details>
<summary><a name="help-tosu-is-not-open">"Tosu is not open" doesn't go away!</a></summary>
  
That's because your Tosu isn't accepting requests from `localhost`. To fix that, open your [dashboard's settings](http://127.0.0.1:24050/?tab=2) and under "Allowed IPs" include `localhost`. Restart osu!rmc.
</details>

## 5. Bug report / Feedback 🐛
I'm aware there are currently 2 bugs involving the skip button and the beatmap difficult recognizer. Will work on them soon.

If you encounter any bugs or have suggestions, feel free to reach out to me on Discord or osu! DMs. You can also open an issue on this repository if you're familiar with GitHub.

I’m fully aware the code isn’t perfect.

<!--
<details>
<summary>todo</summary>
  
- [ ] A bot so i can host it somewhere and make this into a really serious thing
- [ ] Leaderboards
- [ ] Filters
- [ ] RMS

</details>
-->

- Discord: `zmichas`
- [osu!](https://osu.ppy.sh/users/13955247)
