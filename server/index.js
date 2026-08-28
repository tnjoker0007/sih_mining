const express = require('express');
const http = require('http');
const cors = require('cors');
const WebSocket = require('ws');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./db');
const TelemetrySimulator = require('./simulator');

const authRoutes = require('./routes/auth');
const zoneRoutes = require('./routes/zones');
const alertRoutes = require('./routes/alerts');
const incidentRoutes = require('./routes/incidents');
const bandRoutes = require('./routes/bands');
const reportRoutes = require('./routes/reports');
const telemetryRoutes = require('./routes/telemetry');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('[WebSocket] New Command Center client connected');
  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    data: { message: 'Connected to MineGuard AI Module 3 Command Stream' },
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      console.log('[WebSocket Message Received]', parsed.type);
    } catch (e) {
      console.error('[WebSocket] Invalid JSON received');
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });
});

app.set('wss', wss);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize Telemetry Simulator
const simulator = new TelemetrySimulator(app);
simulator.start();
app.set('simulator', simulator);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'MineGuard AI Command Center (Module 3)',
    version: '3.4.0-ENTERPRISE',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // Exposes /api/users, /api/roles directly as per doc
app.use('/api', zoneRoutes); // Exposes /api/mine-zones, /api/mines, /api/sensor-nodes, /api/miners
app.use('/api/alerts', alertRoutes); // Exposes /api/alerts, /api/alerts/ai, /api/alerts/miner, /api/alerts/:id/acknowledge
app.use('/api/incidents', incidentRoutes); // Exposes /api/incidents, /api/incidents/:id/status
app.use('/api/rescue-teams', incidentRoutes);
app.use('/api/bands', bandRoutes); // Exposes /api/bands, /api/bands/broadcast
app.use('/api/reports', reportRoutes); // Exposes /api/reports, /api/reports/generate, /api/reports/analytics/summary
app.use('/api/telemetry', telemetryRoutes); // Exposes /api/telemetry/scenario, /api/telemetry/settings

// Serve static client in production if built
const clientDist = path.join(__dirname, '../client/dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  MINEGUARD AI - MODULE 3: COMMAND CENTER SERVER       `);
  console.log(`  REST API listening on: http://localhost:${PORT}      `);
  console.log(`  WebSocket streaming on: ws://localhost:${PORT}      `);
  console.log(`=======================================================`);
});
