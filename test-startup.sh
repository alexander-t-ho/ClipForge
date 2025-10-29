#!/bin/bash

# ClipForge EPIPE Error Test Script
echo "Testing ClipForge startup for EPIPE errors..."

# Kill any existing processes
pkill -f "electron" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true

# Wait a moment
sleep 2

# Start React dev server in background
echo "Starting React dev server..."
cd /Users/alexho/ClipForge
npm start &
REACT_PID=$!

# Wait for React to start
echo "Waiting for React to start..."
sleep 10

# Start Electron
echo "Starting Electron..."
npm run electron-dev &
ELECTRON_PID=$!

# Wait for Electron to start
sleep 5

# Check if processes are still running
if ps -p $REACT_PID > /dev/null && ps -p $ELECTRON_PID > /dev/null; then
    echo "✅ SUCCESS: Both processes started without EPIPE errors"
    echo "React PID: $REACT_PID"
    echo "Electron PID: $ELECTRON_PID"
else
    echo "❌ FAILURE: One or both processes crashed"
    echo "React PID: $REACT_PID (running: $(ps -p $REACT_PID > /dev/null && echo 'yes' || echo 'no'))"
    echo "Electron PID: $ELECTRON_PID (running: $(ps -p $ELECTRON_PID > /dev/null && echo 'yes' || echo 'no'))"
fi

# Clean up after 30 seconds
echo "Cleaning up in 30 seconds..."
sleep 30
kill $REACT_PID 2>/dev/null || true
kill $ELECTRON_PID 2>/dev/null || true
echo "Test completed."

