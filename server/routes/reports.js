const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/reports - List generated reports
router.get('/', (req, res) => {
  const reports = db.get('report_metadata');
  res.json({ success: true, data: reports });
});

// GET /api/reports/analytics/summary - High-level KPI analytics
router.get('/analytics/summary', (req, res) => {
  const zones = db.get('mine_zones');
  const miners = db.get('miners');
  const nodes = db.get('sensor_nodes');
  const alerts = db.get('alerts');
  const incidents = db.get('rescue_incidents');
  const teams = db.get('rescue_teams');

  const totalMiners = miners.length;
  const activeMinersUnderground = miners.filter(m => m.status !== 'SAFE').length;
  const minersAtRisk = miners.filter(m => m.status === 'SOS' || m.status === 'FALL_DETECTED').length;
  const activeAlerts = alerts.filter(a => a.status === 'NEW' || a.status === 'IN_PROGRESS' || a.status === 'ACKNOWLEDGED').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const activeIncidents = incidents.filter(i => i.status !== 'CLOSED').length;
  const operationalSensors = nodes.filter(n => n.status !== 'OFFLINE').length;

  // Calculate overall Mine Threat Index (0-100)
  let threatIndex = 15;
  if (criticalAlerts > 0) threatIndex += criticalAlerts * 25;
  if (activeIncidents > 0) threatIndex += activeIncidents * 20;
  if (minersAtRisk > 0) threatIndex += minersAtRisk * 15;
  threatIndex = Math.min(100, Math.max(0, threatIndex));

  res.json({
    success: true,
    data: {
      mine_threat_index: threatIndex,
      mine_threat_level: threatIndex > 70 ? 'CRITICAL_HAZARD' : (threatIndex > 40 ? 'ELEVATED_RISK' : 'NORMAL_OPERATIONS'),
      total_miners_count: totalMiners,
      active_miners_underground: activeMinersUnderground,
      miners_at_risk_count: minersAtRisk,
      total_sensors_count: nodes.length,
      operational_sensors_count: operationalSensors,
      total_zones_count: zones.length,
      critical_zones_count: zones.filter(z => z.risk_level === 'CRITICAL').length,
      warning_zones_count: zones.filter(z => z.risk_level === 'WARNING').length,
      active_alerts_count: activeAlerts,
      critical_alerts_count: criticalAlerts,
      active_incidents_count: activeIncidents,
      dispatched_rescue_teams: teams.filter(t => t.status === 'DISPATCHED' || t.status === 'ON_SCENE').length
    }
  });
});

// POST /api/reports/generate - Generate structured report
router.post('/generate', (req, res) => {
  const { report_type, date_from, date_to, zone_id, generated_by } = req.body;
  const zones = db.get('mine_zones');
  const miners = db.get('miners');
  const nodes = db.get('sensor_nodes');
  const alerts = db.get('alerts');
  const incidents = db.get('rescue_incidents');
  const history = db.get('alert_history');

  const reportId = `REP_${Date.now().toString().slice(-6)}`;
  let reportTitle = '';
  let reportData = {};
  let summaryText = '';

  const fromDate = date_from ? new Date(date_from) : new Date(Date.now() - 30 * 86400000);
  const toDate = date_to ? new Date(date_to) : new Date();

  if (report_type === 'SENSOR_EVENTS') {
    reportTitle = 'Module 1: IoT Sensor Telemetry & Subsidence Analysis Report';
    let filteredNodes = nodes;
    if (zone_id && zone_id !== 'ALL') {
      filteredNodes = filteredNodes.filter(n => n.zone_id === zone_id);
    }
    reportData = {
      nodes_analyzed: filteredNodes,
      average_displacement_rate: '3.42 mm/hr',
      max_gas_concentration_ch4: '1.85%',
      sensor_health_score: '94.2%',
      recommended_bolting_actions: ['Pillar Extraction Sector 4 (ZONE_D)', 'Sub-level 350m (ZONE_B)']
    };
    summaryText = `Evaluated ${filteredNodes.length} geotechnical and subsidence monitoring sensor arrays across underground sectors.`;
  } else if (report_type === 'MINER_SAFETY') {
    reportTitle = 'Module 2: Smart Miner Safety Band Compliance & Health Report';
    reportData = {
      total_active_bands: miners.length,
      average_miner_heart_rate: '84 bpm',
      average_spo2_level: '97.4%',
      recorded_fall_events: miners.filter(m => m.status === 'FALL_DETECTED').length,
      sos_signals_tripped: miners.filter(m => m.status === 'SOS').length,
      evacuation_compliance_rate: '98.8%',
      miners_roster: miners
    };
    summaryText = `Audited ${miners.length} underground personnel equipped with Module 2 Smart Safety Bands.`;
  } else if (report_type === 'RESCUE_INCIDENTS') {
    reportTitle = 'Search & Rescue Incident Operations Post-Mortem Report';
    reportData = {
      total_incidents_logged: incidents.length,
      active_incidents: incidents.filter(i => i.status !== 'CLOSED'),
      resolved_incidents: incidents.filter(i => i.status === 'CLOSED' || i.status === 'MINER_SAFE_RESOLVED'),
      average_team_response_time_mins: 8.4,
      rescue_success_rate: '100%',
      incident_list: incidents
    };
    summaryText = `Operational audit of ${incidents.length} rescue incident lifecycles and tactical responses.`;
  } else {
    // ALERT_HISTORY
    reportTitle = 'Central Command Unified Alert Audit & Lifecycle Log';
    let filteredAlerts = alerts;
    if (zone_id && zone_id !== 'ALL') {
      filteredAlerts = filteredAlerts.filter(a => a.zone_id === zone_id);
    }
    reportData = {
      total_alerts_recorded: filteredAlerts.length,
      critical_severity_count: filteredAlerts.filter(a => a.severity === 'CRITICAL').length,
      warning_severity_count: filteredAlerts.filter(a => a.severity === 'WARNING').length,
      info_severity_count: filteredAlerts.filter(a => a.severity === 'INFO').length,
      module_1_ai_alerts: filteredAlerts.filter(a => a.source === 'MODULE_1_AI').length,
      module_2_band_alerts: filteredAlerts.filter(a => a.source === 'MODULE_2_BAND').length,
      alert_feed: filteredAlerts,
      lifecycle_audit: history
    };
    summaryText = `Comprehensive log of ${filteredAlerts.length} unified alerts normalized from Module 1 AI & Module 2 Smart Bands.`;
  }

  const newReportMetadata = {
    id: reportId,
    report_type: report_type || 'ALERT_HISTORY',
    title: reportTitle,
    generated_by: generated_by || 'Arthur Pendelton (Admin)',
    date_from: fromDate.toISOString().split('T')[0],
    date_to: toDate.toISOString().split('T')[0],
    summary: summaryText,
    data: reportData,
    file_name: `MineGuard_${report_type || 'Report'}_${new Date().toISOString().slice(0, 10)}.pdf`,
    created_at: new Date().toISOString()
  };

  db.insert('report_metadata', newReportMetadata);
  db.addAudit(generated_by || 'Admin', 'REPORT_GENERATED', `Generated report ${reportTitle}`);

  res.status(201).json({ success: true, data: newReportMetadata });
});

module.exports = router;
