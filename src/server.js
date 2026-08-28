const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Server-Sent Events clients
let sseClients = [];

function sendSSEEvent(type, data) {
  sseClients.forEach(client => {
    client.res.write(`event: ${type}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// SSE Connection Endpoint
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial data to sync UI
  res.write(`event: sync\n`);
  res.write(`data: ${JSON.stringify({
    miners: db.miners.all(),
    bands: db.bands.all(),
    activeSos: db.sos.active()
  })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Miner Endpoints
app.get('/api/miners', (req, res) => {
  res.json(db.miners.all());
});

app.get('/api/miners/:id', (req, res) => {
  const miner = db.miners.find(req.params.id);
  if (!miner) return res.status(404).json({ error: "Miner not found" });
  res.json(miner);
});

app.post('/api/miners', (req, res) => {
  const { miner_id, name, employee_id, mine_id, zone_id, phone, email } = req.body;
  if (!miner_id || !name) {
    return res.status(400).json({ error: "miner_id and name are required" });
  }
  const existing = db.miners.find(miner_id);
  if (existing) {
    return res.status(400).json({ error: "Miner ID already exists" });
  }
  const miner = db.miners.insert({
    miner_id,
    name,
    employee_id: employee_id || '',
    mine_id: mine_id || 'MINE_001',
    zone_id: zone_id || 'ZONE_A',
    status: 'SAFE',
    phone: phone || '',
    email: email || ''
  });
  sendSSEEvent('miner_update', db.miners.all());
  res.status(201).json(miner);
});

app.put('/api/miners/:id', (req, res) => {
  const updated = db.miners.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Miner not found" });
  sendSSEEvent('miner_update', db.miners.all());
  res.json(updated);
});

app.delete('/api/miners/:id', (req, res) => {
  const deleted = db.miners.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Miner not found" });
  
  // Also unassign from any band
  const pairedBand = db.bands.all().find(b => b.miner_id === req.params.id);
  if (pairedBand) {
    db.bands.pair(pairedBand.band_id, null);
    sendSSEEvent('band_update', db.bands.all());
  }

  sendSSEEvent('miner_update', db.miners.all());
  res.json({ message: "Miner deleted successfully", miner: deleted });
});

// Band Endpoints
app.get('/api/bands', (req, res) => {
  res.json(db.bands.all());
});

app.post('/api/bands', (req, res) => {
  const { band_id, lora_id } = req.body;
  if (!band_id || !lora_id) {
    return res.status(400).json({ error: "band_id and lora_id are required" });
  }
  const existing = db.bands.find(band_id);
  if (existing) {
    return res.status(400).json({ error: "Band ID already exists" });
  }
  const band = db.bands.insert({
    band_id,
    lora_id,
    miner_id: null,
    battery_level: 100,
    signal_strength: 0,
    online: false,
    last_active: new Date().toISOString()
  });
  sendSSEEvent('band_update', db.bands.all());
  res.status(201).json(band);
});

app.put('/api/bands/:id/pair', (req, res) => {
  const { miner_id } = req.body;
  const band = db.bands.pair(req.params.id, miner_id);
  if (!band) return res.status(404).json({ error: "Band not found" });
  
  sendSSEEvent('band_update', db.bands.all());
  sendSSEEvent('miner_update', db.miners.all());
  res.json(band);
});

app.get('/api/bands/:id/status', (req, res) => {
  const band = db.bands.find(req.params.id);
  if (!band) return res.status(404).json({ error: "Band not found" });
  const history = db.telemetry.forBand(req.params.id);
  res.json({ band, history });
});

// Telemetry Ingestion Endpoint
app.post('/api/bands/data', (req, res) => {
  const { band_id, battery, signal_strength, motion_status, fall_detected, sos, x_accel, y_accel, z_accel } = req.body;
  if (!band_id) {
    return res.status(400).json({ error: "band_id is required" });
  }

  // Find assigned miner details if any
  const band = db.bands.find(band_id);
  if (!band) {
    return res.status(404).json({ error: "Band not registered" });
  }
  const minerId = band.miner_id;
  const miner = minerId ? db.miners.find(minerId) : null;
  const zoneId = miner ? miner.zone_id : 'UNKNOWN';

  // Log Telemetry
  const telemetryRecord = db.telemetry.log({
    band_id,
    miner_id: minerId,
    battery: battery !== undefined ? battery : 100,
    signal_strength: signal_strength !== undefined ? signal_strength : 50,
    motion_status: motion_status || 'NORMAL',
    fall_detected: !!fall_detected,
    sos: !!sos,
    x_accel: x_accel || 0,
    y_accel: y_accel || 0,
    z_accel: z_accel || 9.8
  });

  // Handle Automatic SOS triggers from telemetry
  if (sos) {
    const activeSos = db.sos.active().find(e => e.band_id === band_id);
    if (!activeSos) {
      const newSos = db.sos.insert({
        miner_id: minerId,
        band_id: band_id,
        zone_id: zoneId,
        source: 'BAND_MANUAL_SOS',
        details: 'Manual SOS button pressed on device'
      });
      sendSSEEvent('sos_event', newSos);
      sendSSEEvent('miner_update', db.miners.all());
    }
  }

  // Send standard telemetry update event via SSE
  sendSSEEvent('telemetry', telemetryRecord);
  sendSSEEvent('band_update', db.bands.all());
  
  res.json({ success: true, telemetry: telemetryRecord });
});

// Fall Event Management Endpoints
app.post('/api/fall-events', (req, res) => {
  const { band_id, miner_id, zone_id, acceleration, orientation, cancellation_timeout } = req.body;
  if (!band_id) {
    return res.status(400).json({ error: "band_id is required" });
  }

  const fall = db.falls.insert({
    band_id,
    miner_id: miner_id || null,
    zone_id: zone_id || 'UNKNOWN',
    acceleration: acceleration || 25.4, // m/s^2 peak
    orientation: orientation || 'TILTED',
    cancellation_timeout_seconds: cancellation_timeout || 15
  });

  sendSSEEvent('fall_event', fall);
  sendSSEEvent('miner_update', db.miners.all());

  res.status(201).json(fall);
});

app.post('/api/fall-events/cancel', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "fall event id is required" });

  const updatedFall = db.falls.updateStatus(id, 'CANCELLED');
  if (!updatedFall) return res.status(404).json({ error: "Fall event not found" });

  sendSSEEvent('fall_status', updatedFall);
  sendSSEEvent('miner_update', db.miners.all());
  res.json({ message: "Fall alert cancelled by miner (false alarm)", fall: updatedFall });
});

app.post('/api/fall-events/trigger', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "fall event id is required" });

  const updatedFall = db.falls.updateStatus(id, 'SOS_TRIGGERED');
  if (!updatedFall) return res.status(404).json({ error: "Fall event not found" });

  sendSSEEvent('fall_status', updatedFall);
  sendSSEEvent('miner_update', db.miners.all());
  res.json({ message: "Fall alarm timed out. Automatic SOS triggered.", fall: updatedFall });
});

// SOS Management Endpoints
app.post('/api/sos', (req, res) => {
  const { miner_id, band_id, zone_id, details } = req.body;
  
  // Verify band/miner mapping
  let finalBandId = band_id;
  let finalMinerId = miner_id;
  let finalZoneId = zone_id;

  if (miner_id && !band_id) {
    const band = db.bands.findByMiner(miner_id);
    if (band) finalBandId = band.band_id;
  } else if (band_id && !miner_id) {
    const band = db.bands.find(band_id);
    if (band) finalMinerId = band.miner_id;
  }

  if (finalMinerId && !finalZoneId) {
    const miner = db.miners.find(finalMinerId);
    if (miner) finalZoneId = miner.zone_id;
  }

  const sos = db.sos.insert({
    miner_id: finalMinerId || null,
    band_id: finalBandId || null,
    zone_id: finalZoneId || 'UNKNOWN',
    source: 'CONTROL_ROOM_MANUAL',
    details: details || 'SOS triggered manually by control room'
  });

  sendSSEEvent('sos_event', sos);
  sendSSEEvent('miner_update', db.miners.all());
  res.status(201).json(sos);
});

app.post('/api/sos/acknowledge', (req, res) => {
  const { id, user } = req.body;
  if (!id) return res.status(400).json({ error: "SOS ID is required" });
  
  const acknowledged = db.sos.acknowledge(id, user);
  if (!acknowledged) return res.status(404).json({ error: "SOS event not found" });

  // Add alert message informing miner rescue is on the way
  if (acknowledged.band_id) {
    db.messages.insert({
      direction: 'CONTROL_TO_MINER',
      sender_id: 'CONTROL_ROOM',
      receiver_id: acknowledged.band_id,
      message_text: 'RESCUE TEAM ON THE WAY',
      severity: 'CRITICAL'
    });
  }

  sendSSEEvent('sos_ack', acknowledged);
  sendSSEEvent('miner_update', db.miners.all());
  sendSSEEvent('message', {
    direction: 'CONTROL_TO_MINER',
    sender_id: 'CONTROL_ROOM',
    receiver_id: acknowledged.band_id,
    message_text: 'RESCUE TEAM ON THE WAY',
    severity: 'CRITICAL',
    timestamp: new Date().toISOString()
  });

  res.json(acknowledged);
});

app.post('/api/sos/resolve', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "SOS ID is required" });

  const resolved = db.sos.resolve(id);
  if (!resolved) return res.status(404).json({ error: "SOS event not found" });

  // Inform miner that they are marked safe/situation resolved
  if (resolved.band_id) {
    db.messages.insert({
      direction: 'CONTROL_TO_MINER',
      sender_id: 'CONTROL_ROOM',
      receiver_id: resolved.band_id,
      message_text: 'SITUATION RESOLVED. ALL SAFE.',
      severity: 'INFO'
    });
  }

  sendSSEEvent('sos_resolve', resolved);
  sendSSEEvent('miner_update', db.miners.all());
  res.json(resolved);
});

// Messages & Alert Broadcasting
app.get('/api/messages', (req, res) => {
  res.json(db.messages.all());
});

app.post('/api/messages', (req, res) => {
  const { direction, sender_id, receiver_id, message_text, severity } = req.body;
  if (!message_text) return res.status(400).json({ error: "message_text is required" });

  const msg = db.messages.insert({
    direction: direction || 'MINER_TO_CONTROL',
    sender_id: sender_id || 'BAND_001',
    receiver_id: receiver_id || 'CONTROL_ROOM',
    message_text,
    severity: severity || 'INFO'
  });

  sendSSEEvent('message', msg);
  res.status(201).json(msg);
});

app.post('/api/bands/broadcast', (req, res) => {
  const { target_type, target_id, message_text, severity } = req.body;
  if (!message_text) return res.status(400).json({ error: "message_text is required" });

  // Target types: 'all', 'zone', 'miner', 'band'
  const broadcastObj = db.messages.insert({
    direction: 'CONTROL_TO_MINER',
    sender_id: 'CONTROL_ROOM',
    receiver_id: target_type === 'all' ? 'ALL_MINERS' : target_id,
    message_text,
    severity: severity || 'WARNING',
    broadcast: true,
    target_type,
    target_id
  });

  // Notify clients
  sendSSEEvent('message', broadcastObj);
  res.status(201).json(broadcastObj);
});

// Background offline checker: run every 3 seconds to monitor band check-in status
setInterval(() => {
  const now = Date.now();
  const OFFLINE_TIMEOUT = 10000; // 10 seconds of inactivity triggers offline event
  let updated = false;

  db.bands.all().forEach(band => {
    if (band.online) {
      const lastActiveTime = new Date(band.last_active).getTime();
      if (now - lastActiveTime > OFFLINE_TIMEOUT) {
        db.bands.update(band.band_id, { online: false });
        
        const miner = band.miner_id ? db.miners.find(band.miner_id) : null;
        const minerName = miner ? miner.name : 'Unassigned';
        
        if (miner && miner.status !== 'OFFLINE' && miner.status !== 'SOS') {
          db.miners.update(miner.miner_id, { status: 'OFFLINE' });
        }

        const logMsg = db.messages.insert({
          direction: 'MINER_TO_CONTROL',
          sender_id: band.band_id,
          receiver_id: 'CONTROL_ROOM',
          message_text: `COMMUNICATION LOSS: Wearable ${band.band_id} (${minerName}) offline.`,
          severity: 'WARNING'
        });

        sendSSEEvent('message', logMsg);
        updated = true;
      }
    }
  });

  if (updated) {
    sendSSEEvent('band_update', db.bands.all());
    sendSSEEvent('miner_update', db.miners.all());
  }
}, 3000);

app.listen(PORT, () => {
  console.log(`MineGuard Module 2 server running on port ${PORT}`);
});
