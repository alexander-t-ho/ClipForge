import React, { useState, useRef, useCallback, useEffect } from 'react';
import { electronAPI, isElectron } from '../utils/electronAPI';

const ScreenRecorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [screenSources, setScreenSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Load available screen sources
  const loadScreenSources = useCallback(async () => {
    if (isElectron()) {
      const sources = await electronAPI.getScreenSources();
      setScreenSources(sources);
    }
  }, []);

  useEffect(() => {
    loadScreenSources();
  }, [loadScreenSources]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!selectedSource) {
      setShowSourceSelector(true);
      return;
    }

    try {
      // Request screen capture
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: selectedSource.id
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: selectedSource.id,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080
          }
        }
      });

      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        const recordingFile = {
          name: `Screen Recording ${new Date().toLocaleString()}.webm`,
          size: blob.size,
          type: 'video/webm',
          url: url,
          blob: blob,
          isRecording: true
        };

        onRecordingComplete(recordingFile);
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        URL.revokeObjectURL(url);
      };

      // Start recording
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording: ' + error.message);
    }
  }, [selectedSource, onRecordingComplete]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setRecordingTime(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="screen-recorder">
      <div className="recorder-header">
        <h3>🎥 Screen Recording</h3>
        {isRecording && (
          <div className="recording-indicator">
            <div className="recording-dot"></div>
            <span>REC {formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      <div className="recorder-controls">
        {!isRecording ? (
          <>
            <button 
              className="record-btn"
              onClick={startRecording}
            >
              🔴 Start Recording
            </button>
            <button 
              className="source-btn"
              onClick={() => setShowSourceSelector(!showSourceSelector)}
            >
              📺 Select Source
            </button>
          </>
        ) : (
          <button 
            className="stop-btn"
            onClick={stopRecording}
          >
            ⏹️ Stop Recording
          </button>
        )}
      </div>

      {showSourceSelector && (
        <div className="source-selector">
          <h4>Select Recording Source:</h4>
          <div className="sources-grid">
            {screenSources.map((source) => (
              <div 
                key={source.id}
                className={`source-item ${selectedSource?.id === source.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedSource(source);
                  setShowSourceSelector(false);
                }}
              >
                <img 
                  src={source.thumbnail} 
                  alt={source.name}
                  className="source-thumbnail"
                />
                <div className="source-info">
                  <div className="source-name">{source.name}</div>
                  <div className="source-type">{source.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedSource && (
        <div className="selected-source">
          <span>Selected: {selectedSource.name}</span>
        </div>
      )}
    </div>
  );
};

export default ScreenRecorder;
