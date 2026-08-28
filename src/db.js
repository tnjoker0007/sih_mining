const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to load/save JSON files
function loadJSON(filename, defaultData = []) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading database file ${filename}:`, err);
    return defaultData;
  }
}

function saveJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving database file ${filename}:`, err);
  }
}

// Initial Seed Data
const initialMiners = [
  { miner_id: "MINER_001", name: "John Doe", employee_id: "EMP101", mine_id: "MINE_001", zone_id: "ZONE_A", status: "SAFE", phone: "+1 555-0101", email: "j.doe@mineguard.com" },
  { miner_id: "MINER_002", name: "Sarah Connor", employee_id: "EMP102", mine_id: "MINE_001", zone_id: "ZONE_B", status: "SAFE", phone: "+1 555-0102", email: "s.connor@mineguard.com" },
  { miner_id: "MINER_003", name: "Marcus Aurelius", employee_id: "EMP103", mine_id: "MINE_001", zone_id: "ZONE_A", status: "SAFE", phone: "+1 555-0103", email: "m.aurelius@mineguard.com" },
  { miner_id: "MINER_004", name: "Bruce Wayne", employee_id: "EMP104", mine_id: "MINE_001", zone_id: "ZONE_C", status: "SAFE", phone: "+1 555-0104", email: "b.wayne@mineguard.com" },
  { miner_id: "MINER_005", name: "Tony Stark", employee_id: "EMP105", mine_id: "MINE_001", zone_id: "ZONE_B", status: "SAFE", phone: "+1 555-0105", email: "t.stark@mineguard.com" }
];

const initialBands = [
  { band_id: "BAND_001", lora_id: "LORA_101", miner_id: "MINER_001", battery_level: 85, signal_strength: 92, online: true, last_active: new Date().toISOString() },
  { band_id: "BAND_002", lora_id: "LORA_102", miner_id: "MINER_002", battery_level: 94, signal_strength: 88, online: true, last_active: new Date().toISOString() },
  { band_id: "BAND_003", lora_id: "LORA_103", miner_id: "MINER_003", battery_level: 12, signal_strength: 76, online: true, last_active: new Date().toISOString() },
  { band_id: "BAND_004", lora_id: "LORA_104", miner_id: null, battery_level: 100, signal_strength: 0, online: false, last_active: new Date().toISOString() },
  { band_id: "BAND_005", lora_id: "LORA_105", miner_id: "MINER_005", battery_level: 62, signal_strength: 81, online: true, last_active: new Date().toISOString() }
];

// Initialize collections
let miners = loadJSON('miners.json', initialMiners);
let bands = loadJSON('smart_bands.json', initialBands);
let sosEvents = loadJSON('sos_events.json', []);
let fallEvents = loadJSON('fall_events.json', []);
let messages = loadJSON('messages.json', []);
let telemetryLogs = loadJSON('telemetry_logs.json', []);

// Database Methods
const db = {
  miners: {
    all: () => miners,
    find: (id) => miners.find(m => m.miner_id === id),
    insert: (data) => {
      miners.push(data);
      saveJSON('miners.json', miners);
      return data;
    },
    update: (id, data) => {
      const idx = miners.findIndex(m => m.miner_id === id);
      if (idx !== -1) {
        miners[idx] = { ...miners[idx], ...data };
        saveJSON('miners.json', miners);
        return miners[idx];
      }
      return null;
    },
    delete: (id) => {
      const idx = miners.findIndex(m => m.miner_id === id);
      if (idx !== -1) {
        const deleted = miners.splice(idx, 1)[0];
        saveJSON('miners.json', miners);
        return deleted;
      }
      return null;
    }
  },

  bands: {
    all: () => bands,
    find: (id) => bands.find(b => b.band_id === id),
    findByMiner: (minerId) => bands.find(b => b.miner_id === minerId),
    insert: (data) => {
      bands.push(data);
      saveJSON('smart_bands.json', bands);
      return data;
    },
    update: (id, data) => {
      const idx = bands.findIndex(b => b.band_id === id);
      if (idx !== -1) {
        bands[idx] = { ...bands[idx], ...data };
        saveJSON('smart_bands.json', bands);
        return bands[idx];
      }
      return null;
    },
    pair: (bandId, minerId) => {
      // First unassign any band assigned to this miner
      if (minerId) {
        bands.forEach(b => {
          if (b.miner_id === minerId) {
            b.miner_id = null;
          }
        });
      }
      // Unassign miner from other bands if assigning a band
      const idx = bands.findIndex(b => b.band_id === bandId);
      if (idx !== -1) {
        bands[idx].miner_id = minerId;
        saveJSON('smart_bands.json', bands);
        return bands[idx];
      }
      return null;
    }
  },

  sos: {
    all: () => sosEvents,
    active: () => sosEvents.filter(e => e.status !== 'RESOLVED'),
    find: (id) => sosEvents.find(e => e.id === id),
    insert: (data) => {
      const newEvent = {
        id: `SOS_${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
        ...data
      };
      sosEvents.push(newEvent);
      saveJSON('sos_events.json', sosEvents);
      
      // Update miner status
      if (data.miner_id) {
        db.miners.update(data.miner_id, { status: 'SOS' });
      }
      return newEvent;
    },
    acknowledge: (id, user) => {
      const idx = sosEvents.findIndex(e => e.id === id);
      if (idx !== -1) {
        sosEvents[idx].status = 'ACKNOWLEDGED';
        sosEvents[idx].acknowledged_by = user || 'CONTROL_ROOM';
        sosEvents[idx].acknowledged_at = new Date().toISOString();
        saveJSON('sos_events.json', sosEvents);
        
        // Update miner status to WARNING if acknowledged, meaning attention is being given
        if (sosEvents[idx].miner_id) {
          db.miners.update(sosEvents[idx].miner_id, { status: 'WARNING' });
        }
        return sosEvents[idx];
      }
      return null;
    },
    resolve: (id) => {
      const idx = sosEvents.findIndex(e => e.id === id);
      if (idx !== -1) {
        sosEvents[idx].status = 'RESOLVED';
        sosEvents[idx].resolved_at = new Date().toISOString();
        saveJSON('sos_events.json', sosEvents);
        
        // Update miner status back to SAFE
        if (sosEvents[idx].miner_id) {
          db.miners.update(sosEvents[idx].miner_id, { status: 'SAFE' });
        }
        return sosEvents[idx];
      }
      return null;
    }
  },

  falls: {
    all: () => fallEvents,
    insert: (data) => {
      const newEvent = {
        id: `FALL_${Date.now()}`,
        timestamp: new Date().toISOString(),
        cancellation_status: 'PENDING',
        ...data
      };
      fallEvents.push(newEvent);
      saveJSON('fall_events.json', fallEvents);
      
      // Update miner status to WARNING when potential fall is pending
      if (data.miner_id && newEvent.cancellation_status === 'PENDING') {
        db.miners.update(data.miner_id, { status: 'WARNING' });
      }
      return newEvent;
    },
    updateStatus: (id, status) => {
      const idx = fallEvents.findIndex(e => e.id === id);
      if (idx !== -1) {
        fallEvents[idx].cancellation_status = status;
        saveJSON('fall_events.json', fallEvents);
        
        const minerId = fallEvents[idx].miner_id;
        if (minerId) {
          if (status === 'CANCELLED') {
            db.miners.update(minerId, { status: 'SAFE' });
          } else if (status === 'SOS_TRIGGERED') {
            db.miners.update(minerId, { status: 'SOS' });
            // Add automatic SOS event
            db.sos.insert({
              miner_id: minerId,
              band_id: fallEvents[idx].band_id,
              zone_id: fallEvents[idx].zone_id || 'UNKNOWN',
              source: 'FALL_DETECTION_AUTO',
              details: `Auto-SOS triggered by fall event ${id} (no cancellation received)`
            });
          }
        }
        return fallEvents[idx];
      }
      return null;
    }
  },

  messages: {
    all: () => messages,
    insert: (data) => {
      const newMsg = {
        id: `MSG_${Date.now()}`,
        timestamp: new Date().toISOString(),
        severity: data.severity || 'INFO', // INFO, WARNING, CRITICAL
        ...data
      };
      messages.push(newMsg);
      saveJSON('messages.json', messages);
      return newMsg;
    }
  },

  telemetry: {
    all: () => telemetryLogs,
    forBand: (bandId) => telemetryLogs.filter(t => t.band_id === bandId).slice(-50), // last 50 entries
    log: (data) => {
      const logEntry = {
        id: `TEL_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...data
      };
      
      // Add to array, keep only last 1000 items in telemetry history to avoid inflating JSON size
      telemetryLogs.push(logEntry);
      if (telemetryLogs.length > 1000) {
        telemetryLogs.shift();
      }
      saveJSON('telemetry_logs.json', telemetryLogs);
      
      // Update the band status details
      db.bands.update(data.band_id, {
        battery_level: data.battery,
        signal_strength: data.signal_strength,
        last_active: new Date().toISOString(),
        online: true
      });

      return logEntry;
    }
  }
};

module.exports = db;
