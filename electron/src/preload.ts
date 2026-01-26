import { contextBridge, ipcRenderer } from 'electron';

require('./rt/electron-rt');

//////////////////////////////
// User Defined Preload scripts below
console.log('User Preload!');

contextBridge.exposeInMainWorld('electronAPI', {
  printToPrinter: (html: string, printerName: string) => ipcRenderer.invoke('print-to-printer', html, printerName),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
});
