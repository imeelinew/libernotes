import { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { uIOhook, UiohookKey } from 'uiohook-napi';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isVisible = false;

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.setVisibleOnAllWorkspaces(true);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const toggleNotes = () => {
  if (!mainWindow) return;

  if (isVisible) {
    mainWindow.webContents.send('hide-notes');
    setTimeout(() => {
      mainWindow?.hide();
      isVisible = false;
    }, 600);
  } else {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('show-notes');
    isVisible = true;
  }
};

// Double-tap Ctrl detection
let lastCtrlTapTime = 0;
let ctrlDown = false;
let otherKeyPressed = false;
const DOUBLE_TAP_INTERVAL = 400; // ms

const setupDoubleTapCtrl = () => {
  uIOhook.on('keydown', (e) => {
    if (e.keycode === UiohookKey.Ctrl || e.keycode === UiohookKey.CtrlRight) {
      ctrlDown = true;
      otherKeyPressed = false;
    } else if (ctrlDown) {
      // Another key pressed while Ctrl held → not a bare Ctrl tap (e.g. Ctrl+C)
      otherKeyPressed = true;
    }
  });

  uIOhook.on('keyup', (e) => {
    if (e.keycode === UiohookKey.Ctrl || e.keycode === UiohookKey.CtrlRight) {
      if (!otherKeyPressed) {
        const now = Date.now();
        if (now - lastCtrlTapTime < DOUBLE_TAP_INTERVAL) {
          toggleNotes();
          lastCtrlTapTime = 0; // prevent triple-tap
        } else {
          lastCtrlTapTime = now;
        }
      }
      ctrlDown = false;
      otherKeyPressed = false;
    }
  });

  uIOhook.start();
};

const createTray = () => {
  const iconPath = path.join(__dirname, 'icon.ico');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏便签',
      click: toggleNotes,
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('LiberNotes');
  tray.setContextMenu(contextMenu);
  tray.on('click', toggleNotes);
};

app.whenReady().then(() => {
  createWindow();
  createTray();
  setupDoubleTapCtrl();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep app running in background
});

app.on('before-quit', () => {
  uIOhook.stop();
});

// IPC handlers
ipcMain.handle('get-screen-size', () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { width, height };
});

ipcMain.on('set-ignore-mouse', (_event, ignore: boolean) => {
  if (!mainWindow) return;
  if (ignore) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    mainWindow.setIgnoreMouseEvents(false);
  }
});

ipcMain.on('hide-window', () => {
  if (!mainWindow || !isVisible) return;
  mainWindow.webContents.send('hide-notes');
  setTimeout(() => {
    mainWindow?.hide();
    isVisible = false;
  }, 600);
});
