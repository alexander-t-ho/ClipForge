// Check if we're running in Electron
export const isElectron = () => {
  // Check multiple ways to detect Electron
  return !!(
    (window && window.process && window.process.type) ||
    (window && window.electronAPI) ||
    (window && window.navigator && window.navigator.userAgent && window.navigator.userAgent.includes('Electron')) ||
    (typeof process !== 'undefined' && process.versions && process.versions.electron)
  );
};

// Electron API wrapper
export const electronAPI = {
  // File operations
  openFileDialog: () => {
    if (isElectron() && window.electronAPI) {
      return window.electronAPI.openFileDialog();
    }
    return Promise.reject('Not running in Electron');
  },

  getVideoInfo: (path) => {
    if (isElectron() && window.electronAPI) {
      return window.electronAPI.getVideoInfo(path);
    }
    return Promise.reject('Not running in Electron');
  },

  // Screen recording
  getScreenSources: () => {
    if (isElectron() && window.electronAPI) {
      return window.electronAPI.getScreenSources();
    }
    return Promise.reject('Not running in Electron');
  },

  startScreenRecording: (sourceId) => {
    if (isElectron() && window.electronAPI) {
      return window.electronAPI.startScreenRecording(sourceId);
    }
    return Promise.reject('Not running in Electron');
  },

  // FFmpeg operations
  extractThumbnail: (opts) => {
    if (isElectron() && window.ffmpeg) {
      return window.ffmpeg.extractThumbnail(opts);
    }
    return Promise.reject('Not running in Electron');
  },

  getMetadata: (path) => {
    if (isElectron() && window.ffmpeg) {
      return window.ffmpeg.getMetadata(path);
    }
    return Promise.reject('Not running in Electron');
  },

  trimVideo: (opts) => {
    if (isElectron() && window.ffmpeg) {
      return window.ffmpeg.trimVideo(opts);
    }
    return Promise.reject('Not running in Electron');
  },

  exportTimeline: (opts) => {
    if (isElectron() && window.ffmpeg) {
      return window.ffmpeg.exportTimeline(opts);
    }
    return Promise.reject('Not running in Electron');
  },

  // Progress listeners
  onTrimProgress: (callback) => {
    if (isElectron() && window.ffmpeg) {
      window.ffmpeg.onTrimProgress(callback);
    }
  },

  onExportProgress: (callback) => {
    if (isElectron() && window.ffmpeg) {
      window.ffmpeg.onExportProgress(callback);
    }
  },

  removeTrimProgressListener: () => {
    if (isElectron() && window.ffmpeg) {
      window.ffmpeg.removeTrimProgressListener();
    }
  },

  removeExportProgressListener: () => {
    if (isElectron() && window.ffmpeg) {
      window.ffmpeg.removeExportProgressListener();
    }
  },

  // Project management
  saveProject: (projectData) => {
    if (isElectron() && window.electronAPI) {
      return window.electronAPI.saveProject(projectData);
    }
    return Promise.reject('Not running in Electron');
  },

  loadProject: () => {
    if (isElectron() && window.electronAPI) {
      return window.electronAPI.loadProject();
    }
    return Promise.reject('Not running in Electron');
  }
};