const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  sendData: (data) => ipcRenderer.send('update-rich-presence', data),
  sendReset: () => ipcRenderer.send('reset-rich-presence'),
  toggleRichPresence: (bool) => ipcRenderer.send('toggle-rich-presence', bool),
  openSettings: () => ipcRenderer.send('open-settings'),
  closeWindow: () => ipcRenderer.send('close-window'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  changeConfig: (configName, configValue) => ipcRenderer.send('change-config', configName, configValue)
})