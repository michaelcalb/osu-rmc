const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const RPC = require('discord-rpc')
const { startServer } = require('./server')
const { loadConfig, saveConfig } = require('./config')

const config = loadConfig()
const PORT = config.port || 3000

let windowConfig = {
  frame: false,
  transparent: true,
  resizable: false,
  icon: path.join(__dirname, 'assets', 'rmc-icon.png'),
  webPreferences: {
    devTools: false, /* change for debugging */
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
}

// rich presence
const clientId = '1364268332592922724'

let rpcClient
let richPresenceEnabled = config.settings.rich_presence
let startTimestamp = Math.floor(Date.now() / 1000)

const defaultActivity = {
  state: 'Idle',
  largeImageKey: 'rmc-bright',
  largeImageText: 'osu!rmc',
  instance: false,
  startTimestamp: startTimestamp
}

let currentActivity = {
  smallImageKey: 'rmc-bright',
  smallImageText: 'osu!std',
  instance: false,
  startTimestamp: startTimestamp
}

function initializeRichPresence() {
  if (rpcClient || !richPresenceEnabled) {
    return
  }

  rpcClient = new RPC.Client({ transport: 'ipc' })

  let activity
  if (currentActivity.largeImageKey) {
    activity = currentActivity
  } else {
    activity = defaultActivity
  }

  rpcClient.on('ready', () => {
    rpcClient.setActivity({
      ...activity
    })
  })

  rpcClient.login({ clientId }).catch(console.error)
}

function shutdownRichPresence() {
  if (rpcClient) {
    rpcClient.clearActivity().catch((error) => {
      console.warn('Error clearing rpc:', error)
    })
    rpcClient.destroy().catch((error) => {
      console.warn('Error destroying rpc', error)
    })
    rpcClient = null
  }
}

ipcMain.on('update-rich-presence', (event, data) => {
  currentActivity = {
    ...currentActivity,
    ...data
  }

  if (!richPresenceEnabled) {
    return
  }

  rpcClient.setActivity(currentActivity)
})

ipcMain.on('reset-rich-presence', (event) => {
  if (!richPresenceEnabled) {
    return
  }

  rpcClient.setActivity(defaultActivity)
})

ipcMain.on('toggle-rich-presence', (event, bool) => {
  const currentConfig = loadConfig()
  saveConfig({
    settings: {
      ...currentConfig.settings,
      rich_presence: bool
    }
  })

  richPresenceEnabled = bool
  if (bool) {
    initializeRichPresence()
  } else {
    shutdownRichPresence()
  }
})

// windows
let mainWindow
let settingsWindow

function createWindow(width, height, url) {
  const window = new BrowserWindow({
    width: width,
    height: height,
    ...windowConfig
  })

  window.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['x-electron-client'] = 'yes'
    callback({ requestHeaders: details.requestHeaders })
  })

  window.loadURL(url)

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return window
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.whenReady().then(() => {
  initializeRichPresence()
  startServer()
  mainWindow = createWindow(300, 500, `http://localhost:${PORT}`)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow(300, 500, `http://localhost:${PORT}`)
    }
  })
})

// preloads
ipcMain.on('open-settings', (event) => {
  if (!settingsWindow) {
    settingsWindow = createWindow(500, 400, `http://localhost:${PORT}/settings.html`)
    settingsWindow.on('closed', () => {
      settingsWindow = null
    })
  } else {
    settingsWindow.focus()
  }
})

ipcMain.on('close-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) {
    window.close()
  }
})

ipcMain.handle('get-config', async (event) => {
  try {
    const config = loadConfig()
    return config
  } catch(error) {
    console.error('Failed to load config:', error)
    return {}
  }
})

ipcMain.on('change-config', (event, configName, configValue) => {
  let configChanges = {
    [configName]: configValue
  }
  saveConfig(configChanges)
})