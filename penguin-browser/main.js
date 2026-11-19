const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 850,
    minHeight: 600,
    backgroundColor: '#111522',
    title: 'Penguin Browser',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true
    }
  });

  // Treat pop-ups opened by websites as new tabs inside Penguin Browser.
  win.webContents.on('did-attach-webview', (_event, guestContents) => {
    guestContents.setWindowOpenHandler(({ url }) => {
      win.webContents.send('penguin:new-tab', url);
      return { action: 'deny' };
    });
  });

  // Do not allow the application shell itself to be navigated away from.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      win.webContents.send('penguin:new-tab', url);
    }
    return { action: 'deny' };
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Save downloads to the operating system's normal Downloads folder.
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-download', (_downloadEvent, item) => {
    const filename = item.getFilename();
    item.setSavePath(path.join(app.getPath('downloads'), filename));
    const ownerWindow = contents.getOwnerBrowserWindow();
    const sendUpdate = (state) => {
      if (ownerWindow && !ownerWindow.isDestroyed()) {
        ownerWindow.webContents.send('penguin:download', {
          filename,
          state,
          received: item.getReceivedBytes(),
          total: item.getTotalBytes()
        });
      }
    };
    sendUpdate('started');
    item.on('updated', (_event, state) => sendUpdate(state === 'interrupted' ? 'interrupted' : 'downloading'));
    item.once('done', (_event, state) => sendUpdate(state));
  });
});

// This app does not need to open arbitrary URLs in the host process.
// The browser's webview handles normal web navigation.
