const db = require('./db');

class TelemetrySimulator {
  constructor(app) {
    this.app = app;
    this.isRunning = true;
    this.timer = null;
    this.scenario = 'NORMAL'; // NORMAL, SUBSIDENCE_SURGE, GAS_EMERGENCY, MINER_SOS
  }

  broadcast(eventType, payload) {
    if (this.app.get('wss')) {
      const wss = this.app.get('wss');
      const msg = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
      wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(msg);
      });
    }
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 3500);
    console.log('[Simulator] Real-Time Telemetry & IoT stream initialized (interval 3.5s)');
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  tick() {
    // 1. Update Miner vitals & coordinates slightly to simulate natural movement
    const miners = db.get('miners');
    miners.forEach(miner => {
      if (miner.status === 'ACTIVE') {
        const hrDelta = Math.floor(Math.random() * 5) - 2;
        const newHr = Math.max(60, Math.min(125, (miner.vitals.heart_rate || 75) + hrDelta));
        const spo2Delta = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const newSpo2 = Math.max(94, Math.min(100, (miner.vitals.spo2 || 98) + spo2Delta));

        // Slight micro-walking coordinate drift within zone
        const dx = (Math.random() * 4 - 2);
        const dy = (Math.random() * 4 - 2);

        db.update('miners', miner.id, {
          vitals: {
            ...miner.vitals,
            heart_rate: newHr,
            spo2: newSpo2,
            motion_state: miner.vitals.motion_state || 'WORKING'
          },
          coordinates: {
            x: Math.max(80, Math.min(750, (miner.coordinates.x || 200) + dx)),
            y: Math.max(80, Math.min(480, (miner.coordinates.y || 200) + dy))
          },
          last_seen: new Date().toISOString()
        });
      }
    });

    // 2. Update Sensor Nodes
    const nodes = db.get('sensor_nodes');
    nodes.forEach(node => {
      if (node.status === 'SAFE') {
        const drift = (Math.random() * 0.04 - 0.02);
        const rate = Math.max(0.01, (node.last_reading.displacement_rate_mm_hr || 0.1) + drift);
        db.update('sensor_nodes', node.id, {
          last_reading: {
            ...node.last_reading,
            displacement_rate_mm_hr: Number(rate.toFixed(2)),
            timestamp: new Date().toISOString()
          },
          last_seen: new Date().toISOString()
        });
      }
    });

    // Broadcast live telemetry update tick to connected UI clients
    this.broadcast('TELEMETRY_TICK', {
      miners: db.get('miners'),
      sensor_nodes: db.get('sensor_nodes'),
      mine_zones: db.get('mine_zones'),
      timestamp: new Date().toISOString()
    });
  }

  triggerScenario(scenarioType) {
    this.scenario = scenarioType;
    console.log(`[Simulator] Triggering Scenario: ${scenarioType}`);

    if (scenarioType === 'SUBSIDENCE_SURGE') {
      // Zone D critical spike
      const zoneD = db.getById('mine_zones', 'ZONE_D');
      db.update('mine_zones', 'ZONE_D', {
        risk_level: 'CRITICAL',
        subsidence_velocity_mm_hr: 16.4,
        gas_ch4_ppm: 2.1
      });

      // Update Node 1 & 4
      db.update('sensor_nodes', 'NODE_001', {
        status: 'CRITICAL',
        last_reading: {
          displacement_rate_mm_hr: 16.4,
          cumulative_displacement_mm: 58.6,
          tilt_pitch_deg: 5.8,
          tilt_roll_deg: 4.9,
          timestamp: new Date().toISOString()
        }
      });

      // Ingest AI Alert
      const alertId = `ALERT_${(db.get('alerts').length + 1).toString().padStart(3, '0')}`;
      const newAlert = {
        id: alertId,
        code: alertId,
        source: 'MODULE_1_AI',
        severity: 'CRITICAL',
        status: 'NEW',
        title: '🚨 CRITICAL STRATA SUBSIDENCE: Sector 4 Roof Velocity Surge',
        description: 'Module 1 LSTM InSAR engine detected anomalous strata velocity of 16.4 mm/hr. Estimated structural failure window: <28 minutes.',
        zone_id: 'ZONE_D',
        zone_name: 'Pillar Extraction Sector 4',
        node_id: 'NODE_001',
        miner_id: null,
        ai_confidence: 97.4,
        data_payload: {
          subsidence_velocity_mm_hr: 16.4,
          collapse_risk_score: 0.94,
          predicted_time_to_failure_min: 28,
          ai_model: 'MineGuard-StrataNet-v3.2'
        },
        acknowledged_by: null,
        acknowledged_at: null,
        resolved_by: null,
        resolved_at: null,
        created_at: new Date().toISOString()
      };
      db.insert('alerts', newAlert);
      this.broadcast('NEW_ALERT', newAlert);
    } 
    else if (scenarioType === 'MINER_SOS') {
      const miner = db.getById('miners', 'MINER_002');
      if (miner) {
        db.update('miners', miner.id, {
          status: 'SOS',
          vitals: {
            heart_rate: 146,
            spo2: 91,
            skin_temp_c: 38.1,
            motion_state: 'DISTRESS_ACTIVE',
            impact_g: 3.8,
            posture: 'CROUCHED'
          }
        });

        const alertId = `ALERT_${(db.get('alerts').length + 1).toString().padStart(3, '0')}`;
        const newAlert = {
          id: alertId,
          code: alertId,
          source: 'MODULE_2_BAND',
          severity: 'CRITICAL',
          status: 'NEW',
          title: `🚨 EMERGENCY SOS: ${miner.name} in Sub-level 350m`,
          description: `Smart Band ${miner.assigned_band_id} activated physical SOS trigger. Miner reports sudden rockfall and pinned leg.`,
          zone_id: miner.zone_id,
          zone_name: 'Sub-level 350m Extraction Face',
          node_id: 'NODE_002',
          miner_id: miner.id,
          miner_name: miner.name,
          ai_confidence: 99.9,
          data_payload: {
            event: 'MANUAL_SOS_BUTTON',
            band_id: miner.assigned_band_id,
            battery: 89,
            heart_rate: 146
          },
          acknowledged_by: null,
          acknowledged_at: null,
          resolved_by: null,
          resolved_at: null,
          created_at: new Date().toISOString()
        };
        db.insert('alerts', newAlert);
        this.broadcast('NEW_ALERT', newAlert);
      }
    }
    else if (scenarioType === 'GAS_SPIKE') {
      db.update('sensor_nodes', 'NODE_004', {
        status: 'CRITICAL',
        last_reading: {
          ch4_pct: 2.85,
          co_ppm: 95,
          o2_pct: 17.4,
          temp_c: 35.8,
          timestamp: new Date().toISOString()
        }
      });
      const alertId = `ALERT_${(db.get('alerts').length + 1).toString().padStart(3, '0')}`;
      const newAlert = {
        id: alertId,
        code: alertId,
        source: 'MODULE_1_AI',
        severity: 'CRITICAL',
        status: 'NEW',
        title: '⚠️ METHANE & CARBON MONOXIDE SPIKE DETECTED',
        description: 'Zone D gas sensors reached 2.85% CH4 (LEL exceeded) and 95 ppm CO. Explosive atmosphere risk elevated.',
        zone_id: 'ZONE_D',
        zone_name: 'Pillar Extraction Sector 4',
        node_id: 'NODE_004',
        miner_id: null,
        ai_confidence: 99.5,
        data_payload: { ch4_pct: 2.85, co_ppm: 95, threshold_limit: 1.25 },
        acknowledged_by: null,
        acknowledged_at: null,
        resolved_by: null,
        resolved_at: null,
        created_at: new Date().toISOString()
      };
      db.insert('alerts', newAlert);
      this.broadcast('NEW_ALERT', newAlert);
    }
    else if (scenarioType === 'RESET') {
      db.reset();
      this.broadcast('SYSTEM_RESET', { message: 'Database reset to initial demo state' });
    }

    this.tick();
    return { success: true, scenario: scenarioType };
  }
}

module.exports = TelemetrySimulator;
