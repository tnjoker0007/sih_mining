const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/mines
router.get('/mines', (req, res) => {
  res.json({ success: true, data: db.get('mines') });
});

// GET /api/mine-zones
router.get('/mine-zones', (req, res) => {
  const zones = db.get('mine_zones');
  const miners = db.get('miners');
  const nodes = db.get('sensor_nodes');

  // Enrich zones with real-time occupancy and active sensor count
  const enriched = zones.map(zone => {
    const zoneMiners = miners.filter(m => m.zone_id === zone.id || m.zone_id === zone.code);
    const zoneNodes = nodes.filter(n => n.zone_id === zone.id || n.zone_id === zone.code);
    return {
      ...zone,
      current_occupancy: zoneMiners.length,
      active_sensor_count: zoneNodes.length,
      critical_nodes_count: zoneNodes.filter(n => n.status === 'CRITICAL').length
    };
  });

  res.json({ success: true, data: enriched });
});

// POST /api/mine-zones
router.post('/mine-zones', (req, res) => {
  const { name, level_depth_m, risk_level, subsidence_threshold_mm, gas_threshold_ppm, max_capacity, evacuation_route, coordinates } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Zone name is required' });
  }

  const zoneCount = db.get('mine_zones').length;
  const nextLetter = String.fromCharCode(65 + zoneCount);
  const newZone = {
    id: `ZONE_${nextLetter}`,
    code: `ZONE_${nextLetter}`,
    mine_id: 'MINE_001',
    name,
    level_depth_m: Number(level_depth_m) || 200,
    risk_level: risk_level || 'SAFE',
    subsidence_velocity_mm_hr: 0.0,
    gas_ch4_ppm: 0.05,
    subsidence_threshold_mm: Number(subsidence_threshold_mm) || 5.0,
    gas_threshold_ppm: Number(gas_threshold_ppm) || 1.25,
    max_capacity: Number(max_capacity) || 20,
    current_occupancy: 0,
    evacuation_route: evacuation_route || 'Emergency Stairway -> Portal Hoist',
    coordinates: coordinates || { x: 200, y: 200, width: 180, height: 100, shape: 'rect' },
    status: 'ACTIVE'
  };

  db.insert('mine_zones', newZone);
  db.addAudit('Admin', 'ZONE_CREATED', `Created zone ${newZone.code} (${newZone.name})`);
  res.status(201).json({ success: true, data: newZone });
});

// PUT /api/mine-zones/:id
router.put('/mine-zones/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.update('mine_zones', id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Zone not found' });
  }
  db.addAudit('Admin', 'ZONE_UPDATED', `Updated zone ${id}`);
  res.json({ success: true, data: updated });
});

// DELETE /api/mine-zones/:id
router.delete('/mine-zones/:id', (req, res) => {
  const { id } = req.params;
  const removed = db.delete('mine_zones', id);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'Zone not found' });
  }
  db.addAudit('Admin', 'ZONE_DELETED', `Deleted zone ${id}`);
  res.json({ success: true, message: 'Zone deleted successfully' });
});

// GET /api/sensor-nodes
router.get('/sensor-nodes', (req, res) => {
  res.json({ success: true, data: db.get('sensor_nodes') });
});

// POST /api/sensor-nodes
router.post('/sensor-nodes', (req, res) => {
  const { name, zone_id, type, coordinates } = req.body;
  if (!name || !zone_id) {
    return res.status(400).json({ success: false, message: 'Sensor name and Zone are required' });
  }

  const zone = db.getById('mine_zones', zone_id);
  const nodeCount = db.get('sensor_nodes').length + 1;
  const newNode = {
    id: `NODE_${nodeCount.toString().padStart(3, '0')}`,
    code: `NODE_${nodeCount.toString().padStart(3, '0')}`,
    zone_id,
    zone_name: zone ? zone.name : 'Unknown Zone',
    type: type || 'SUBSIDENCE_RADAR',
    name,
    status: 'SAFE',
    battery_pct: 100,
    signal_dbm: -50,
    last_reading: {
      displacement_rate_mm_hr: 0.05,
      tilt_pitch_deg: 0.1,
      tilt_roll_deg: 0.1,
      timestamp: new Date().toISOString()
    },
    coordinates: coordinates || { x: 300, y: 250 },
    last_seen: new Date().toISOString()
  };

  db.insert('sensor_nodes', newNode);
  db.addAudit('Admin', 'SENSOR_CREATED', `Registered sensor node ${newNode.code} in ${zone_id}`);
  res.status(201).json({ success: true, data: newNode });
});

// PUT /api/sensor-nodes/:id
router.put('/sensor-nodes/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.update('sensor_nodes', id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Sensor node not found' });
  }
  res.json({ success: true, data: updated });
});

// GET /api/miners
router.get('/miners', (req, res) => {
  res.json({ success: true, data: db.get('miners') });
});

// POST /api/miners
router.post('/miners', (req, res) => {
  const { name, role_title, zone_id, blood_group, emergency_contact } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Miner name is required' });
  }

  const minerCount = db.get('miners').length + 1;
  const minerId = `MINER_${minerCount.toString().padStart(3, '0')}`;
  const bandId = `BAND_${minerCount.toString().padStart(3, '0')}`;
  const zone = db.getById('mine_zones', zone_id || 'ZONE_A');

  const newMiner = {
    id: minerId,
    code: minerId,
    name,
    role_title: role_title || 'Underground Operator',
    zone_id: zone ? zone.id : 'ZONE_A',
    zone_name: zone ? zone.name : 'Shaft 1 - North Gallery',
    assigned_band_id: bandId,
    blood_group: blood_group || 'O+',
    emergency_contact: emergency_contact || '+1-555-0100',
    status: 'ACTIVE',
    vitals: {
      heart_rate: 75,
      spo2: 98,
      skin_temp_c: 36.5,
      motion_state: 'WALKING',
      impact_g: 0.8,
      posture: 'UPRIGHT'
    },
    coordinates: { x: (zone && zone.coordinates) ? zone.coordinates.x + 40 : 200, y: (zone && zone.coordinates) ? zone.coordinates.y + 40 : 200 },
    last_seen: new Date().toISOString()
  };

  const newBand = {
    id: bandId,
    code: bandId,
    miner_id: minerId,
    miner_name: name,
    battery_pct: 100,
    signal_strength: 'STRONG (-50 dBm)',
    firmware_version: 'v2.4.1-PRO',
    status: 'ONLINE',
    last_sync: new Date().toISOString(),
    last_broadcast_received: null
  };

  db.insert('miners', newMiner);
  db.insert('smart_bands', newBand);
  db.addAudit('Admin', 'MINER_REGISTERED', `Registered miner ${newMiner.name} (${minerId}) with Band ${bandId}`);

  res.status(201).json({ success: true, data: newMiner });
});

// PUT /api/miners/:id
router.put('/miners/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.update('miners', id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Miner not found' });
  }
  res.json({ success: true, data: updated });
});

// DELETE /api/miners/:id
router.delete('/miners/:id', (req, res) => {
  const { id } = req.params;
  const removed = db.delete('miners', id);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'Miner not found' });
  }

  // Find and unassign smart band if any
  const bands = db.get('smart_bands');
  const assignedBand = bands.find(b => b.miner_id === id);
  if (assignedBand) {
    db.update('smart_bands', assignedBand.id, { miner_id: null, last_broadcast_received: null });
  }

  db.addAudit('Admin', 'MINER_DELETED', `Deleted miner profile ${id}`);
  res.json({ success: true, message: 'Miner profile deleted successfully' });
});

module.exports = router;
