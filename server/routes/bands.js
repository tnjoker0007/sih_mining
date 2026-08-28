const express = require('express');
const router = express.Router();
const db = require('../db');

function broadcastWs(app, eventType, payload) {
  if (app.get('wss')) {
    const wss = app.get('wss');
    const msg = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(msg);
    });
  }
}

// GET /api/bands
router.get('/', (req, res) => {
  const bands = db.get('smart_bands');
  const miners = db.get('miners');

  const enriched = bands.map(band => {
    const miner = miners.find(m => m.id === band.miner_id || m.assigned_band_id === band.id);
    return {
      ...band,
      miner_details: miner || null
    };
  });

  res.json({ success: true, data: enriched });
});

// GET /api/bands/broadcasts
router.get('/broadcasts', (req, res) => {
  res.json({ success: true, data: db.get('band_broadcasts') });
});

// POST /api/bands/broadcast - Suggested API: POST /api/bands/broadcast
router.post('/broadcast', (req, res) => {
  const {
    target_type, // 'ALL', 'ZONE', 'SPECIFIC_BANDS'
    target_id,   // 'ZONE_D' or array of band IDs
    message,
    alert_level, // 'EMERGENCY_EVACUATE', 'WARNING_STANDBY', 'CUSTOM_DIRECTIVE', 'ALL_CLEAR'
    sender_name
  } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Broadcast message text is required' });
  }

  const broadcasts = db.get('band_broadcasts');
  const broadcastId = `BCAST_${(broadcasts.length + 1).toString().padStart(3, '0')}`;

  const allBands = db.get('smart_bands');
  const miners = db.get('miners');

  let targetBandIds = [];
  let targetName = 'All Mine Personnel';

  if (target_type === 'ZONE') {
    const zone = db.getById('mine_zones', target_id);
    targetName = zone ? zone.name : target_id;
    const zoneMiners = miners.filter(m => m.zone_id === target_id);
    targetBandIds = zoneMiners.map(m => m.assigned_band_id).filter(Boolean);
  } else if (target_type === 'SPECIFIC_BANDS') {
    targetBandIds = Array.isArray(target_id) ? target_id : [target_id];
    targetName = `Selected Bands (${targetBandIds.length})`;
  } else {
    targetBandIds = allBands.map(b => b.id);
  }

  const newBroadcast = {
    id: broadcastId,
    sender_name: sender_name || 'Control Room Command',
    target_type: target_type || 'ALL',
    target_id: target_id || 'ALL_ZONES',
    target_name: targetName,
    alert_level: alert_level || 'EMERGENCY_EVACUATE',
    message,
    vibrate_pattern: alert_level === 'EMERGENCY_EVACUATE' ? 'PULSED_HIGH_FREQUENCY' : 'SINGLE_CHIRP',
    audio_siren: alert_level === 'EMERGENCY_EVACUATE',
    sent_to_bands: targetBandIds,
    acknowledged_bands: [],
    timestamp: new Date().toISOString()
  };

  db.insert('band_broadcasts', newBroadcast);

  // Update target bands last broadcast status
  targetBandIds.forEach(bId => {
    db.update('smart_bands', bId, {
      last_broadcast_received: alert_level || 'EMERGENCY_EVACUATE',
      status: alert_level === 'EMERGENCY_EVACUATE' ? 'WARNING' : 'ONLINE'
    });
  });

  // If evacuation, update miners in target zones
  if (alert_level === 'EMERGENCY_EVACUATE') {
    targetBandIds.forEach(bId => {
      const band = db.getById('smart_bands', bId);
      if (band && band.miner_id) {
        const miner = db.getById('miners', band.miner_id);
        if (miner && miner.status !== 'FALL_DETECTED' && miner.status !== 'SOS') {
          db.update('miners', miner.id, { status: 'EVACUATING' });
        }
      }
    });
  }

  db.addAudit(sender_name || 'Control Room', 'BAND_BROADCAST_SENT', `Sent ${alert_level} broadcast to ${targetName}: "${message}"`);
  broadcastWs(req.app, 'EMERGENCY_BROADCAST', newBroadcast);

  res.status(201).json({
    success: true,
    message: `Emergency broadcast transmitted to ${targetBandIds.length} active Smart Bands.`,
    data: newBroadcast
  });
});

// POST /api/bands/:id/ack - Smart band miner acknowledgement uplink
router.post('/:id/ack', (req, res) => {
  const { id } = req.params;
  const { broadcast_id, miner_status } = req.body;

  const band = db.getById('smart_bands', id);
  if (!band) {
    return res.status(404).json({ success: false, message: 'Band not found' });
  }

  if (broadcast_id) {
    const bcast = db.getById('band_broadcasts', broadcast_id);
    if (bcast && !bcast.acknowledged_bands.includes(id)) {
      bcast.acknowledged_bands.push(id);
      db.update('band_broadcasts', broadcast_id, { acknowledged_bands: bcast.acknowledged_bands });
    }
  }

  db.update('smart_bands', id, { last_sync: new Date().toISOString() });

  if (band.miner_id && miner_status) {
    db.update('miners', band.miner_id, { status: miner_status });
  }

  broadcastWs(req.app, 'BAND_ACK_RECEIVED', { band_id: id, miner_name: band.miner_name, timestamp: new Date().toISOString() });
  res.json({ success: true, message: 'Acknowledgement recorded' });
});

module.exports = router;
