const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 5001;

app.use(cors()); // Enable CORS for all origins

// Globals
let currentData = [];
const dataFilePath = path.join(__dirname, 'data.json');

// Load initial data
function loadInitialData() {
  try {
    const raw = fs.readFileSync(dataFilePath, 'utf8');
    currentData = JSON.parse(raw);
    console.log(`Loaded ${currentData.length} camera records from data.json`);
  } catch (err) {
    console.warn(`Warning loading data.json: ${err.message}`);
    currentData = [];
  }
}

// Simulate updates
function simulateCameraData() {
  const updatedData = [];
  const now = new Date().toISOString();

  currentData.forEach((camera) => {
    const updatedCamera = { ...camera, timestamp: now };

    if (camera.reachable === 'true') {
      if (Math.random() < 0.95) {
        updatedCamera.reachable = 'true';
        const baseRTT = camera.rtt_ms || 20;
        updatedCamera.rtt_ms = Math.max(1, baseRTT + Math.floor(Math.random() * 21) - 10);
        updatedCamera.ttl = camera.ttl || 62;
        updatedCamera.error = null;
      } else {
        updatedCamera.reachable = 'false';
        updatedCamera.rtt_ms = null;
        updatedCamera.ttl = null;
        updatedCamera.error = 'Timeout';
      }
    } else {
      if (Math.random() < 0.8) {
        updatedCamera.reachable = 'false';
        updatedCamera.rtt_ms = null;
        updatedCamera.ttl = null;
        updatedCamera.error = 'Timeout';
      } else {
        updatedCamera.reachable = 'true';
        updatedCamera.rtt_ms = Math.floor(Math.random() * 46) + 15;
        updatedCamera.ttl = camera.name.includes('Camera') ? 62 : 126;
        updatedCamera.error = null;
      }
    }

    updatedData.push(updatedCamera);
  });

  return updatedData;
}

// Update every 130 seconds
function startDataUpdater() {
  setInterval(() => {
    currentData = simulateCameraData();
    fs.writeFile(dataFilePath, JSON.stringify(currentData, null, 2), (err) => {
      if (err) console.warn('Could not save data:', err);
    });
    console.log(`[${new Date().toISOString()}] Data updated.`);
  }, 130000);
}

// API routes

app.get('/api/cibest/cameras', (req, res) => {
  res.json({
    success: true,
    data: currentData,
    timestamp: new Date().toISOString(),
    total_cameras: currentData.length,
  });
});

app.get('/api/cibest/cameras/status', (req, res) => {
  const total = currentData.length;
  const online = currentData.filter(c => c.reachable === 'true').length;
  const offline = total - online;

  res.json({
    success: true,
    summary: {
      total_cameras: total,
      online,
      offline,
      uptime_percentage: total > 0 ? Math.round((online / total) * 10000) / 100 : 0,
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/cibest/cameras/:cameraId', (req, res) => {
  const id = parseInt(req.params.cameraId);
  const camera = currentData.find(c => c.id === id);

  if (!camera) {
    return res.status(404).json({
      success: false,
      error: `Camera with ID ${id} not found`
    });
  }

  res.json({
    success: true,
    data: camera,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Cibest Camera Monitoring API (Node.js)',
    timestamp: new Date().toISOString(),
    data_loaded: currentData.length > 0
  });
});

// Init
app.listen(port, () => {
  console.log(`🚀 API server running at http://localhost:${port}`);
  loadInitialData();
  startDataUpdater();
});
