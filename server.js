const express = require('express')
const axios = require('axios')
const path = require('path')
const { loadConfig, saveConfig } = require('./config')

const app = express()

app.use((req, res, next) => {
    const isFromElectron = req.headers['x-electron-client'] === 'yes'
  
    if (!isFromElectron) {
      return res.status(403).send('Please launch RMC using the app.')
    }
  
    next()
})

let config = loadConfig()
let { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, port: PORT } = config

let accessToken = null
let tokenExpiry = 0

app.use(express.static(path.join(__dirname)))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.post('/setup', async (req, res) => {
    const { client_id, client_secret } = req.body

    try {
        await axios.post('https://osu.ppy.sh/oauth/token', {
            client_id: client_id,
            client_secret: client_secret,
            grant_type: 'client_credentials',
            scope: 'public'
        })
        
    } catch (error) {
        return res.status(401).send('Invalid client credentials')
    }

    config.client_id = client_id
    config.client_secret = client_secret

    saveConfig(config)    

    CLIENT_ID = client_id
    CLIENT_SECRET = client_secret

    console.log('Config saved.')
    res.send('Config saved.')
})

async function getAccessToken() {
    const now = Math.floor(Date.now() / 1000)

    if (accessToken && now < tokenExpiry) {
        return accessToken
    }

    try {
        const response = await axios.post('https://osu.ppy.sh/oauth/token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: 'public'
        })

        accessToken = response.data.access_token
        tokenExpiry = now + response.data.expires_in - 60

        console.log('New access token fetched!')
        return accessToken
    } catch (error) {
        console.error('Failed to get access token:', error)
        throw error
    }
}

async function randomBeatmapsetSearch(accessToken, gamemode, bmStatus) {
    // The osu api (v2) doesnt have a built-in way to get a random beatmapset, therefore I came up with this method. If you want to know exactly how it works you can check the README on github or you can just read the code below if you have a basic js knowledge. (Yes, this is not perfect and there is probably a better way to do this, but I honestly couldn't figure it out. Any feedback is always appreciated :D )
    let randomGenre = Math.floor(Math.random() * 13) + 2
    while (randomGenre == 8) {
        randomGenre = Math.floor(Math.random() * 13) + 2
    }
    const randomSort = Math.random() < 0.5 ? 'ranked_desc' : 'ranked_asc'

    let lastPage = 200
    let acc = lastPage
    let foundLastPage = false

    while (!foundLastPage) {
        acc = Math.round(acc /= 2)

        try {
            const response = await axios.get('https://osu.ppy.sh/api/v2/beatmapsets/search', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    g: randomGenre,
                    m: gamemode,
                    s: bmStatus,
                    sort: randomSort,
                    page: lastPage
                }
            })

            const bmLength = response.data.beatmapsets.length

            /* console.log(`O--------------------O\n| Page: ${lastPage} (~${acc})\n| Genre: ${randomGenre}\n| BmSets: ${bmLength}\n| Status: ${response.status}\nO--------------------O\n`) */

            if (acc <= 1 || (bmLength > 0 && bmLength < 50)) {
                if (bmLength === 0) {
                    lastPage--
                }

                foundLastPage = true
                /* console.log(`FOUND LAST PAGE: ${lastPage}\n`) */
            }

            if (bmLength === 0) {
                lastPage -= acc
            } else if (bmLength === 50) {
                lastPage += acc
            }
            
        } catch (error) {
            console.error('Unexpected error finding last page:', error);
            return { error: error };
        }
    }

    // Fetching random beatmap that exists
    const randomPage = Math.floor(Math.random() * lastPage) + 1

    /* console.log(`Fetching random bm with params:\nGenre: ${randomGenre}\nSort: ${randomSort}\nPage: ${randomPage}\n`) */

    try {
        const response = await axios.get('https://osu.ppy.sh/api/v2/beatmapsets/search', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            params: {
                g: randomGenre,
                m: gamemode,
                s: bmStatus,
                sort: randomSort,
                page: randomPage
            }
        })

        const BeatmapsetsList = response.data.beatmapsets
        if (!BeatmapsetsList || BeatmapsetsList.length === 0) {
            return { error: 'No beatmapsets found' }
        }

        const randomBeatmapSet = BeatmapsetsList[Math.floor(Math.random() * BeatmapsetsList.length)]

        // garb code for now. will be changed to also include the other gamemodes
        const osuBeatmaps = randomBeatmapSet.beatmaps.filter(b => b.mode === 'osu')
        const randomBeatmap = osuBeatmaps[Math.floor(Math.random() * osuBeatmaps.length)]

        return currentBeatmap = {
            title: randomBeatmapSet.title,
            difficulty_name: randomBeatmap.version,
            background_image: randomBeatmapSet.covers.cover,
            star_rating: randomBeatmap.difficulty_rating,
            beatmap_length: randomBeatmap.total_length,
            beatmapset_id: randomBeatmapSet.id,
            beatmap_id: randomBeatmap.id
        }

    } catch (error) {
        console.error('Beatmap search error:', error)
        return { error: error }
    }
}

app.get('/get-beatmap', async (req, res) => {
    try {
        const accessToken = await getAccessToken()
        const beatmap = await randomBeatmapsetSearch(accessToken, 0, 'ranked')
        return res.json(beatmap)
    } catch (error) {
        console.error('Beatmap fetch error:', error)
        return res.status(500).json({
            error: error
        })
    }
})

function startServer() {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`)
    })
}

module.exports = { startServer }