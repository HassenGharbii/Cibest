const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

// PostgreSQL connection (match Python env variables)
const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'db',
  port: process.env.POSTGRES_PORT || process.env.DB_PORT || 5432,
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'cdgxpress',
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'cdgxpress_user',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'password',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

// Middleware
app.use(cors());

// API Routes

// All cameras (latest status per host)
app.get('/api/cibest/cameras', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (ip) id, ip, name, reachable, rtt_ms, ttl, timestamp, error
      FROM ping_results
      ORDER BY ip, timestamp DESC;
    `);

    res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString(),
      total_cameras: result.rowCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'DB query failed' });
  }
});

// Cameras status summary
app.get('/api/cibest/cameras/status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ip, reachable
      FROM (
        SELECT DISTINCT ON (ip) ip, reachable
        FROM ping_results
        ORDER BY ip, timestamp DESC
      ) latest;
    `);

    const total = result.rows.length;
    const online = result.rows.filter(r => r.reachable).length;
    const offline = total - online;

    res.json({
      success: true,
      summary: {
        total_cameras: total,
        online,
        offline,
        uptime_percentage: total > 0 ? Math.round((online / total) * 10000) / 100 : 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'DB query failed' });
  }
});

// Get specific camera by ID
app.get('/api/cibest/cameras/:cameraId', async (req, res) => {
  try {
    const id = parseInt(req.params.cameraId);
    const result = await pool.query(
      `SELECT * FROM ping_results WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: `Camera with ID ${id} not found` });
    }

    res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'DB query failed' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM ping_results;');
    res.json({
      status: 'healthy',
      service: 'Cibest Camera Monitoring API (Node.js)',
      timestamp: new Date().toISOString(),
      rows_in_db: parseInt(result.rows[0].count, 10),
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'DB not reachable',
      timestamp: new Date().toISOString(),
    });
  }
});

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
  } else {
    console.log('✅ Database connection successful');
    release();
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err);
});

// Init
const server = app.listen(port, host, () => {
  console.log(`🚀 API server running at http://${host}:${port}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    pool.end(() => {
      console.log('✅ Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    pool.end(() => {
      console.log('✅ Database pool closed');
      process.exit(0);
    });
  });
});
