const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  setArchivePath: () => ipcRenderer.invoke('set-archive-path'),
  ensureArchiveStructure: (archivePath) => ipcRenderer.invoke('ensure-archive-structure', archivePath),
  savePrompt: (promptData) => ipcRenderer.invoke('save-prompt', promptData),
  loadPrompts: (archivePath) => ipcRenderer.invoke('load-prompts', archivePath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  getFileUrl: (filePath) => ipcRenderer.invoke('get-file-url', filePath),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  exportPrompts: (data) => ipcRenderer.invoke('export-prompts', data),
  selectExportLocation: () => ipcRenderer.invoke('select-export-location'),
  changePromptType: (data) => ipcRenderer.invoke('change-prompt-type', data),
  updatePrompt: (data) => ipcRenderer.invoke('update-prompt', data)
});