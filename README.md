# ClipForge - Desktop Video Editor

A desktop video editor built with Electron and React, designed to be built in 72 hours.

## Project Overview

This project implements a desktop video editor with the following MVP phases:

1. ✅ **Phase 1**: Desktop app that launches (Electron + React)
2. **Phase 2**: Basic video import (drag & drop or file picker)
3. **Phase 3**: Simple timeline view showing imported clips
4. **Phase 4**: Video preview player that plays imported clips
5. **Phase 5**: Basic trim functionality (set in/out points)
6. **Phase 6**: Export to MP4 (single clip)
7. **Phase 7**: Built and packaged as native app

## Tech Stack

- **Desktop Framework**: Electron
- **Frontend**: React
- **Media Processing**: FFmpeg (via fluent-ffmpeg)
- **Styling**: CSS3 with modern design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- FFmpeg installed on your system

### Installation

1. Clone the repository:
```bash
git clone https://github.com/alexander-t-ho/ClipForge.git
cd ClipForge
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run electron-dev
```

### Building for Production

```bash
npm run dist
```

## Development Commands

- `npm start` - Start React development server
- `npm run electron-dev` - Run Electron in development mode
- `npm run build` - Build React app for production
- `npm run dist` - Build and package the desktop app

## Architecture

The app follows a modular architecture:

- `public/electron.js` - Main Electron process
- `src/` - React frontend components
- `src/components/` - Reusable UI components
- `src/utils/` - Utility functions for video processing

## Current Status

**Phase 1 Complete**: Basic Electron + React setup with window management and menu system.

Ready to proceed to Phase 2: Video import functionality.

## License

MIT License
