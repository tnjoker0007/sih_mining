const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'mineguard_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialData() {
  return {
    roles: [
      { id: 'ROLE_ADMIN', role_name: 'Administrator', permissions: ['ALL'], description: 'Full system access, users, devices, mines, zones, configuration.' },
      { id: 'ROLE_OPERATOR', role_name: 'Control Room Operator', permissions: ['MONITOR_LIVE', 'ACK_ALERTS', 'BROADCAST_EMERGENCY', 'MANAGE_INCIDENTS'], description: 'Live monitoring, alerts, mine map, miner monitoring, emergency communication.' },
      { id: 'ROLE_RESCUE', role_name: 'Rescue Team', permissions: ['VIEW_INCIDENTS', 'UPDATE_INCIDENTS', 'VIEW_MINERS', 'DISPATCH_STATUS'], description: 'Active incidents, miner status, rescue updates and emergency coordination.' }
    ],
    users: [
      {
        id: 'USR_001',
        username: 'admin',
        password_hash: 'admin123',
        full_name: 'Chief Inspector Arthur Pendelton',
        role: 'Administrator',
        role_id: 'ROLE_ADMIN',
        email: 'admin@mineguard.ai',
        phone: '+1-800-555-0199',
        badge_id: 'BADGE-ADM-01',
        active: true,
        created_at: '2026-08-01T08:00:00.000Z'
      },
      {
        id: 'USR_002',
        username: 'operator',
        password_hash: 'operator123',
        full_name: 'Maya Lin (Lead Control Specialist)',
        role: 'Control Room Operator',
        role_id: 'ROLE_OPERATOR',
        email: 'operator@mineguard.ai',
        phone: '+1-800-555-0144',
        badge_id: 'BADGE-OPR-42',
        active: true,
        created_at: '2026-08-05T09:30:00.000Z'
      },
      {
        id: 'USR_003',
        username: 'rescue_lead',
        password_hash: 'rescue123',
        full_name: 'Capt. Gabriel Reyes (SAR Commander)',
        role: 'Rescue Team',
        role_id: 'ROLE_RESCUE',
        email: 'rescue@mineguard.ai',
        phone: '+1-800-555-0188',
        badge_id: 'BADGE-SAR-07',
        active: true,
        created_at: '2026-08-10T11:15:00.000Z'
      }
    ],
    mines: [
      {
        id: 'MINE_001',
        code: 'MINE_001',
        name: 'Apex Deep Horizon Complex',
        location: 'Sector 9, Northern Ridge Basin',
        total_depth_m: 680,
        status: 'OPERATIONAL',
        emergency_contact: '+1-800-MINE-911',
        active_shifts: 'Day Shift Alpha (06:00 - 18:00)',
        created_at: '2026-01-15T00:00:00.000Z'
      }
    ],
    mine_zones: [
      {
        id: 'ZONE_A',
        code: 'ZONE_A',
        mine_id: 'MINE_001',
        name: 'Shaft 1 - North Gallery',
        level_depth_m: 180,
        risk_level: 'SAFE',
        subsidence_velocity_mm_hr: 0.12,
        gas_ch4_ppm: 0.15,
        subsidence_threshold_mm: 5.0,
        gas_threshold_ppm: 1.25,
        max_capacity: 30,
        current_occupancy: 2,
        evacuation_route: 'Emergency Exit Stairwell A -> Portal 1',
        coordinates: { x: 140, y: 110, width: 220, height: 110, shape: 'rect' },
        status: 'ACTIVE'
      },
      {
        id: 'ZONE_B',
        code: 'ZONE_B',
        mine_id: 'MINE_001',
        name: 'Sub-level 350m Extraction Face',
        level_depth_m: 350,
        risk_level: 'WARNING',
        subsidence_velocity_mm_hr: 4.85,
        gas_ch4_ppm: 0.92,
        subsidence_threshold_mm: 5.0,
        gas_threshold_ppm: 1.25,
        max_capacity: 25,
        current_occupancy: 2,
        evacuation_route: 'Crosscut 4B -> Secondary Incline -> Refuge Bay 1',
        coordinates: { x: 420, y: 130, width: 240, height: 130, shape: 'rect' },
        status: 'ACTIVE'
      },
      {
        id: 'ZONE_C',
        code: 'ZONE_C',
        mine_id: 'MINE_001',
        name: 'Deep Shaft 2 - Conveyor Beltway',
        level_depth_m: 520,
        risk_level: 'SAFE',
        subsidence_velocity_mm_hr: 0.45,
        gas_ch4_ppm: 0.35,
        subsidence_threshold_mm: 5.0,
        gas_threshold_ppm: 1.25,
        max_capacity: 20,
        current_occupancy: 1,
        evacuation_route: 'Beltway Escape Rail -> Shaft 2 Cage Hoist',
        coordinates: { x: 130, y: 280, width: 240, height: 120, shape: 'rect' },
        status: 'ACTIVE'
      },
      {
        id: 'ZONE_D',
        code: 'ZONE_D',
        mine_id: 'MINE_001',
        name: 'Pillar Extraction Sector 4',
        level_depth_m: 640,
        risk_level: 'CRITICAL',
        subsidence_velocity_mm_hr: 12.8,
        gas_ch4_ppm: 1.85,
        subsidence_threshold_mm: 5.0,
        gas_threshold_ppm: 1.25,
        max_capacity: 15,
        current_occupancy: 1,
        evacuation_route: 'Emergency Winch Way -> Refuge Chamber 2',
        coordinates: { x: 430, y: 300, width: 250, height: 130, shape: 'rect' },
        status: 'ACTIVE'
      },
      {
        id: 'ZONE_E',
        code: 'ZONE_E',
        mine_id: 'MINE_001',
        name: 'Emergency Refuge Chamber 1 & 2',
        level_depth_m: 480,
        risk_level: 'SAFE',
        subsidence_velocity_mm_hr: 0.05,
        gas_ch4_ppm: 0.02,
        subsidence_threshold_mm: 2.0,
        gas_threshold_ppm: 0.5,
        max_capacity: 50,
        current_occupancy: 0,
        evacuation_route: 'Hermetic Air Lock -> Independent Borehole Escape System',
        coordinates: { x: 300, y: 210, width: 140, height: 80, shape: 'rect' },
        status: 'ACTIVE'
      }
    ],
    sensor_nodes: [
      {
        id: 'NODE_001',
        code: 'NODE_001',
        zone_id: 'ZONE_D',
        zone_name: 'Pillar Extraction Sector 4',
        type: 'SUBSIDENCE_RADAR',
        name: 'Multi-Frequency InSAR Displacement Node',
        status: 'CRITICAL',
        battery_pct: 88,
        signal_dbm: -64,
        last_reading: {
          displacement_rate_mm_hr: 12.8,
          cumulative_displacement_mm: 48.2,
          tilt_pitch_deg: 4.6,
          tilt_roll_deg: 3.8,
          timestamp: new Date().toISOString()
        },
        coordinates: { x: 500, y: 350 },
        last_seen: new Date().toISOString()
      },
      {
        id: 'NODE_002',
        code: 'NODE_002',
        zone_id: 'ZONE_B',
        zone_name: 'Sub-level 350m Extraction Face',
        type: 'TILTMETER_BOREHOLE',
        name: 'Borehole Tri-Axial Tiltmeter & Sag Sensor',
        status: 'WARNING',
        battery_pct: 94,
        signal_dbm: -58,
        last_reading: {
          tilt_pitch_deg: 2.9,
          tilt_roll_deg: 2.1,
          roof_sag_mm: 8.4,
          timestamp: new Date().toISOString()
        },
        coordinates: { x: 530, y: 180 },
        last_seen: new Date().toISOString()
      },
      {
        id: 'NODE_003',
        code: 'NODE_003',
        zone_id: 'ZONE_A',
        zone_name: 'Shaft 1 - North Gallery',
        type: 'ACOUSTIC_EMISSION',
        name: 'Micro-Seismic Acoustic Geophone Node',
        status: 'SAFE',
        battery_pct: 99,
        signal_dbm: -49,
        last_reading: {
          acoustic_event_count_min: 3,
          energy_joules: 140,
          dominant_freq_hz: 420,
          timestamp: new Date().toISOString()
        },
        coordinates: { x: 230, y: 160 },
        last_seen: new Date().toISOString()
      },
      {
        id: 'NODE_004',
        code: 'NODE_004',
        zone_id: 'ZONE_D',
        zone_name: 'Pillar Extraction Sector 4',
        type: 'GAS_CH4_CO',
        name: 'NDIR Methane & Carbon Monoxide Analyzer',
        status: 'CRITICAL',
        battery_pct: 79,
        signal_dbm: -72,
        last_reading: {
          ch4_pct: 1.85,
          co_ppm: 48,
          o2_pct: 19.1,
          temp_c: 32.4,
          timestamp: new Date().toISOString()
        },
        coordinates: { x: 600, y: 370 },
        last_seen: new Date().toISOString()
      },
      {
        id: 'NODE_005',
        code: 'NODE_005',
        zone_id: 'ZONE_C',
        zone_name: 'Deep Shaft 2 - Conveyor Beltway',
        type: 'PORE_PRESSURE',
        name: 'Hydrostatic Pore Pressure Piezometer',
        status: 'SAFE',
        battery_pct: 91,
        signal_dbm: -55,
        last_reading: {
          pressure_kpa: 310,
          water_table_depth_m: 48.6,
          timestamp: new Date().toISOString()
        },
        coordinates: { x: 240, y: 330 },
        last_seen: new Date().toISOString()
      },
      {
        id: 'NODE_006',
        code: 'NODE_006',
        zone_id: 'ZONE_B',
        zone_name: 'Sub-level 350m Extraction Face',
        type: 'OPTICAL_CRACK_METER',
        name: 'Laser Convergence Extensometer',
        status: 'WARNING',
        battery_pct: 85,
        signal_dbm: -61,
        last_reading: {
          crack_aperture_delta_mm: 3.2,
          convergence_rate_mm_day: 1.8,
          timestamp: new Date().toISOString()
        },
        coordinates: { x: 600, y: 200 },
        last_seen: new Date().toISOString()
      }
    ],
    miners: [
      {
        id: 'MINER_001',
        code: 'MINER_001',
        name: 'Dev Patel',
        role_title: 'Continuous Miner Operator Lead',
        zone_id: 'ZONE_D',
        zone_name: 'Pillar Extraction Sector 4',
        assigned_band_id: 'BAND_001',
        blood_group: 'O+',
        emergency_contact: 'Priya Patel (+1-555-321-7890)',
        status: 'FALL_DETECTED',
        vitals: {
          heart_rate: 138,
          spo2: 92,
          skin_temp_c: 37.8,
          motion_state: 'MOTIONLESS',
          impact_g: 5.4,
          posture: 'HORIZONTAL_PRONE'
        },
        coordinates: { x: 480, y: 360 },
        last_seen: new Date().toISOString()
      },
      {
        id: 'MINER_002',
        code: 'MINER_002',
        name: 'Alex Chen',
        role_title: 'Senior Blasting Engineer',
        zone_id: 'ZONE_B',
        zone_name: 'Sub-level 350m Extraction Face',
        assigned_band_id: 'BAND_002',
        blood_group: 'A+',
        emergency_contact: 'Mei Chen (+1-555-890-1234)',
        status: 'ACTIVE',
        vitals: {
          heart_rate: 88,
          spo2: 98,
          skin_temp_c: 36.6,
          motion_state: 'WALKING',
          impact_g: 0.9,
          posture: 'UPRIGHT'
        },
        coordinates: { x: 460, y: 180 },
        last_seen: new Date().toISOString()
      },
      {
        id: 'MINER_003',
        code: 'MINER_003',
        name: 'Marcus Vance',
        role_title: 'Shuttle Car Heavy Driver',
        zone_id: 'ZONE_B',
        zone_name: 'Sub-level 350m Extraction Face',
        assigned_band_id: 'BAND_003',
        blood_group: 'B+',
        emergency_contact: 'Donna Vance (+1-555-776-5544)',
        status: 'ACTIVE',
        vitals: {
          heart_rate: 82,
          spo2: 97,
          skin_temp_c: 36.5,
          motion_state: 'WORKING',
          impact_g: 1.1,
          posture: 'SEATED'
        },
        coordinates: { x: 570, y: 210 },
        last_seen: new Date().toISOString()
      },
      {
        id: 'MINER_004',
        code: 'MINER_004',
        name: 'Sarah Jenkins',
        role_title: 'Underground Ventilation Tech',
        zone_id: 'ZONE_A',
        zone_name: 'Shaft 1 - North Gallery',
        assigned_band_id: 'BAND_004',
        blood_group: 'AB-',
        emergency_contact: 'Tom Jenkins (+1-555-667-8899)',
        status: 'ACTIVE',
        vitals: {
          heart_rate: 76,
          spo2: 99,
          skin_temp_c: 36.4,
          motion_state: 'WALKING',
          impact_g: 0.8,
          posture: 'UPRIGHT'
        },
        coordinates: { x: 200, y: 150 },
        last_seen: new Date().toISOString()
      },
      {
        id: 'MINER_005',
        code: 'MINER_005',
        name: 'Elena Rostova',
        role_title: 'Geotechnical Strata Surveyor',
        zone_id: 'ZONE_A',
        zone_name: 'Shaft 1 - North Gallery',
        assigned_band_id: 'BAND_005',
        blood_group: 'O-',
        emergency_contact: 'Viktor Rostov (+1-555-443-2211)',
        status: 'ACTIVE',
        vitals: {
          heart_rate: 84,
          spo2: 98,
          skin_temp_c: 36.7,
          motion_state: 'SCANNING',
          impact_g: 0.9,
          posture: 'UPRIGHT'
        },
        coordinates: { x: 300, y: 170 },
        last_seen: new Date().toISOString()
      },
      {
        id: 'MINER_006',
        code: 'MINER_006',
        name: 'Vikram Rao',
        role_title: 'High-Voltage Mine Electrician',
        zone_id: 'ZONE_C',
        zone_name: 'Deep Shaft 2 - Conveyor Beltway',
        assigned_band_id: 'BAND_006',
        blood_group: 'B-',
        emergency_contact: 'Ananya Rao (+1-555-112-3344)',
        status: 'ACTIVE',
        vitals: {
          heart_rate: 79,
          spo2: 98,
          skin_temp_c: 36.5,
          motion_state: 'STANDING',
          impact_g: 0.7,
          posture: 'UPRIGHT'
        },
        coordinates: { x: 200, y: 330 },
        last_seen: new Date().toISOString()
      }
    ],
    smart_bands: [
      { id: 'BAND_001', code: 'BAND_001', miner_id: 'MINER_001', miner_name: 'Dev Patel', battery_pct: 74, signal_strength: 'MEDIUM (-78 dBm)', firmware_version: 'v2.4.1-PRO', status: 'WARNING', last_sync: new Date().toISOString(), last_broadcast_received: 'EVACUATE_STANDBY' },
      { id: 'BAND_002', code: 'BAND_002', miner_id: 'MINER_002', miner_name: 'Alex Chen', battery_pct: 92, signal_strength: 'STRONG (-58 dBm)', firmware_version: 'v2.4.1-PRO', status: 'ONLINE', last_sync: new Date().toISOString(), last_broadcast_received: null },
      { id: 'BAND_003', code: 'BAND_003', miner_id: 'MINER_003', miner_name: 'Marcus Vance', battery_pct: 88, signal_strength: 'STRONG (-62 dBm)', firmware_version: 'v2.4.1-PRO', status: 'ONLINE', last_sync: new Date().toISOString(), last_broadcast_received: null },
      { id: 'BAND_004', code: 'BAND_004', miner_id: 'MINER_004', miner_name: 'Sarah Jenkins', battery_pct: 96, signal_strength: 'STRONG (-52 dBm)', firmware_version: 'v2.4.1-PRO', status: 'ONLINE', last_sync: new Date().toISOString(), last_broadcast_received: null },
      { id: 'BAND_005', code: 'BAND_005', miner_id: 'MINER_005', miner_name: 'Elena Rostova', battery_pct: 85, signal_strength: 'STRONG (-55 dBm)', firmware_version: 'v2.4.1-PRO', status: 'ONLINE', last_sync: new Date().toISOString(), last_broadcast_received: null },
      { id: 'BAND_006', code: 'BAND_006', miner_id: 'MINER_006', miner_name: 'Vikram Rao', battery_pct: 90, signal_strength: 'STRONG (-60 dBm)', firmware_version: 'v2.4.1-PRO', status: 'ONLINE', last_sync: new Date().toISOString(), last_broadcast_received: null }
    ],
    alerts: [
      {
        id: 'ALERT_001',
        code: 'ALERT_001',
        source: 'MODULE_1_AI',
        severity: 'CRITICAL',
        status: 'IN_PROGRESS',
        title: 'AI Subsidence Early Warning: Accelerated Strata Creep & Roof Sag',
        description: 'Module 1 LSTM-InSAR model predicts imminent ceiling failure within 42 minutes. Velocity: 12.8 mm/hr (threshold: 5.0 mm/hr).',
        zone_id: 'ZONE_D',
        zone_name: 'Pillar Extraction Sector 4',
        node_id: 'NODE_001',
        miner_id: 'MINER_001',
        ai_confidence: 94.8,
        data_payload: {
          subsidence_velocity_mm_hr: 12.8,
          time_to_collapse_est_mins: 42,
          affected_area_sqm: 450,
          model_name: 'MineGuard-StrataNet-v3.1'
        },
        acknowledged_by: 'Maya Lin (Lead Control Specialist)',
        acknowledged_at: new Date(Date.now() - 15 * 60000).toISOString(),
        resolved_by: null,
        resolved_at: null,
        created_at: new Date(Date.now() - 25 * 60000).toISOString()
      },
      {
        id: 'ALERT_002',
        code: 'ALERT_002',
        source: 'MODULE_2_BAND',
        severity: 'CRITICAL',
        status: 'NEW',
        title: 'Miner Fall & High-G Impact Detected on Smart Band',
        description: 'Smart Band BAND_001 detected 5.4G sudden impact followed by complete immobility for >180s. Heart rate elevated (138 bpm).',
        zone_id: 'ZONE_D',
        zone_name: 'Pillar Extraction Sector 4',
        node_id: 'NODE_004',
        miner_id: 'MINER_001',
        miner_name: 'Dev Patel',
        ai_confidence: 98.2,
        data_payload: {
          impact_g: 5.4,
          immobile_duration_sec: 210,
          heart_rate: 138,
          spo2: 92,
          orientation: 'PRONE'
        },
        acknowledged_by: null,
        acknowledged_at: null,
        resolved_by: null,
        resolved_at: null,
        created_at: new Date(Date.now() - 8 * 60000).toISOString()
      },
      {
        id: 'ALERT_003',
        code: 'ALERT_003',
        source: 'MODULE_1_AI',
        severity: 'WARNING',
        status: 'ACKNOWLEDGED',
        title: 'Micro-Seismic Fracture Density Exceeded Warning Threshold',
        description: 'Sub-level 350m acoustic emission array recorded 42 high-frequency energy releases within 10 minutes.',
        zone_id: 'ZONE_B',
        zone_name: 'Sub-level 350m Extraction Face',
        node_id: 'NODE_002',
        miner_id: null,
        ai_confidence: 88.5,
        data_payload: {
          event_rate_per_min: 4.2,
          b_value_reduction: 0.35,
          crack_propagation_vector: 'North-East 34 deg'
        },
        acknowledged_by: 'Maya Lin (Lead Control Specialist)',
        acknowledged_at: new Date(Date.now() - 40 * 60000).toISOString(),
        resolved_by: null,
        resolved_at: null,
        created_at: new Date(Date.now() - 55 * 60000).toISOString()
      },
      {
        id: 'ALERT_004',
        code: 'ALERT_004',
        source: 'SENSOR_NODE',
        severity: 'INFO',
        status: 'RESOLVED',
        title: 'Conveyor Beltway Ventilation Airflow Stabilized',
        description: 'Auxiliary booster fan #3 restored nominal differential pressure at Shaft 2 intake.',
        zone_id: 'ZONE_C',
        zone_name: 'Deep Shaft 2 - Conveyor Beltway',
        node_id: 'NODE_005',
        miner_id: null,
        ai_confidence: 99.0,
        data_payload: {
          airflow_m3_s: 48.5,
          differential_pa: 120
        },
        acknowledged_by: 'Arthur Pendelton',
        acknowledged_at: new Date(Date.now() - 180 * 60000).toISOString(),
        resolved_by: 'Arthur Pendelton',
        resolved_at: new Date(Date.now() - 120 * 60000).toISOString(),
        created_at: new Date(Date.now() - 240 * 60000).toISOString()
      }
    ],
    alert_history: [
      {
        id: 'AH_001',
        alert_id: 'ALERT_001',
        action: 'AI_INGESTION',
        changed_by: 'System: Module 1 AI InSAR Core',
        notes: 'Risk score calculated at 94.8% probability. Subsidence threshold breached.',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString()
      },
      {
        id: 'AH_002',
        alert_id: 'ALERT_001',
        action: 'ACKNOWLEDGED',
        changed_by: 'Maya Lin',
        notes: 'Operator verified InSAR reading with geotechnical node NODE_001. Initiated incident INCIDENT_001.',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString()
      },
      {
        id: 'AH_003',
        alert_id: 'ALERT_002',
        action: 'BAND_SOS_INGESTION',
        changed_by: 'System: Module 2 Band Gateway',
        notes: 'High-G fall event telemetry received from BAND_001 (Dev Patel). Audio buzzer queued.',
        timestamp: new Date(Date.now() - 8 * 60000).toISOString()
      }
    ],
    rescue_teams: [
      {
        id: 'RESCUE_01',
        code: 'RESCUE_01',
        name: 'Alpha Strike Tactical Extraction Squad',
        lead_user_name: 'Capt. Gabriel Reyes',
        team_size: 6,
        specialization: 'HEAVY_EXTRACTION & STRATA COLLAPSE',
        status: 'DISPATCHED',
        active_incident_id: 'INCIDENT_001',
        assigned_zone_id: 'ZONE_D',
        equipment: ['Hydraulic Spreader Set', 'Self-Contained Breathing Apparatus (4hr SCBA)', 'Thermal Imaging Camera', 'Mobile Geophone Sniffer', 'Kevlar Extraction Litter'],
        eta_minutes: 12,
        last_radio_check: 'Radio Signal Solid at Level 4 Transit Point'
      },
      {
        id: 'RESCUE_02',
        code: 'RESCUE_02',
        name: 'Bravo Medic & Hazmat Trauma Unit',
        lead_user_name: 'Dr. Evelyn Ward',
        team_size: 4,
        specialization: 'PARAMEDIC_TRAUMA & HAZMAT_GAS',
        status: 'STANDBY',
        active_incident_id: null,
        assigned_zone_id: null,
        equipment: ['Advanced Portable Defibrillator', 'Multi-Gas Scrubber Masks', 'Blood Infusion Kits', 'Pressurized Oxygen Tents'],
        eta_minutes: 0,
        last_radio_check: 'Stationed at Surface Medical Staging Bay'
      },
      {
        id: 'RESCUE_03',
        code: 'RESCUE_03',
        name: 'Charlie Underground Search & Drone Recon',
        lead_user_name: 'Lt. Tariq Al-Mansoor',
        team_size: 5,
        specialization: 'RAPID_RESPONSE & MINE_UAV_RECON',
        status: 'AVAILABLE',
        active_incident_id: null,
        assigned_zone_id: null,
        equipment: ['Autonomous LiDAR Quadcopters', 'Borehole Inspection Snakes', 'Fibre-Optic Communication Spools'],
        eta_minutes: 0,
        last_radio_check: 'Ready in Central Equipment Armory'
      }
    ],
    rescue_incidents: [
      {
        id: 'INCIDENT_001',
        code: 'INCIDENT_001',
        alert_id: 'ALERT_001',
        title: 'Sector 4 Strata Instability & Miner Trapped Incident',
        zone_id: 'ZONE_D',
        zone_name: 'Pillar Extraction Sector 4',
        severity: 'CRITICAL',
        status: 'RESCUE_IN_PROGRESS',
        assigned_team_id: 'RESCUE_01',
        assigned_team_name: 'Alpha Strike Tactical Extraction Squad',
        affected_miners: ['MINER_001'],
        affected_miners_count: 1,
        incident_lead: 'Capt. Gabriel Reyes',
        created_at: new Date(Date.now() - 20 * 60000).toISOString(),
        closed_at: null,
        summary_report: null,
        evacuation_order_issued: true
      }
    ],
    incident_updates: [
      {
        id: 'INC_UPD_001',
        incident_id: 'INCIDENT_001',
        user_name: 'Maya Lin',
        role: 'Control Room Operator',
        status_snapshot: 'NEW',
        notes: 'Incident initiated following correlation between Module 1 AI Subsidence model and Module 2 fall alert for Dev Patel.',
        action_taken: 'Declared Level 2 Underground Emergency. Alerted SAR Command.',
        timestamp: new Date(Date.now() - 20 * 60000).toISOString()
      },
      {
        id: 'INC_UPD_002',
        incident_id: 'INCIDENT_001',
        user_name: 'Capt. Gabriel Reyes',
        role: 'Rescue Team Lead',
        status_snapshot: 'RESCUE_TEAM_ASSIGNED',
        notes: 'Alpha Strike team mustered with heavy hydraulic equipment and long-duration SCBA gear.',
        action_taken: 'Assigned Rescue Team RESCUE_01. Team briefed on Zone D structural weaknesses.',
        timestamp: new Date(Date.now() - 14 * 60000).toISOString()
      },
      {
        id: 'INC_UPD_003',
        incident_id: 'INCIDENT_001',
        user_name: 'Capt. Gabriel Reyes',
        role: 'Rescue Team Lead',
        status_snapshot: 'RESCUE_IN_PROGRESS',
        notes: 'Rescue Team entered Sector 4 via secondary shaft bypass. Radio contact established with trapped miner beacon.',
        action_taken: 'Deploying laser rangefinders to confirm roof stability before litter extraction.',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString()
      }
    ],
    band_broadcasts: [
      {
        id: 'BCAST_001',
        sender_name: 'Control Room (Maya Lin)',
        target_type: 'ZONE',
        target_id: 'ZONE_D',
        target_name: 'Pillar Extraction Sector 4',
        alert_level: 'EMERGENCY_EVACUATE',
        message: 'CRITICAL ALERT: ROOF INSTABILITY DETECTED. CEASE WORK AND EVACUATE TO REFUGE CHAMBER 2 IMMEDIATELY.',
        vibrate_pattern: 'CONTINUOUS_HIGH_FREQUENCY',
        audio_siren: true,
        sent_to_bands: ['BAND_001'],
        acknowledged_bands: [],
        timestamp: new Date(Date.now() - 18 * 60000).toISOString()
      }
    ],
    report_metadata: [
      {
        id: 'REP_001',
        report_type: 'SUBSIDENCE_PREDICTION',
        title: 'Weekly Module 1 InSAR & Strata Subsidence Correlation Report',
        generated_by: 'Arthur Pendelton',
        date_from: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
        summary: 'Detected localized subsidence anomalies in Sector 4 and Sub-level 350m. Recommended immediate pillar bolting reinforcement.',
        file_name: 'MineGuard_Subsidence_Report_2026_W34.pdf',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'REP_002',
        report_type: 'MINER_SAFETY_AUDIT',
        title: 'Module 2 Smart Band Safety & Biometric Incident Log',
        generated_by: 'Maya Lin',
        date_from: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
        summary: 'Total underground hours: 1,840. Fall events: 1. SOS events: 0. Average battery compliance: 96.4%.',
        file_name: 'MineGuard_Miner_Safety_Audit_2026.pdf',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString()
      }
    ],
    system_settings: {
      mine_id: 'MINE_001',
      auto_escalate_critical_alerts: true,
      audio_alarm_enabled: true,
      audio_alarm_volume: 80,
      module_1_webhook_url: 'http://localhost:5000/api/alerts/ai',
      module_2_webhook_url: 'http://localhost:5000/api/alerts/miner',
      telemetry_poll_interval_sec: 3,
      ai_confidence_threshold_pct: 85,
      emergency_broadcast_repeat_sec: 15,
      evacuation_siren_waveform: 'PULSED_SWEEP'
    },
    audit_logs: [
      {
        id: 'AUD_001',
        user_name: 'Arthur Pendelton',
        action: 'SYSTEM_CONFIG_UPDATE',
        details: 'Updated subsidence alert velocity threshold to 5.0 mm/hr for ZONE_D.',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString()
      },
      {
        id: 'AUD_002',
        user_name: 'Maya Lin',
        action: 'EMERGENCY_BROADCAST_TRIGGERED',
        details: 'Broadcast emergency evacuation signal to BAND_001 in ZONE_D.',
        timestamp: new Date(Date.now() - 18 * 60000).toISOString()
      }
    ]
  };
}

class Database {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.data = getInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error loading database, resetting to initial data:', err);
      this.data = getInitialData();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing to database:', err);
    }
  }

  reset() {
    this.data = getInitialData();
    this.save();
    return this.data;
  }

  get(collection) {
    return this.data[collection] || [];
  }

  getById(collection, id) {
    const list = this.get(collection);
    return list.find(item => item.id === id || item.code === id);
  }

  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    this.data[collection].unshift(item);
    this.save();
    return item;
  }

  update(collection, id, updates) {
    const list = this.get(collection);
    const index = list.findIndex(item => item.id === id || item.code === id);
    if (index !== -1) {
      this.data[collection][index] = { ...this.data[collection][index], ...updates };
      this.save();
      return this.data[collection][index];
    }
    return null;
  }

  delete(collection, id) {
    const list = this.get(collection);
    const index = list.findIndex(item => item.id === id || item.code === id);
    if (index !== -1) {
      const removed = this.data[collection].splice(index, 1);
      this.save();
      return removed[0];
    }
    return null;
  }

  getSettings() {
    return this.data.system_settings || {};
  }

  updateSettings(updates) {
    this.data.system_settings = { ...this.data.system_settings, ...updates };
    this.save();
    return this.data.system_settings;
  }

  addAudit(userName, action, details) {
    const auditItem = {
      id: 'AUD_' + Date.now().toString().slice(-6),
      user_name: userName || 'System',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.insert('audit_logs', auditItem);
    return auditItem;
  }
}

const db = new Database();
module.exports = db;
