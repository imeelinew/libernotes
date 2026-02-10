import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),
  onShowNotes: (callback: () => void) => {
    ipcRenderer.on('show-notes', callback);
  },
  onHideNotes: (callback: () => void) => {
    ipcRenderer.on('hide-notes', callback);
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
  setIgnoreMouse: (ignore: boolean) => {
    ipcRenderer.send('set-ignore-mouse', ignore);
  },
  hideWindow: () => {
    ipcRenderer.send('hide-window');
  },
});
