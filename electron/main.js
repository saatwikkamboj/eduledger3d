const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { registerIpcHandlers } = require('./ipcHandlers');

const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;

// --- DIAGNOSTIC MODE -------------------------------------------------------
// While we're tracking down the "blank window" issue, force DevTools open
// and write a crash log next to the app so failures are never silent.
// Once everything works, you can flip this back to `false`.
const DIAGNOSTIC_MODE = true;

function logToFile(label, details) {
  try {
    const logPath = path.join(app.getPath('userData'), 'eduledger-crash.log');
    const line = `\n[${new Date().toISOString()}] ${label}\n${details}\n`;
    fs.appendFileSync(logPath, line);
  } catch (e) {
    // last resort: nothing more we can do if even logging fails
  }
}

process.on('uncaughtException', (err) => {
  const details = err && err.stack ? err.stack : String(err);
  logToFile('uncaughtException (main process)', details);
  dialog.showErrorBox('EduLedger 3D — Startup Error', details);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#05060a',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // If the page fails to load at all (bad path, missing file, etc.), tell us.
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    const details = `Failed to load: ${validatedURL}\nCode: ${errorCode}\nReason: ${errorDescription}`;
    logToFile('did-fail-load', details);
    dialog.showErrorBox('EduLedger 3D — Failed to Load', details);
  });

  // If the renderer process itself crashes (out of memory, native crash, etc.)
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logToFile('render-process-gone', JSON.stringify(details, null, 2));
    dialog.showErrorBox('EduLedger 3D — Renderer Crashed', JSON.stringify(details, null, 2));
  });

  // Surface any JS error thrown inside the page (this is the #1 way to catch
  // a React app that silently fails to mount).
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) { // 2 = warning, 3 = error in Electron's numbering
      logToFile('renderer console', `[level ${level}] ${message}\n  at ${sourceId}:${line}`);
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  if (isDev || DIAGNOSTIC_MODE) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Open any target=_blank / external links in the OS browser, not inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  try {
    registerIpcHandlers();
  } catch (err) {
    logToFile('registerIpcHandlers failed', err.stack || String(err));
    dialog.showErrorBox('EduLedger 3D — Database/IPC Setup Failed', err.stack || String(err));
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  db.closeAll();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  db.closeAll();
});
