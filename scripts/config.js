const fs = require('fs')
const path = require('path')
const { app } = require('electron')

const CONFIG_DIR = app.getPath('userData')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

const defaultConfig = {
    "_message0": "IF YOUR client_secret GOT LEAKED PLEASE RESET IT AT https://osu.ppy.sh/home/account/edit#oauth",
    "_message1": "IF YOUR client_secret GOT LEAKED PLEASE RESET IT AT https://osu.ppy.sh/home/account/edit#oauth",
    "_message2": "IF YOUR client_secret GOT LEAKED PLEASE RESET IT AT https://osu.ppy.sh/home/account/edit#oauth",
    "_message3": "IF YOUR client_secret GOT LEAKED PLEASE RESET IT AT https://osu.ppy.sh/home/account/edit#oauth",
    "_message4": "IF YOUR client_secret GOT LEAKED PLEASE RESET IT AT https://osu.ppy.sh/home/account/edit#oauth",
    "client_id": "",
    "client_secret": "",
    "port": 3000,
    "settings": {
        "rich_presence": false
    }
}

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
        } else {
            saveConfig(defaultConfig)
            return defaultConfig
        }
    } catch (error) {
        console.error('Failed to load config:', error)
        return defaultConfig
    }
}

function saveConfig(newConfig) {
    try {
        let currentConfig = defaultConfig
        if (fs.existsSync(CONFIG_FILE)) {
            currentConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
        }

        const updatedConfig = {
            ...currentConfig,
            ...newConfig
        }

        fs.writeFileSync(CONFIG_FILE, JSON.stringify(updatedConfig, null, 4))
    } catch (error) {
        console.error('Failed to save config:', error)
    }
}

module.exports = { loadConfig, saveConfig }