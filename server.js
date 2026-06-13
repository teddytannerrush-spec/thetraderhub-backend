const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the server root
dotenv.config({ path: path.join(__dirname, '../.env') });

const brokerRoutes = require('./routes/broker');
const chartsRoutes = require('./routes/charts');
const socialRoutes = require('./routes/social');
const calendarRoutes = require('./routes/calendar');
const syncJob = require('./jobs/sync');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Initialize Socket.io with flexible CORS settings for local development and live domains
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Enable CORS so the client (http://localhost:8080 or live hosting) can communicate securely
app.use(cors());

// Parse incoming request payloads as JSON
app.use(express.json());
// Parse incoming urlencoded payloads for standard TradingView client requests
app.use(express.urlencoded({ extended: true }));

// Register API routes
app.use('/api/broker', brokerRoutes);
app.use('/api/charts', chartsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/economic-calendar', calendarRoutes);

// Health check endpoint for sanity monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime()
  });
});

// Start node-cron scheduled syncing
syncJob.startSyncJob();

// Initialize social module with socket.io support
if (typeof socialRoutes.initSocial === 'function') {
  socialRoutes.initSocial(io);
}

// Start HTTP and WebSocket server listening
server.listen(PORT, () => {
  console.log(`┌──────────────────────────────────────────────────────────┐`);
  console.log(`│       THETRADERHUB SECURE WEBSOCKET BACKEND ACTIVE       │`);
  console.log(`├──────────────────────────────────────────────────────────┤`);
  console.log(`│  Port: ${PORT}                                              │`);
  console.log(`│  Environment: development                                │`);
  console.log(`│  Health: http://localhost:${PORT}/health                   │`);
  console.log(`└──────────────────────────────────────────────────────────┘`);
});
