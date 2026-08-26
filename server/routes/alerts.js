const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to broadcast WebSocket events
function broadcastWs(app, eventType, payload) {
  if (app.get('wss')) {
    const wss = app.get('wss');
    const msg = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(msg);
      }
    });
  }
}

// GET /api/alerts
router.get('/', (req, res) => {
  const { severity, status, zone_id, source } = req.query;
  let alerts = db.get('alerts');

  if (severity && severity !== 'ALL') {
    alerts = alerts.filter(a => a.severity.toUpperCase() === severity.toUpperCase());
  }
  if (status && status !== 'ALL') {
    alerts = alerts.filter(a => a.status.toUpperCase() === status.toUpperCase());
  }
  if (zone_id && zone_id !== 'ALL') {
    alerts = alerts.filter(a => a.zone_id === zone_id);
  }
  if (source && source !== 'ALL') {
    alerts = alerts.filter(a => a.source.toUpperCase() === source.toUpperCase());
  }

  res.json({ success: true, data: alerts });
});

// GET /api/alerts/history
router.get('/history', (req, res) => {
  const history = db.get('alert_history');
  res.json({ success: true, data: history });
});

// POST /api/alerts/ai - Ingestion endpoint for Module 1 AI Subsidence System
router.post('/ai', (req, res) => {
  const {
    title,
    description,
    zone_id,
    node_id,
    severity,
    subsidence_velocity_mm_hr,
    time_to_collapse_est_mins,
    ai_confidence,
    model_name
  } = req.body;

  const alerts = db.get('alerts');
  const alertId = `ALERT_${(alerts.length + 1).toString().padStart(3, '0')}`;
  const zone = db.getById('mine_zones', zone_id || 'ZONE_D');

  const newAlert = {
    id: alertId,
    code: alertId,
    source: 'MODULE_1_AI',
    severity: severity || (subsidence_velocity_mm_hr > 5.0 ? 'CRITICAL' : 'WARNING'),
    status: 'NEW',
    title: title || `AI Subsidence Alert: Rate ${subsidence_velocity_mm_hr || 8.5} mm/hr`,
    description: description || `Module 1 AI model detected rapid strata deformation in ${zone ? zone.name : zone_id}. Immediate inspection recommended.`,
    zone_id: zone ? zone.id : zone_id,
    zone_name: zone ? zone.name : 'Sector',
    node_id: node_id || 'NODE_001',
    miner_id: null,
    ai_confidence: Number(ai_confidence) || 92.5,
    data_payload: {
      subsidence_velocity_mm_hr: Number(subsidence_velocity_mm_hr) || 8.5,
      time_to_collapse_est_mins: Number(time_to_collapse_est_mins) || 45,
      model_name: model_name || 'MineGuard-StrataNet-AI',
      ingested_at: new Date().toISOString()
    },
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_by: null,
    resolved_at: null,
    created_at: new Date().toISOString()
  };

  db.insert('alerts', newAlert);

  // Update zone risk level if critical
  if (newAlert.severity === 'CRITICAL' && zone) {
    db.update('mine_zones', zone.id, {
      risk_level: 'CRITICAL',
      subsidence_velocity_mm_hr: Number(subsidence_velocity_mm_hr) || 10.5
    });
  }

  // Add history
  db.insert('alert_history', {
    id: 'AH_' + Date.now().toString().slice(-6),
    alert_id: alertId,
    action: 'MODULE_1_AI_INGESTION',
    changed_by: 'Module 1 InSAR/IoT Gateway',
    notes: `AI subsidence alert received with confidence ${newAlert.ai_confidence}%.`,
    timestamp: new Date().toISOString()
  });

  db.addAudit('Module 1 Gateway', 'AI_ALERT_INGESTED', `Alert ${alertId} (${newAlert.severity}) created for ${newAlert.zone_id}`);
  broadcastWs(req.app, 'NEW_ALERT', newAlert);

  res.status(201).json({ success: true, alert_id: alertId, data: newAlert });
});

// POST /api/alerts/miner - Ingestion endpoint for Module 2 Smart Miner Bands
router.post('/miner', (req, res) => {
  const {
    band_id,
    miner_id,
    event_type, // 'SOS', 'FALL_DETECTED', 'ABNORMAL_VITALS', 'GEOFENCE_BREACH'
    heart_rate,
    spo2,
    impact_g,
    immobile_duration_sec,
    zone_id,
    notes
  } = req.body;

  const alerts = db.get('alerts');
  const alertId = `ALERT_${(alerts.length + 1).toString().padStart(3, '0')}`;

  let miner = null;
  if (miner_id) miner = db.getById('miners', miner_id);
  else if (band_id) {
    const band = db.getById('smart_bands', band_id);
    if (band && band.miner_id) miner = db.getById('miners', band.miner_id);
  }

  const zone = db.getById('mine_zones', (miner && miner.zone_id) || zone_id || 'ZONE_A');

  const isCritical = event_type === 'SOS' || event_type === 'FALL_DETECTED' || (heart_rate && (heart_rate > 130 || heart_rate < 45));

  const newAlert = {
    id: alertId,
    code: alertId,
    source: 'MODULE_2_BAND',
    severity: isCritical ? 'CRITICAL' : 'WARNING',
    status: 'NEW',
    title: event_type === 'SOS' 
      ? `🚨 EMERGENCY SOS TRIGGERED: ${miner ? miner.name : 'Miner'}`
      : event_type === 'FALL_DETECTED'
      ? `⚠️ Miner Fall & Inactivity: ${miner ? miner.name : 'Miner'}`
      : `⚠️ Miner Health Vitals Warning: ${miner ? miner.name : 'Miner'}`,
    description: notes || `Smart Band ${band_id || (miner && miner.assigned_band_id)} transmitted ${event_type} event. Impact: ${impact_g || '0'}G, HR: ${heart_rate || 'N/A'} bpm.`,
    zone_id: zone ? zone.id : 'ZONE_A',
    zone_name: zone ? zone.name : 'Active Sector',
    node_id: null,
    miner_id: miner ? miner.id : miner_id,
    miner_name: miner ? miner.name : 'Underground Miner',
    ai_confidence: 99.0,
    data_payload: {
      band_id: band_id || (miner && miner.assigned_band_id),
      event_type,
      impact_g: impact_g || null,
      immobile_duration_sec: immobile_duration_sec || null,
      heart_rate: heart_rate || 110,
      spo2: spo2 || 96,
      ingested_at: new Date().toISOString()
    },
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_by: null,
    resolved_at: null,
    created_at: new Date().toISOString()
  };

  db.insert('alerts', newAlert);

  // Update miner status & vitals
  if (miner) {
    db.update('miners', miner.id, {
      status: event_type === 'SOS' ? 'SOS' : (event_type === 'FALL_DETECTED' ? 'FALL_DETECTED' : 'WARNING'),
      vitals: {
        ...miner.vitals,
        heart_rate: heart_rate || miner.vitals.heart_rate,
        spo2: spo2 || miner.vitals.spo2,
        impact_g: impact_g || miner.vitals.impact_g,
        motion_state: event_type === 'FALL_DETECTED' ? 'MOTIONLESS' : miner.vitals.motion_state
      }
    });
  }

  // Add history
  db.insert('alert_history', {
    id: 'AH_' + Date.now().toString().slice(-6),
    alert_id: alertId,
    action: 'MODULE_2_BAND_INGESTION',
    changed_by: 'Module 2 Smart Band Gateway',
    notes: `${event_type} event recorded for ${miner ? miner.name : 'miner'}.`,
    timestamp: new Date().toISOString()
  });

  db.addAudit('Module 2 Gateway', 'BAND_ALERT_INGESTED', `Alert ${alertId} (${event_type}) for miner ${miner ? miner.id : 'N/A'}`);
  broadcastWs(req.app, 'NEW_ALERT', newAlert);

  res.status(201).json({ success: true, alert_id: alertId, data: newAlert });
});

// POST /api/alerts - Manual alert creation
router.post('/', (req, res) => {
  const { title, description, severity, zone_id, source } = req.body;
  const alerts = db.get('alerts');
  const alertId = `ALERT_${(alerts.length + 1).toString().padStart(3, '0')}`;
  const zone = db.getById('mine_zones', zone_id);

  const newAlert = {
    id: alertId,
    code: alertId,
    source: source || 'OPERATOR',
    severity: severity || 'WARNING',
    status: 'NEW',
    title: title || 'Manual Safety Notice',
    description: description || 'Operator dispatched alert.',
    zone_id: zone ? zone.id : (zone_id || 'ZONE_A'),
    zone_name: zone ? zone.name : 'Mine Complex',
    node_id: null,
    miner_id: null,
    ai_confidence: 100,
    data_payload: req.body.data_payload || {},
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_by: null,
    resolved_at: null,
    created_at: new Date().toISOString()
  };

  db.insert('alerts', newAlert);
  broadcastWs(req.app, 'NEW_ALERT', newAlert);
  res.status(201).json({ success: true, data: newAlert });
});

// PUT /api/alerts/:id/acknowledge
router.put('/:id/acknowledge', (req, res) => {
  const { id } = req.params;
  const { user_name, notes } = req.body;
  const alert = db.getById('alerts', id);

  if (!alert) {
    return res.status(404).json({ success: false, message: 'Alert not found' });
  }

  const updated = db.update('alerts', id, {
    status: 'ACKNOWLEDGED',
    acknowledged_by: user_name || 'Control Room Operator',
    acknowledged_at: new Date().toISOString()
  });

  db.insert('alert_history', {
    id: 'AH_' + Date.now().toString().slice(-6),
    alert_id: id,
    action: 'ACKNOWLEDGED',
    changed_by: user_name || 'Control Room Operator',
    notes: notes || 'Alert acknowledged by operator on duty.',
    timestamp: new Date().toISOString()
  });

  db.addAudit(user_name || 'Operator', 'ALERT_ACKNOWLEDGED', `Acknowledged alert ${id}`);
  broadcastWs(req.app, 'ALERT_UPDATED', updated);

  res.json({ success: true, data: updated });
});

// PUT /api/alerts/:id/status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, user_name, notes } = req.body; // 'NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'

  const alert = db.getById('alerts', id);
  if (!alert) {
    return res.status(404).json({ success: false, message: 'Alert not found' });
  }

  const updates = { status };
  if (status === 'RESOLVED') {
    updates.resolved_by = user_name || 'Arthur Pendelton';
    updates.resolved_at = new Date().toISOString();
  }

  const updated = db.update('alerts', id, updates);

  db.insert('alert_history', {
    id: 'AH_' + Date.now().toString().slice(-6),
    alert_id: id,
    action: `STATUS_CHANGED_${status}`,
    changed_by: user_name || 'Operator',
    notes: notes || `Alert status updated to ${status}.`,
    timestamp: new Date().toISOString()
  });

  broadcastWs(req.app, 'ALERT_UPDATED', updated);
  res.json({ success: true, data: updated });
});

module.exports = router;
