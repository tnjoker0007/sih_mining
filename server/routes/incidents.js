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

// GET /api/incidents
router.get('/', (req, res) => {
  const incidents = db.get('rescue_incidents');
  const teams = db.get('rescue_teams');
  const updates = db.get('incident_updates');

  // Enrich incidents with team details and updates
  const enriched = incidents.map(inc => {
    const team = teams.find(t => t.id === inc.assigned_team_id || t.code === inc.assigned_team_id);
    const incUpdates = updates.filter(u => u.incident_id === inc.id || u.incident_id === inc.code);
    return {
      ...inc,
      assigned_team_details: team || null,
      timeline: incUpdates
    };
  });

  res.json({ success: true, data: enriched });
});

// GET /api/incidents/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const inc = db.getById('rescue_incidents', id);
  if (!inc) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  const team = db.getById('rescue_teams', inc.assigned_team_id);
  const incUpdates = db.get('incident_updates').filter(u => u.incident_id === inc.id || u.incident_id === inc.code);

  res.json({
    success: true,
    data: {
      ...inc,
      assigned_team_details: team || null,
      timeline: incUpdates
    }
  });
});

// POST /api/incidents
router.post('/', (req, res) => {
  const { alert_id, title, zone_id, severity, assigned_team_id, affected_miners, incident_lead, notes } = req.body;
  const incidents = db.get('rescue_incidents');
  const incidentId = `INCIDENT_${(incidents.length + 1).toString().padStart(3, '0')}`;

  const zone = db.getById('mine_zones', zone_id || 'ZONE_D');
  const team = assigned_team_id ? db.getById('rescue_teams', assigned_team_id) : null;

  const newIncident = {
    id: incidentId,
    code: incidentId,
    alert_id: alert_id || null,
    title: title || `Underground Incident: ${zone ? zone.name : 'Active Sector'}`,
    zone_id: zone ? zone.id : (zone_id || 'ZONE_D'),
    zone_name: zone ? zone.name : 'Sector',
    severity: severity || 'CRITICAL',
    status: assigned_team_id ? 'RESCUE_TEAM_ASSIGNED' : 'NEW',
    assigned_team_id: assigned_team_id || null,
    assigned_team_name: team ? team.name : null,
    affected_miners: Array.isArray(affected_miners) ? affected_miners : (affected_miners ? [affected_miners] : []),
    affected_miners_count: Array.isArray(affected_miners) ? affected_miners.length : (affected_miners ? 1 : 0),
    incident_lead: incident_lead || (team ? team.lead_user_name : 'SAR Incident Commander'),
    created_at: new Date().toISOString(),
    closed_at: null,
    summary_report: null,
    evacuation_order_issued: false
  };

  db.insert('rescue_incidents', newIncident);

  // If team assigned, update team status
  if (team) {
    db.update('rescue_teams', team.id, {
      status: 'DISPATCHED',
      active_incident_id: incidentId,
      assigned_zone_id: newIncident.zone_id
    });
  }

  // If associated with an alert, mark alert as IN_PROGRESS
  if (alert_id) {
    db.update('alerts', alert_id, { status: 'IN_PROGRESS' });
  }

  // Create initial timeline entry
  const initUpdate = {
    id: 'INC_UPD_' + Date.now().toString().slice(-6),
    incident_id: incidentId,
    user_name: req.body.user_name || 'Control Room Operator',
    role: 'Control Room Operator',
    status_snapshot: newIncident.status,
    notes: notes || `Incident ${incidentId} declared and initialized. Priority: ${newIncident.severity}.`,
    action_taken: 'Emergency protocol initiated.',
    timestamp: new Date().toISOString()
  };
  db.insert('incident_updates', initUpdate);

  db.addAudit(req.body.user_name || 'Operator', 'INCIDENT_CREATED', `Created incident ${incidentId} in ${newIncident.zone_id}`);
  broadcastWs(req.app, 'NEW_INCIDENT', newIncident);

  res.status(201).json({ success: true, data: newIncident });
});

// PUT /api/incidents/:id/status
// Handles workflow: NEW -> ACKNOWLEDGED -> RESCUE_TEAM_ASSIGNED -> RESCUE_IN_PROGRESS -> MINER_SAFE_RESOLVED -> CLOSED
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, assigned_team_id, user_name, role, notes, action_taken, summary_report } = req.body;

  const inc = db.getById('rescue_incidents', id);
  if (!inc) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  const updates = { status };

  if (assigned_team_id) {
    updates.assigned_team_id = assigned_team_id;
    const team = db.getById('rescue_teams', assigned_team_id);
    if (team) {
      updates.assigned_team_name = team.name;
      db.update('rescue_teams', team.id, {
        status: 'DISPATCHED',
        active_incident_id: id,
        assigned_zone_id: inc.zone_id
      });
    }
  }

  if (status === 'MINER_SAFE_RESOLVED') {
    // Set miners status to SAFE
    if (inc.affected_miners && inc.affected_miners.length > 0) {
      inc.affected_miners.forEach(minerId => {
        db.update('miners', minerId, {
          status: 'SAFE',
          vitals: {
            heart_rate: 78,
            spo2: 99,
            skin_temp_c: 36.6,
            motion_state: 'STABLE_EVACUATED',
            impact_g: 0.2,
            posture: 'SUPPORTED'
          }
        });
      });
    }
  }

  if (status === 'CLOSED') {
    updates.closed_at = new Date().toISOString();
    updates.summary_report = summary_report || 'Incident operations concluded. All personnel accounted for. Scene stabilized.';

    // Release assigned team
    if (inc.assigned_team_id) {
      db.update('rescue_teams', inc.assigned_team_id, {
        status: 'AVAILABLE',
        active_incident_id: null,
        assigned_zone_id: null
      });
    }

    // Resolve associated alert
    if (inc.alert_id) {
      db.update('alerts', inc.alert_id, {
        status: 'RESOLVED',
        resolved_by: user_name || 'Incident Commander',
        resolved_at: new Date().toISOString()
      });
    }
  }

  const updatedIncident = db.update('rescue_incidents', id, updates);

  // Add timeline entry
  const timelineEntry = {
    id: 'INC_UPD_' + Date.now().toString().slice(-6),
    incident_id: id,
    user_name: user_name || 'Rescue Team Lead',
    role: role || 'Rescue Lead',
    status_snapshot: status,
    notes: notes || `Workflow progressed to ${status}.`,
    action_taken: action_taken || `Incident status updated to ${status}.`,
    timestamp: new Date().toISOString()
  };
  db.insert('incident_updates', timelineEntry);

  db.addAudit(user_name || 'Commander', 'INCIDENT_STATUS_UPDATED', `Updated ${id} to ${status}`);
  broadcastWs(req.app, 'INCIDENT_UPDATED', updatedIncident);

  res.json({ success: true, data: updatedIncident, timeline: timelineEntry });
});

// POST /api/incidents/:id/updates - Append timeline log
router.post('/:id/updates', (req, res) => {
  const { id } = req.params;
  const { user_name, role, notes, action_taken } = req.body;

  const inc = db.getById('rescue_incidents', id);
  if (!inc) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  const timelineEntry = {
    id: 'INC_UPD_' + Date.now().toString().slice(-6),
    incident_id: id,
    user_name: user_name || 'Rescue Team',
    role: role || 'Field Operative',
    status_snapshot: inc.status,
    notes: notes || 'Field update logged.',
    action_taken: action_taken || 'Radio communication logged.',
    timestamp: new Date().toISOString()
  };

  db.insert('incident_updates', timelineEntry);
  broadcastWs(req.app, 'INCIDENT_LOG_ADDED', { incident_id: id, entry: timelineEntry });

  res.status(201).json({ success: true, data: timelineEntry });
});

// GET /api/rescue-teams
router.get('/rescue-teams/list', (req, res) => {
  res.json({ success: true, data: db.get('rescue_teams') });
});

// PUT /api/rescue-teams/:id
router.put('/rescue-teams/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.update('rescue_teams', id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Rescue team not found' });
  }
  res.json({ success: true, data: updated });
});

module.exports = router;
