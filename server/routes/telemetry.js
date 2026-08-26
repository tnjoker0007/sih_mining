const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/telemetry/scenario - Trigger scenario
router.post('/scenario', (req, res) => {
  const { scenario } = req.body; // 'NORMAL', 'SUBSIDENCE_SURGE', 'MINER_SOS', 'GAS_SPIKE', 'RESET'
  const simulator = req.app.get('simulator');

  if (!simulator) {
    return res.status(500).json({ success: false, message: 'Simulator not initialized' });
  }

  const result = simulator.triggerScenario(scenario || 'NORMAL');
  res.json({ success: true, message: `Scenario ${scenario} triggered successfully.`, result });
});

// GET /api/telemetry/settings
router.get('/settings', (req, res) => {
  res.json({ success: true, data: db.getSettings() });
});

// PUT /api/telemetry/settings
router.put('/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  db.addAudit('Admin', 'SETTINGS_UPDATED', 'Updated system configurations.');
  res.json({ success: true, data: updated });
});

// GET /api/telemetry/audit-logs
router.get('/audit-logs', (req, res) => {
  res.json({ success: true, data: db.get('audit_logs') });
});

// POST /api/telemetry/reset
router.post('/reset', (req, res) => {
  const simulator = req.app.get('simulator');
  if (simulator) simulator.triggerScenario('RESET');
  else db.reset();

  res.json({ success: true, message: 'Database reset to default initial state.' });
});

module.exports = router;
