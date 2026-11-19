const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('penguin', {
  platform: process.platform,
  onNewTab: (callback) => {
    if (typeof callback !== 'function') return;
    ipcRenderer.on('penguin:new-tab', (_event, url) => callback(url));
  },
  onDownload: (callback) => {
    if (typeof callback !== 'function') return;
    ipcRenderer.on('penguin:download', (_event, info) => callback(info));
  }
});
