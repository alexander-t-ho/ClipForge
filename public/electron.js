const { app, BrowserWindow, Menu, dialog, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);
const isDev = process.env.ELECTRON_IS_DEV === '1';

let mainWindow;
let controllerWindow = null;
let consoleDisabled = false;

// Safe console logging function to prevent EPIPE errors
function safeLog(...args) {
  if (consoleDisabled) return;
  
  try {
    console.log(...args);
  } catch (error) {
    // If EPIPE error occurs, disable console logging to prevent further errors
    if (error.code === 'EPIPE') {
      consoleDisabled = true;
      return;
    }
    // For other errors, try to log them once more
    try {
      console.error('Console error:', error);
    } catch (e) {
      // If even console.error fails, disable console logging
      consoleDisabled = true;
    }
  }
}

// Safe error logging function
function safeError(...args) {
  if (consoleDisabled) return;
  
  try {
    console.error(...args);
  } catch (error) {
    if (error.code === 'EPIPE') {
      consoleDisabled = true;
    }
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  safeLog('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl).catch(err => {
    safeError('Failed to load URL:', err);
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    safeLog('Window ready to show');
    mainWindow.show();
  });

  // Handle page load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    safeError('Failed to load page:', errorCode, errorDescription, validatedURL);
  });

  // Handle console messages from renderer (DISABLED to prevent EPIPE errors)
  // mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
  //   if (!consoleDisabled) {
  //     safeLog(`Renderer console [${level}]:`, message);
  //   }
  // });

  // Open DevTools in development (disabled if console has EPIPE issues)
  if (isDev && !consoleDisabled) {
    try {
      mainWindow.webContents.openDevTools();
    } catch (error) {
      if (error.code === 'EPIPE') {
        consoleDisabled = true;
      }
    }
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createControllerWindow() {
  if (controllerWindow) {
    controllerWindow.focus();
    return;
  }

  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  controllerWindow = new BrowserWindow({
    width: 600,
    height: 80,
    x: Math.floor(screenWidth / 2 - 300),
    y: 20,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  controllerWindow.loadFile(path.join(__dirname, 'controller.html'));

  controllerWindow.on('closed', () => {
    controllerWindow = null;
  });

  // Prevent window from being closed by user
  controllerWindow.on('close', (event) => {
    event.preventDefault();
    controllerWindow.hide();
  });
}

// Handle uncaught exceptions to prevent EPIPE crashes
process.on('uncaughtException', (error) => {
  if (error.code === 'EPIPE') {
    consoleDisabled = true;
    return; // Silently ignore EPIPE errors
  }
  // For other errors, try to log them if console is still available
  if (!consoleDisabled) {
    try {
      console.error('Uncaught Exception:', error);
    } catch (e) {
      consoleDisabled = true;
    }
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  if (reason && reason.code === 'EPIPE') {
    consoleDisabled = true;
    return;
  }
  if (!consoleDisabled) {
    try {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    } catch (e) {
      consoleDisabled = true;
    }
  }
});

// Additional protection: Override console methods to prevent EPIPE
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args) => {
  if (consoleDisabled) return;
  try {
    originalConsoleLog.apply(console, args);
  } catch (error) {
    if (error.code === 'EPIPE') {
      consoleDisabled = true;
    }
  }
};

console.error = (...args) => {
  if (consoleDisabled) return;
  try {
    originalConsoleError.apply(console, args);
  } catch (error) {
    if (error.code === 'EPIPE') {
      consoleDisabled = true;
    }
  }
};

console.warn = (...args) => {
  if (consoleDisabled) return;
  try {
    originalConsoleWarn.apply(console, args);
  } catch (error) {
    if (error.code === 'EPIPE') {
      consoleDisabled = true;
    }
  }
};

// Test console availability on startup
try {
  console.log('ClipForge starting...');
} catch (error) {
  if (error.code === 'EPIPE') {
    consoleDisabled = true;
    console.log = () => {}; // No-op function
    console.error = () => {}; // No-op function
    console.warn = () => {}; // No-op function
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Set up menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Project',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          // TODO: Implement new project
        }
      },
      {
        label: 'Open Project',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          // TODO: Implement open project
        }
      },
      { type: 'separator' },
      {
        label: 'Export Video',
        accelerator: 'CmdOrCtrl+E',
        click: () => {
          // TODO: Implement export
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// IPC handlers for file operations
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mov', 'webm', 'avi', 'mkv'] },
      { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths.map(filePath => {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      let type = 'video';
      
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
        type = 'image';
      }
      
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        type: type
      };
    });
  }
  
  return [];
});

  ipcMain.handle('get-video-info', async (filePath) => {
    try {
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        exists: true
      };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  });

  // Screen recording handlers
  ipcMain.handle('get-screen-sources', async () => {
    try {
      safeLog('Main process: Getting screen sources...');
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 150, height: 150 }
      });
      
      safeLog('Main process: Found', sources.length, 'screen sources');
      const mappedSources = sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
        type: source.id.startsWith('screen:') ? 'screen' : 'window'
      }));
      
      safeLog('Main process: Mapped sources:', mappedSources);
      return mappedSources;
    } catch (error) {
      console.error('Main process: Error getting screen sources:', error);
      return [];
    }
  });

  ipcMain.handle('start-screen-recording', async (event, sourceId) => {
    try {
      // This will be handled by the renderer process using getUserMedia
      return { success: true, sourceId };
    } catch (error) {
      console.error('Error starting screen recording:', error);
      return { success: false, error: error.message };
    }
  });

  // FFmpeg handlers
  ipcMain.handle('extract-thumbnail', async (event, { videoPath, timestamp = 1 }) => {
    try {
      const output = path.join(app.getPath('temp'), `thumb_${Date.now()}.jpg`);
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({ 
            timestamps: [timestamp], 
            filename: path.basename(output), 
            folder: path.dirname(output), 
            size: '320x180' 
          })
          .on('end', () => {
            try {
              const base64 = fs.readFileSync(output, 'base64');
              fs.unlinkSync(output);
              resolve(`data:image/jpeg;base64,${base64}`);
            } catch (err) {
              reject(err);
            }
          })
          .on('error', reject);
      });
    } catch (error) {
      console.error('Error extracting thumbnail:', error);
      throw error;
    }
  });

  ipcMain.handle('get-metadata', async (event, videoPath) => {
    try {
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, data) => {
          if (err) return reject(err);
          
          const video = data.streams.find(s => s.codec_type === 'video');
          const audio = data.streams.find(s => s.codec_type === 'audio');
          
          resolve({
            duration: data.format.duration,
            size: data.format.size,
            width: video?.width,
            height: video?.height,
            fps: video?.r_frame_rate ? eval(video.r_frame_rate) : null,
            bitrate: data.format.bit_rate,
            codec: video?.codec_name,
            audioCodec: audio?.codec_name,
            audioChannels: audio?.channels,
            audioSampleRate: audio?.sample_rate
          });
        });
      });
    } catch (error) {
      console.error('Error getting metadata:', error);
      throw error;
    }
  });

  ipcMain.handle('trim-video', async (event, { inputPath, outputPath, startTime, duration }) => {
    try {
      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .setStartTime(startTime)
          .setDuration(duration)
          .videoCodec('copy')
          .audioCodec('copy')
          .output(outputPath)
          .on('end', () => resolve(outputPath))
          .on('progress', (p) => {
            if (event.sender && !event.sender.isDestroyed()) {
              event.sender.send('trim-progress', p.percent);
            }
          })
          .on('error', reject)
          .run();
      });
    } catch (error) {
      console.error('Error trimming video:', error);
      throw error;
    }
  });

  ipcMain.handle('export-timeline', async (event, { clips, outputPath, resolution = '1920x1080' }) => {
    try {
      const concatFile = path.join(app.getPath('temp'), `concat_${Date.now()}.txt`);
      
      // Create concat file with proper file paths
      const concatContent = clips.map(clip => {
        const filePath = clip.media?.path || clip.path;
        return `file '${filePath.replace(/\\/g, '/')}'`;
      }).join('\n');
      
      fs.writeFileSync(concatFile, concatContent);
      
      return new Promise((resolve, reject) => {
        ffmpeg()
          .input(concatFile)
          .inputOptions(['-f concat', '-safe 0'])
          .outputOptions([
            '-c:v libx264', 
            '-preset fast', 
            '-crf 23', 
            `-s ${resolution}`, 
            '-c:a aac',
            '-movflags +faststart'
          ])
          .output(outputPath)
          .on('end', () => { 
            try {
              fs.unlinkSync(concatFile); 
              resolve(outputPath); 
            } catch (err) {
              console.warn('Could not delete concat file:', err);
              resolve(outputPath);
            }
          })
          .on('progress', (p) => {
            if (event.sender && !event.sender.isDestroyed()) {
              event.sender.send('export-progress', p.percent);
            }
          })
          .on('error', (e) => { 
            try {
              fs.unlinkSync(concatFile); 
            } catch (err) {
              console.warn('Could not delete concat file:', err);
            }
            reject(e); 
          })
          .run();
      });
    } catch (error) {
      console.error('Error exporting timeline:', error);
      throw error;
    }
  });

  // Project save/load handlers
  ipcMain.handle('save-project', async (event, projectData) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save ClipForge Project',
        defaultPath: `${projectData.name}.clipforge`,
        filters: [
          { name: 'ClipForge Projects', extensions: ['clipforge'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, JSON.stringify(projectData, null, 2));
        return { success: true, path: result.filePath };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  });

  ipcMain.handle('load-project', async (event) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Load ClipForge Project',
        filters: [
          { name: 'ClipForge Projects', extensions: ['clipforge'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return { success: true, data: projectData, path: filePath };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error loading project:', error);
      throw error;
    }
  });

  // Handle controller window operations
  ipcMain.handle('show-controller', () => {
    createControllerWindow();
    if (controllerWindow) {
      controllerWindow.show();
      controllerWindow.focus();
    }
  });

  ipcMain.handle('hide-controller', () => {
    if (controllerWindow) {
      controllerWindow.hide();
    }
  });

  ipcMain.handle('close-controller', () => {
    if (controllerWindow) {
      controllerWindow.close();
      controllerWindow = null;
    }
  });

  // Handle controller commands
  ipcMain.handle('controller-command', (event, command) => {
    if (mainWindow) {
      mainWindow.webContents.send('controller-command', command);
    }
  });
