import React, { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import { electronAPI, isElectron } from './utils/electronAPI';
import VideoPreview from './components/VideoPreview';

// Simple Video Preview Panel Wrapper
const VideoPreviewPanel = ({ videoFile, timelineClips, currentTimelineTime, onTimeChange, onVideoStateChange }) => {
  // Simple wrapper that uses the new VideoPreview component
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <VideoPreview 
        currentTime={currentTimelineTime}
        isPlaying={false} // Will be controlled by timeline
        clips={timelineClips}
        onTimeUpdate={onTimeChange}
      />
    </div>
  );
};

// Simple Timeline Component
const SimpleTimeline = ({ clips, currentTime, isPlaying, onSeek, onPlayPause }) => {
  const pixelsPerSecond = 50;
  
  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, x / pixelsPerSecond);
    onSeek(time);
  };
  
  return (
    <div style={{ 
      position: 'relative', 
      height: '200px', 
      background: '#1a1a1a',
      cursor: 'pointer',
      padding: '10px'
    }}>
      {/* Play/Pause Button */}
      <button 
        onClick={onPlayPause}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 100,
          padding: '8px 16px',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      
      {/* Playhead */}
      <div style={{
        position: 'absolute',
        left: currentTime * pixelsPerSecond + 10,
        width: '2px',
        height: '100%',
        background: '#ef4444',
        zIndex: 100
      }} />
      
      {/* Clips */}
      {clips.map(clip => (
        <div
          key={clip.id}
          style={{
            position: 'absolute',
            left: clip.startTime * pixelsPerSecond + 10,
            width: clip.duration * pixelsPerSecond,
            height: '80px',
            background: '#2563eb',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px'
          }}
        >
          {clip.media?.name || clip.name || 'Clip'}
        </div>
      ))}
      
      {/* Timeline Click Area */}
      <div 
        onClick={handleTimelineClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50
        }}
      />
    </div>
  );
};

// Asset Library Panel Component
const AssetLibraryPanel = ({ onVideoImported, importedMedia, onMediaDelete, onMediaReorder, onAddToTimeline, onRecordingComplete, setImportedVideo }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('video/')) {
        handleVideoImport(file);
      }
    });
  };

  const handleVideoImport = async (file) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const mediaItem = {
          id: `media-${Date.now()}`,
          name: file.name,
          file: file,
          duration: duration,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file)
        };
        
        onVideoImported(mediaItem);
        video.remove();
      };
      
      video.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('Error importing video:', error);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('video/')) {
        handleVideoImport(file);
      }
    });
    e.target.value = '';
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Asset Library</h3>
      
      {/* File Import */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragOver ? '2px dashed #ef4444' : '2px dashed #ccc',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '20px',
          background: isDragOver ? '#fef2f2' : '#f9f9f9'
        }}
      >
        <p>Drag and drop video files here</p>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileInput}
          style={{ marginTop: '10px' }}
        />
      </div>

      {/* Media List */}
      <div>
        {importedMedia.map((media, index) => (
          <div
            key={media.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '10px',
              background: '#f9f9f9'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{media.name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {media.duration ? `${media.duration.toFixed(2)}s` : 'Unknown duration'}
              </div>
            </div>
            <button
              onClick={() => onAddToTimeline(media)}
              style={{
                padding: '5px 10px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Add to Timeline
            </button>
            <button
              onClick={() => onMediaDelete(media.id)}
              style={{
                padding: '5px 10px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [importedVideo, setImportedVideo] = useState(null);
  const [importedMedia, setImportedMedia] = useState([]);
  const [timelineClips, setTimelineClips] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [showClipDetails, setShowClipDetails] = useState(false);
  const [currentTimelineTime, setCurrentTimelineTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const animationFrameRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  // Handle adding media to timeline with automatic sequential placement
  const handleAddToTimeline = useCallback((media) => {
    // Calculate the next available start time (end of last clip)
    const lastClipEndTime = timelineClips.length > 0 
      ? Math.max(...timelineClips.map(clip => clip.endTime || (clip.startTime + (clip.duration || 0))))
      : 0;
    
    const newClip = {
      id: `clip-${Date.now()}`,
      media: media,
      startTime: lastClipEndTime,
      duration: media.duration || 5,
      endTime: lastClipEndTime + (media.duration || 5),
      track: 0,
      trimStart: 0,
      trimEnd: media.duration || 5
    };
    
    setTimelineClips(prev => [...prev, newClip]);
    
    // Auto-start playback if this is the first clip
    if (timelineClips.length === 0) {
      setIsVideoPlaying(true);
    }
  }, [timelineClips]);

  // Handle video import
  const handleVideoImported = useCallback((media) => {
    setImportedMedia(prev => [...prev, media]);
  }, []);

  // Handle media deletion
  const handleMediaDelete = useCallback((mediaId) => {
    setImportedMedia(prev => prev.filter(media => media.id !== mediaId));
    setTimelineClips(prev => prev.filter(clip => clip.media?.id !== mediaId));
  }, []);

  // Handle media reordering
  const handleMediaReorder = useCallback((fromIndex, toIndex) => {
    setImportedMedia(prev => {
      const newMedia = [...prev];
      const [removed] = newMedia.splice(fromIndex, 1);
      newMedia.splice(toIndex, 0, removed);
      return newMedia;
    });
  }, []);

  // Handle timeline play/pause
  const handleTimelinePlayPause = useCallback(() => {
    setIsVideoPlaying(prev => !prev);
  }, []);

  // Handle timeline seek
  const handleTimelineSeek = useCallback((newTime) => {
    setCurrentTimelineTime(newTime);
  }, []);

  // Handle time updates from video
  const handleVideoTimeUpdate = useCallback((newTime) => {
    setCurrentTimelineTime(newTime);
  }, []);

  // Timeline playback animation
  useEffect(() => {
    if (isVideoPlaying) {
      lastTickRef.current = Date.now();
      
      const tick = () => {
        const now = Date.now();
        const deltaSeconds = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;
        
        setCurrentTimelineTime(prev => prev + deltaSeconds);
        
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      
      tick();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVideoPlaying]);

  return (
    <div className="App">
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Left Panel - Asset Library */}
        <div style={{ width: '300px', borderRight: '1px solid #ddd' }}>
          <AssetLibraryPanel
            onVideoImported={handleVideoImported}
            importedMedia={importedMedia}
            onMediaDelete={handleMediaDelete}
            onMediaReorder={handleMediaReorder}
            onAddToTimeline={handleAddToTimeline}
            onRecordingComplete={() => {}}
            setImportedVideo={setImportedVideo}
          />
        </div>

        {/* Center Panel - Video Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, background: '#000' }}>
            <VideoPreviewPanel
              videoFile={importedVideo}
              timelineClips={timelineClips}
              currentTimelineTime={currentTimelineTime}
              onTimeChange={handleVideoTimeUpdate}
              onVideoStateChange={() => {}}
            />
          </div>
          
          {/* Timeline */}
          <div style={{ height: '200px', borderTop: '1px solid #ddd' }}>
            <SimpleTimeline
              clips={timelineClips}
              currentTime={currentTimelineTime}
              isPlaying={isVideoPlaying}
              onSeek={handleTimelineSeek}
              onPlayPause={handleTimelinePlayPause}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
