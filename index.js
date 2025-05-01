// beatmap
const bmUrl = document.getElementById('bm-url')
const bmBackground = document.getElementById('bm-background')
const bmTitle = document.getElementById('bm-title')
const bmDifficulty = document.getElementById('bm-diff')
const bmStarRating = document.getElementById('bm-sr')
const bmLength = document.getElementById('bm-length')

// bm status
const bmAlert = document.getElementById('bm-alert')
const warningText = document.getElementById('warning-text')
const rollingBm = document.getElementById('rolling-bm')

// overlay
const rmcButton = document.getElementById('rmc-button')
const restartButton = document.getElementById('restart-button')
const settingsButton = document.getElementById('settings-button')
const skipButton = document.getElementById('skip-button')

// results screen
const resultsScreenContainer = document.getElementById('results-screen-container')
const closeRs = document.getElementById('close-rs')
const statsTitle = document.getElementById('rs-stats-title')
const mapsTitle = document.getElementById('rs-maps-title')

// fc & skip counters
const fcScore = document.getElementById('fc-score')
const skipScore = document.getElementById('skip-score')
const fcCounter = document.getElementById('fc-counter')
const skipCounter = document.getElementById('skip-counter')

let scores = {
    'fcs': {
        'count': 0,
        'countEl': fcCounter,
        'element': fcScore
    },
    'skips': {
        'count': 0,
        'countEl': skipCounter,
        'element': skipScore
    }
}

// timers
const mainTimer = document.getElementById('main-timer')
const cdTimer = document.getElementById('cd-timer')
const restTimer = document.getElementById('rest-timer')
const restTimerButton = document.getElementById('rest-timer-button')
const playIcon = document.getElementById('rest-play-icon')
const pauseIcon = document.getElementById('rest-pause-icon')

const timers = {
    'mainTimer': {
        'secs': 3600,
        'element': mainTimer
    },
    'cdTimer': {
        'secs': 60,
        'element': cdTimer
    },
    'restTimer': {
        'secs': 600,
        'element': restTimer
    },
}

let gameOver = false
let currentTimerInterval = null
let lastClickTime = 0

// syncing api res with tosu
let currentBeatmapsetId
let currentBeatmapId

// dom
window.addEventListener('DOMContentLoaded', () => {

    if (localStorage.getItem('resultsScreen')) {
        resultsScreen()
        return
    }

    const savedBeatmap = localStorage.getItem('beatmap')
    if (savedBeatmap) {
        const bm = JSON.parse(savedBeatmap)
        
        loadBeatmap(bm)
    
        console.log('Beatmap loaded from last session.')

        rmcButton.classList.replace('visible', 'invisible')
        restartButton.classList.replace('invisible', 'visible')

        bmFetched = true
    
        randomBeatmapChallenge()
    } else {
        localStorage.clear()
        electron.sendReset()
    }

    const savedTimer = localStorage.getItem('activeTimer')
    if (savedTimer) {
        const savedTimerSecs = parseInt(localStorage.getItem(savedTimer))
        let subtract = Math.floor(Date.now() / 1000) - parseInt(localStorage.getItem('timestamp'))

        if (savedTimer !== 'mainTimer' && subtract > savedTimerSecs) {
            const currentMainTimerSecs = parseInt(localStorage.getItem('mainTimer'))
            localStorage.setItem(savedTimer, 0)
            subtract -= savedTimerSecs
            localStorage.setItem('mainTimer', currentMainTimerSecs - subtract)
            changeTimer('mainTimer')
        } else {
            localStorage.setItem(savedTimer, savedTimerSecs - subtract)
            changeTimer(savedTimer)
        }

        if (localStorage.getItem('mainTimer') <= 0) {
            resultsScreenContainer.classList.replace('invisible', 'visible')
            localStorage.setItem('mainTimer', 0)
        }
    } else {
        restTimerButton.disabled = true
        restartButton.disabled = true
    }

    // fc and skip counters
    for(let [key, { count }] of Object.entries(scores)) {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, count)
        }

        scores[key].countEl.textContent = localStorage.getItem(key)
    }

    // timers values
    for(let [key, { secs }] of Object.entries(timers)) {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, secs)
        }

        updateDisplay(key, timers[key])
    }

    // check for zeroed timers
    for (let key in timers) {
        if (localStorage.getItem(key) == 0) {
            timers[key].element.classList.add('timer-end')
        } 
    }

    // rest timer css
    localStorage.getItem('restTimer') <= 0 ? restTimerButton.disabled = true : null
    if (localStorage.getItem('activeTimer') === 'restTimer') {
        pauseIcon.style.display = 'block'
        playIcon.style.display = 'none'
    }

    // check (free) skip
    const skippable = localStorage.getItem('_skip') || localStorage.getItem('freeSkip')
    skippable ? skipButton.disabled = !skippable : skipButton.disabled = true

    if (localStorage.getItem('freeSkip') && !localStorage.getItem('_skip')) {
        skipButton.textContent = 'Skip map (free skip)'
    }
})

rmcButton.addEventListener('click', async () => {
    try {
        const config = await electron.getConfig()

        if (config.client_id && config.client_secret) {
            localStorage.setItem('freeSkip', true)
            skipButton.disabled = false
            skipButton.textContent = 'Skip map (free skip)'
            rmcButton.classList.replace('visible', 'invisible')
            restartButton.classList.replace('invisible', 'visible')
            randomBeatmapChallenge()
        } else {
            electron.openSettings()
        }
    } catch (error) {
        console.error('Error loading config:', error)
    }
})

document.getElementById('copy-bm-info').addEventListener('click', () => {
    if (bmTitle && bmDifficulty) {
        const textToCopy = `${bmTitle.textContent} [${bmDifficulty.textContent}]`

        navigator.clipboard.writeText(textToCopy)
        console.log('Beatmap info copied to clipboard.')
    } else {
        console.log('Beatmap info is not loaded')
    }
})

skipButton.addEventListener('click', () => {
    skipButton.disabled = true

    if (localStorage.getItem('_skip')) {
        localStorage.removeItem('_skip')

        if (localStorage.getItem('freeSkip')) {
            skipButton.disabled = false
            skipButton.textContent = 'Skip map (free skip)'
        }
    } else {
        localStorage.removeItem('freeSkip')
        skipButton.textContent = 'Skip map'
    }
    
    updateScore('skips')
    bmFetched = false
    randomBeatmapChallenge()
})

restTimerButton.addEventListener('click', () => {
    const now = Date.now()
    const restSecs = parseInt(localStorage.getItem('restTimer'))

    if (now - lastClickTime >= 1000 && localStorage.getItem('activeTimer') === 'restTimer') {
        localStorage.setItem('restTimer', restSecs + 1)
    }

    lastClickTime = now

    if (localStorage.getItem('activeTimer') === 'restTimer') {
        const lastTimer = localStorage.getItem('lastTimer')
        
        pauseIcon.style.display = 'none'
        playIcon.style.display = 'block'

        updateDisplay('restTimer', timers.restTimer)
        changeTimer(lastTimer)
    } else {
        const currentPauses = parseInt(localStorage.getItem('pauses') || 0)
        playIcon.style.display = 'none'
        pauseIcon.style.display = 'block'

        changeTimer('restTimer')
        localStorage.setItem('pauses', currentPauses + 1)
    }
})

settingsButton.addEventListener('click', () => {
    electron.openSettings()
})

closeRs.addEventListener('click', () => {
    resultsScreenContainer.classList.replace('visible', 'invisible')
    localStorage.clear()
    location.reload()
})

statsTitle.addEventListener('click', () => {
    mapsTitle.parentElement.classList.toggle('rs-box-closed')
    statsTitle.parentElement.classList.toggle('rs-box-closed')
})

mapsTitle.addEventListener('click', () => {
    statsTitle.parentElement.classList.toggle('rs-box-closed')
    mapsTitle.parentElement.classList.toggle('rs-box-closed')
})

// restart
let holdTimeout

restartButton.addEventListener('mousedown', () => {
    restartButton.classList.add('holding')

    holdTimeout = setTimeout(() => {
        resultsScreen()
    }, 2000)
})

restartButton.addEventListener('mouseup', () => {
    clearTimeout(holdTimeout)
    restartButton.classList.remove('holding')
})

restartButton.addEventListener('mouseleave', () => {
    clearTimeout(holdTimeout)
    restartButton.classList.remove('holding')
})

// functions
async function loadBeatmap(bm) {
    const bmImg = await validateImage(bm.background_image)
    const url = `https://osu.ppy.sh/beatmapsets/${bm.beatmapset_id}#osu/${bm.beatmap_id}`
    const minutes = Math.floor(bm.beatmap_length / 60)
    const seconds = bm.beatmap_length % 60

    bmUrl.href = url
    bmBackground.src = bmImg
    bmTitle.textContent = bm.title
    bmDifficulty.textContent = bm.difficulty_name
    bmStarRating.textContent = bm.star_rating.toFixed(2)
    bmLength.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`

    currentBeatmapsetId = bm.beatmapset_id
    currentBeatmapId = bm.beatmap_id

    // rich presence
    electron.sendData({
        largeImageKey: bmImg,
        largeImageText: `${bm.title} [${bm.difficulty_name}]`,
        buttons: [
            {
                label: 'View Beatmap',
                url: url
            },
            {
                label: 'Play RMC',
                url: 'https://github.com/michaelcalb/osu-rmc'
            }
        ]
    })
}

function validateImage(url, fallback = './assets/default-bg.jpg') {
    return new Promise((resolve) => {
        const img = new Image()
        img.src = url

        img.onload = () => resolve(url)
        img.onerror = () => resolve(fallback)
    })
}

async function fetchBeatmap() {
    changeTimer('cdTimer')

    rollingBm.classList.replace('invisible', 'visible')
    
    try {
        const response = await axios.get('/get-beatmap')
        const bm = response.data
        const url = `https://osu.ppy.sh/beatmapsets/${bm.beatmapset_id}#osu/${bm.beatmap_id}`

        loadBeatmap(bm)

        localStorage.setItem('beatmap', JSON.stringify(bm))

        pushBeatmapToList({url: url, bg: bm.background_image, title: bm.title})

        rollingBm.classList.replace('visible', 'invisible')
        console.log('Beatmap received.')
    } catch (error) {
        console.error('Error fetching beatmap: ', error)
    }

    bmFetched = true
}

function pushBeatmapToList(beatmap) {
    const item = JSON.parse(localStorage.getItem('beatmapList')) || []

    item.push(beatmap)
    localStorage.setItem('beatmapList', JSON.stringify(item))
}

function updateDisplay(key, timer) {
    const el = timer.element
    const secs = localStorage.getItem(key)
    
    const min = Math.floor(secs / 60)
    const sec = secs % 60
    el.textContent = `${min}:${sec.toString().padStart(2, '0')}`
}

function changeTimer(timerKey) {
    const timerSecs = localStorage.getItem(timerKey)
    if (timerSecs > 0) {
        localStorage.setItem(timerKey, timerSecs - 1)
        updateDisplay(timerKey, timers[timerKey])
    }

    localStorage.setItem('timestamp', Math.floor(Date.now() / 1000))
    reduceTimer(timers[timerKey].element, timerKey, localStorage.getItem(timerKey))

    let state
    if (timerKey === 'restTimer') {
        state = 'Resting...'
    } else {
        state = 'Selecting map...'
    }

    electron.sendData({
        state: state
    })
}

function reduceTimer(timerEl, timerKey, timerSecs) {
    if (timerEl === mainTimer) {
        localStorage.setItem('cdTimer', timers.cdTimer.secs)
        updateDisplay('cdTimer', timers.cdTimer)
        cdTimer.classList.remove('timer-end')
    }

    if (currentTimerInterval !== null) {
        clearInterval(currentTimerInterval)
        currentTimerInterval = null
    }

    for(let timer of Object.values(timers)) {
        timer.element.classList.remove("timer-active")
    }

    timerEl.classList.add("timer-active")

    timerKey === 'restTimer' && localStorage.getItem('activeTimer') !== 'restTimer' && localStorage.setItem('lastTimer', localStorage.getItem('activeTimer'))
    localStorage.setItem('activeTimer', timerKey)

    updateDisplay(timerKey, timers[timerKey])

    currentTimerInterval = setInterval(() => {
        localStorage.setItem('timestamp', Math.floor(Date.now() / 1000))

        if (timerSecs <= 0) {
            clearInterval(currentTimerInterval)
            currentTimerInterval = null

            if (timerKey === 'restTimer') {
                restTimerButton.disabled = true
                pauseIcon.style.display = 'none'
                playIcon.style.display = 'block'
            }

            timerEl.classList.replace("timer-active", "timer-end")

            if (timerEl !== mainTimer) {
                changeTimer('mainTimer')
            } else {
                gameOver = true
                skipButton.disabled = true
                restTimerButton.disabled = true
                if (!results && !played) {
                    resultsScreen()
                }
            }
        } else {
            timerSecs--
            localStorage.setItem(timerKey, timerSecs)
            updateDisplay(timerKey, timers[timerKey])
        }
    }, 1000)
}

function beatmapAlert(msg) {
    warningText.textContent = msg
    bmAlert.classList.replace("invisible", "visible")
}

function updateScore(key) {
    const score = scores[key]
    score['count']++
    score['countEl'].textContent = score['count']
    score['element'].classList.add('score-animation')
    score['element'].classList.remove('score-change')

    localStorage.setItem(key, score['count'])
}

function resultsScreen() {
    localStorage.setItem('resultsScreen', true)
    currentTimerInterval ? clearInterval(currentTimerInterval) : null
    results = true
    const finalTime = localStorage.getItem('mainTimer') || 0
    const finalFcs = localStorage.getItem('fcs') || 0
    const finalSkips = localStorage.getItem('skips') || 0
    const finalPauses = localStorage.getItem('pauses') || 0
    const finalSs = localStorage.getItem('ss') || 0
    const finalAcc = localStorage.getItem('acc') || 0
    const finalMisses = localStorage.getItem('misses') || 0
    const finalBreaks = localStorage.getItem('breaks') || 0
    const mapList = JSON.parse(localStorage.getItem('beatmapList')) || []
    
    const rsTime = document.getElementById('rs-time')
    const rsFcs = document.getElementById('rs-fcs')
    const rsSkips = document.getElementById('rs-skips')
    const rsPauses = document.getElementById('rs-pauses')
    const rsSs = document.getElementById('rs-ss')
    const rsAcc = document.getElementById('rs-acc')
    const rsMisses = document.getElementById('rs-misses')
    const rsBreaks = document.getElementById('rs-breaks')

    const stats = {
        time: {
            value: finalTime,
            el: rsTime,
            perf: 0
        },
        fcs: {
            value: finalFcs,
            el: rsFcs,
            perf: -1
        },
        skips: {
            value: finalSkips,
            el: rsSkips,
            perf: 0
        },
        pauses: {
            value: finalPauses,
            el: rsPauses,
            perf: 0
        },
        ss: {
            value: finalSs,
            el: rsSs,
        },
        acc: {
            value: finalAcc,
            el: rsAcc,
            perf: 100.00
        },
        misses: {
            value: finalMisses,
            el: rsMisses,
            perf: 0
        },
        breaks: {
            value: finalBreaks,
            el: rsBreaks,
            perf: 0
        }
    }

    stats.ss.perf = stats.fcs.value
    let perfCounter = 0
    
    for (const key in stats) {
        stats[key].el.textContent = stats[key].value

        if (stats[key].value == stats[key].perf) {
            stats[key].el.parentElement.classList.add('perf-stat')
            perfCounter++
        }
    }

    const elapsedTime = timers.mainTimer.secs - parseInt(stats.time.value)
    const elapsedMin = Math.floor(elapsedTime / 60)
    const elapsedSec = elapsedTime % 60
    stats.time.el.textContent = `${elapsedMin}:${elapsedSec.toString().padStart(2, '0')}`

    if (perfCounter === stats.length - 1 && stats.fcs.value >= 20) {
        stats.fcs.el.parentElement.classList.add('perf-stat')
    }

    const mapCounter = document.getElementById('rs-map-counter')
    const mapListContainer = document.getElementById('rs-map-list')

    mapCounter.textContent = `(${mapList.length})`

    mapList.forEach(item => {
        const anchor = document.createElement('a')
        anchor.className = 'rs-map'
        anchor.href = item.url
        anchor.target = '_blank'
    
        const img = document.createElement('img')
        img.src = item.bg
        img.alt = item.title

        const title = document.createElement('p')
        title.className = 'rs-map-title'
        title.textContent = item.title

        anchor.appendChild(img)
        anchor.appendChild(title)

        mapListContainer.appendChild(anchor)
    })

    resultsScreenContainer.classList.replace("invisible", "visible")

    electron.sendData({
        state: 'On results screen...'
    })
}

// ws
const HOST = '127.0.0.1:24050'
const ws = new ReconnectingWebSocket(`ws://${HOST}/ws`)

let cache = {
    '0': -1,
    'sb': -1,
    'rank': 'f',
    'acc': 0
}

let scoreUpdated = false
let accStored = false
let played = false
let skipped = false
let results = false
let bmFetched = false

ws.onopen = () => {
    console.log('ws connected')
    bmAlert.classList.replace('visible', 'invisible')
    rmcButton.disabled = false
}

ws.onclose = event => {
    console.log('ws closed: ', event)
    ws.send(closed)
}

ws.onerror = error => {
    console.error('ws error: ', error)
    beatmapAlert('Tosu is not open')
    rmcButton.disabled = true
}

async function randomBeatmapChallenge() {
    rmcButton.disabled ? null : rmcButton.disabled = true
    restartButton.disabled ? restartButton.disabled = false : null
    localStorage.getItem('restTimer') <= 0 || localStorage.getItem('mainTimer') <= 0 ? restTimerButton.disabled = true : restTimerButton.disabled = false

    electron.sendData({
        details: `FCs: ${localStorage.getItem('fcs')} | Skips: ${localStorage.getItem('skips')}`
    })

    if (!bmFetched) {
        await fetchBeatmap()
    }

    ws.onmessage = event => {
        try {
            const data = JSON.parse(event.data)
            const gameplay = data.gameplay
            bmAlert.classList.replace("visible", "invisible")

            if (data.gameplay.gameMode !== 0) {
                beatmapAlert('Wrong gamemode!')
            }

            if (bmFetched && data.menu.state === 2 && gameplay.name === data.userProfile.name) {
                if (currentBeatmapsetId === data.menu.bm.set) {
                    if (currentBeatmapId === data.menu.bm.id) {
                        restTimerButton.disabled = true
                        pauseIcon.style.display = 'none'
                        playIcon.style.display = 'block'
                        if (localStorage.getItem('activeTimer') !== 'mainTimer') {
                            changeTimer('mainTimer')
                            electron.sendData({
                                state: 'Playing map...'
                            })
                        }

                        if (cache['0'] !== gameplay.hits['0']) {
                            const currentMisses = parseInt(localStorage.getItem('misses')) || 0
                            cache['0'] = gameplay.hits['0']
                            cache['0'] == 0 ? null : localStorage.setItem('misses', currentMisses + 1)
                            
                        }

                        if (cache['sb'] !== gameplay.hits['sliderBreaks']) {
                            const currentBreaks = parseInt(localStorage.getItem('breaks')) || 0
                            cache['sb'] = gameplay.hits['sliderBreaks']
                            cache['sb'] == 0 ? null : localStorage.setItem('breaks', currentBreaks + 1)
                        }

                        if (cache['rank'] !== gameplay.hits.grade['current']) {
                            cache['rank'] = gameplay.hits.grade['current']
                        }

                        if (cache['acc'] !== gameplay.accuracy) {
                            cache['acc'] = gameplay.accuracy
                        }

                        scoreUpdated = false
                        accStored = false
                        played = true
                    } else {
                        beatmapAlert("Wrong difficulty!")
                    }
                } else {
                    beatmapAlert("Wrong beatmapset!")
                }
            } else if (data.menu.state === 7 && !scoreUpdated && played) {
                if (!accStored) {
                    const acc = localStorage.getItem('acc')
                    const replayAcc = cache['acc']

                    if (!acc) {
                        console.log('acc from scratch')
                        localStorage.setItem('acc', replayAcc)
                    } else {
                        console.log('calculating new acc')
                        const newAcc = ((parseFloat(acc) + replayAcc) / 2).toFixed(2)
                        localStorage.setItem('acc', newAcc)
                    }
                    accStored = true
                }

                if (cache['0'] === 0 && cache['sb'] === 0) {
                    skipButton.disabled = true
                    localStorage.removeItem('_skip')
                    updateScore('fcs')
                    scoreUpdated = true
                    bmFetched = false
                    gameOver ? null : randomBeatmapChallenge()

                    if (cache['rank'] === 'X' || cache['rank'] === 'XH') {
                        const currentSs = localStorage.getItem('ss') || 0
                        localStorage.setItem('ss', currentSs + 1)
                    }
                } else if ((cache['0'] > 0 || cache['sb'] > 0) && cache['rank'] === 'A') {
                    if (!skipped) {
                        skipButton.disabled = false
                        localStorage.setItem('_skip', true)
                        skipButton.textContent = 'Skip map'
                        skipped = true
                    }
                }
                played = false
            } else {
                Object.keys(cache).forEach(key => {
                    cache[key] !== -1 ? cache[key] = -1 : null
                })
            }

            if (!played) {
                localStorage.getItem('restTimer') <= 0 || localStorage.getItem('mainTimer') <= 0 ? restTimerButton.disabled = true : restTimerButton.disabled = false
            }

            if (localStorage.getItem('freeSkip') && skipButton.textContent === 'Skip map') {
                skipButton.disabled = false
                skipButton.textContent = 'Skip map (free skip)'
            }

            if (!results && !played && gameOver) {
                resultsScreen()
            }
        } catch (error) {
            console.error('ws error:', error)
        }
    }
}