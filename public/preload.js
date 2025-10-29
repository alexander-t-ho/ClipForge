const { contextBridge, ipcRenderer } = require('electron');

// Expose FFmpeg functionality to renderer process
contextBridge.exposeInMainWorld('ffmpeg', {
  // Extract thumbnail from video
  extractThumbnail: (opts) => ipcRenderer.invoke('extract-thumbnail', opts),
  
  // Get video metadata
  getMetadata: (path) => ipcRenderer.invoke('get-metadata', path),
  
  // Trim video
  trimVideo: (opts) => ipcRenderer.invoke('trim-video', opts),
  
  // Export timeline
  exportTimeline: (opts) => ipcRenderer.invoke('export-timeline', opts),
  
  // Progress listeners
  onTrimProgress: (callback) => {
    ipcRenderer.on('trim-progress', (event, data) => callback(data));
  },
  
  onExportProgress: (callback) => {
    ipcRenderer.on('export-progress', (event, data) => callback(data));
  },
  
  // Remove progress listeners
  removeTrimProgressListener: () => {
    ipcRenderer.removeAllListeners('trim-progress');
  },
  
  removeExportProgressListener: () => {
    ipcRenderer.removeAllListeners('export-progress');
  }
});

// Expose existing Electron API
contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  getVideoInfo: (path) => ipcRenderer.invoke('get-video-info', path),
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  startScreenRecording: (sourceId) => ipcRenderer.invoke('start-screen-recording', sourceId),
  saveProject: (projectData) => ipcRenderer.invoke('save-project', projectData),
  loadProject: () => ipcRenderer.invoke('load-project'),
  
  // Controller window functions
  showController: () => ipcRenderer.invoke('show-controller'),
  hideController: () => ipcRenderer.invoke('hide-controller'),
  closeController: () => ipcRenderer.invoke('close-controller'),
  sendControllerCommand: (command) => ipcRenderer.invoke('controller-command', command),
  
  // Listen for controller commands
  onControllerCommand: (callback) => {
    ipcRenderer.on('controller-command', (event, command) => callback(command));
  },
  
  // Remove controller command listener
  removeControllerCommandListener: () => {
    ipcRenderer.removeAllListeners('controller-command');
  }
});
