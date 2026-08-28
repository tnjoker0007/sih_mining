// App State
let miners = [];
let bands = [];
let activeSosEvents = [];
let fallEvents = [];
let messages = [];

let currentSimBandId = null;
let telemetryInterval = null;
let fallCountdownInterval = null;
let fallCountdownVal = 0;
let activeFallEventId = null;
let accelChart = null;

let selectedMinerId = null;

// Web Audio API siren & buzzer
let audioCtx = null;
let sirenOscillator1 = null;
let sirenOscillator2 = null;
let sirenGainNode = null;
let sirenInterval = null;
let isSirenPlaying = false;
let isSirenMuted = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initSSE();
  startClock();
  initChart();
});

// Start clock in device simulator
function startClock() {
  setInterval(() => {
    const timeEl = document.getElementById('screen-time');
    if (timeEl) {
      const now = new Date();
      let hrs = now.getHours().toString().padStart(2, '0');
      let mins = now.getMinutes().toString().padStart(2, '0');
      timeEl.innerText = `${hrs}:${mins}`;
    }
  }, 1000);
}

// Chart.js Accelerometer graph initialization
function initChart() {
  const canvas = document.getElementById('accel-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  accelChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array(20).fill(''),
      datasets: [
        {
          label: 'X Accel',
          borderColor: '#00f2fe',
          borderWidth: 1.5,
          data: Array(20).fill(0),
          fill: false,
          pointRadius: 0,
          tension: 0.2
        },
        {
          label: 'Y Accel',
          borderColor: '#f76b1c',
          borderWidth: 1.5,
          data: Array(20).fill(0),
          fill: false,
          pointRadius: 0,
          tension: 0.2
        },
        {
          label: 'Z Accel',
          borderColor: '#39ff14',
          borderWidth: 1.5,
          data: Array(20).fill(9.8),
          fill: false,
          pointRadius: 0,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: false },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#8c9bb4', font: { size: 9 } },
          min: -15,
          max: 35
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function updateChart(x, y, z) {
  if (!accelChart) return;
  
  accelChart.data.datasets[0].data.shift();
  accelChart.data.datasets[0].data.push(x);
  
  accelChart.data.datasets[1].data.shift();
  accelChart.data.datasets[1].data.push(y);
  
  accelChart.data.datasets[2].data.shift();
  accelChart.data.datasets[2].data.push(z);
  
  accelChart.update('none');
}

// SSE Synchronization
function initSSE() {
  const eventSource = new EventSource('/api/events');

  eventSource.addEventListener('sync', (e) => {
    const data = JSON.parse(e.data);
    miners = data.miners;
    bands = data.bands;
    activeSosEvents = data.activeSos;
    
    updateMinersUI();
    updateEmergencyBanner();
    syncSimulatorDropdown();
    
    addTerminalLine("SYS", "Control Room database synced successfully", "success");
  });

  eventSource.addEventListener('miner_update', (e) => {
    miners = JSON.parse(e.data);
    updateMinersUI();
    syncSimulatorDropdown();
  });

  eventSource.addEventListener('band_update', (e) => {
    bands = JSON.parse(e.data);
    updateMinersUI();
    syncSimulatorDropdown();
  });

  eventSource.addEventListener('telemetry', (e) => {
    const record = JSON.parse(e.data);
    // If telemetry belongs to currently simulated band, write to terminal and update chart
    if (record.band_id === currentSimBandId) {
      addTerminalLine(
        "DATA",
        `TX -> Batt: ${record.battery}%, RSSI: ${record.signal_strength}dB, Motion: ${record.motion_status}, Accel: [X:${record.x_accel.toFixed(1)}, Y:${record.y_accel.toFixed(1)}, Z:${record.z_accel.toFixed(1)}]`
      );
      updateChart(record.x_accel, record.y_accel, record.z_accel);
    }
    
    // Auto refresh selected miner view if telemetry updates them
    if (selectedMinerId && bands.find(b => b.band_id === record.band_id)?.miner_id === selectedMinerId) {
      renderSelectedMiner();
    }
  });

  eventSource.addEventListener('sos_event', (e) => {
    const sos = JSON.parse(e.data);
    if (!activeSosEvents.some(item => item.id === sos.id)) {
      activeSosEvents.push(sos);
    }
    updateEmergencyBanner();
    triggerSiren(true);
    addTerminalLine("SOS", `EMERGENCY ALERT: Active SOS triggered for Miner ID: ${sos.miner_id || 'Unknown'}`, "critical");
  });

  eventSource.addEventListener('sos_ack', (e) => {
    const sos = JSON.parse(e.data);
    activeSosEvents = activeSosEvents.map(item => item.id === sos.id ? sos : item);
    updateEmergencyBanner();
    addTerminalLine("SOS", `Emergency event ${sos.id} acknowledged by control room`, "warning");
    
    if (sos.band_id === currentSimBandId) {
      flashScreenAlert("RESCUE TEAM", "ON THE WAY");
      playLocalBeep(220, 0.5);
    }
  });

  eventSource.addEventListener('sos_resolve', (e) => {
    const sos = JSON.parse(e.data);
    activeSosEvents = activeSosEvents.filter(item => item.id !== sos.id);
    updateEmergencyBanner();
    if (activeSosEvents.length === 0) {
      triggerSiren(false);
    }
    addTerminalLine("SOS", `Emergency event ${sos.id} marked RESOLVED`, "success");
    
    if (sos.band_id === currentSimBandId) {
      resetDeviceScreen();
      flashScreenAlert("STATUS", "SAFE & RESOLVED");
    }
  });

  eventSource.addEventListener('fall_event', (e) => {
    const fall = JSON.parse(e.data);
    fallEvents.unshift(fall);
    updateFallsUI();
    updateKPIs();
    addTerminalLine("SENSOR", `Fall detected! Peak: ${fall.acceleration}m/s², Tilt: ${fall.orientation}`, "warning");
    
    if (fall.band_id === currentSimBandId) {
      startFallCountdown(fall.id, fall.cancellation_timeout_seconds);
    }
  });

  eventSource.addEventListener('fall_status', (e) => {
    const fall = JSON.parse(e.data);
    fallEvents = fallEvents.map(item => item.id === fall.id ? fall : item);
    updateFallsUI();
    updateKPIs();
    
    if (fall.band_id === currentSimBandId) {
      if (fall.cancellation_status === 'CANCELLED') {
        stopFallCountdown();
        resetDeviceScreen();
        addTerminalLine("SENSOR", `Fall Alert Cancelled (Miner False Alarm Cancel)`, "success");
      } else if (fall.cancellation_status === 'SOS_TRIGGERED') {
        stopFallCountdown();
        addTerminalLine("SENSOR", `Fall alert timed out! Upgrading to SOS.`, "critical");
      }
    }
  });

  eventSource.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    messages.push(msg);
    appendChatMessage(msg);
    
    if (msg.direction === 'CONTROL_TO_MINER') {
      const isTargeted = 
        msg.receiver_id === 'ALL_MINERS' || 
        msg.receiver_id === currentSimBandId || 
        (msg.broadcast && msg.target_type === 'zone' && miners.find(m => m.miner_id === bands.find(b => b.band_id === currentSimBandId)?.miner_id)?.zone_id === msg.target_id);

      if (isTargeted) {
        flashScreenAlert(msg.severity === 'CRITICAL' ? "ALERT CRITICAL" : "ALERT MESSAGE", msg.message_text);
        let buzzerCount = msg.severity === 'CRITICAL' ? 3 : 1;
        let buzzerDuration = msg.severity === 'CRITICAL' ? 0.3 : 0.15;
        triggerDeviceFeedback(buzzerCount, buzzerDuration);
      }
    }
  });
}

// Render Miner Table
function updateMinersUI() {
  const tbody = document.getElementById('miner-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  miners.forEach(miner => {
    const band = bands.find(b => b.miner_id === miner.miner_id);
    const bandLabel = band ? band.band_id : `<span style="color: var(--text-secondary);">Unassigned</span>`;
    
    let statusClass = 'safe';
    if (miner.status === 'WARNING') statusClass = 'warning';
    if (miner.status === 'SOS') statusClass = 'sos';
    if (miner.status === 'OFFLINE') statusClass = 'offline';

    let batteryColor = 'var(--accent-green)';
    let batteryVal = '-';
    let signalVal = '-';
    if (band) {
      batteryVal = `${band.battery_level}%`;
      if (band.battery_level <= 20) batteryColor = 'var(--accent-red)';
      else if (band.battery_level <= 50) batteryColor = 'var(--accent-amber)';
      signalVal = band.online ? `${band.signal_strength} dB` : 'Offline';
    }

    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => selectMiner(miner.miner_id);
    if (selectedMinerId === miner.miner_id) {
      tr.style.background = 'rgba(0, 242, 254, 0.08)';
      tr.style.borderLeft = '3px solid var(--accent-cyan)';
    }

    tr.innerHTML = `
      <td><strong>${escapeHTML(miner.name)}</strong><br><small style="color: var(--text-secondary);">${escapeHTML(miner.miner_id)}</small></td>
      <td>${bandLabel}</td>
      <td><span class="badge warning">${escapeHTML(miner.zone_id)}</span></td>
      <td>
        ${band ? `
          <span style="color: ${batteryColor}; display: flex; align-items: center; gap: 4px;">
            <i data-lucide="${band.battery_level < 15 ? 'battery-low' : 'battery'}" style="width:14px; height:14px;"></i>
            ${batteryVal}
          </span>
        ` : '-'}
      </td>
      <td>${signalVal}</td>
      <td><span class="badge ${statusClass}">${miner.status}</span></td>
      <td>
        <div style="display: flex; gap: 5px;">
          <button class="btn btn-secondary btn-icon" style="width:26px; height:26px;" onclick="event.stopPropagation(); openEditMiner('${miner.miner_id}')" title="Edit Zone">
            <i data-lucide="edit-3" style="width:12px; height:12px;"></i>
          </button>
          <button class="btn btn-primary btn-icon" style="width:26px; height:26px; padding: 0;" onclick="event.stopPropagation(); openPairModal('${band ? band.band_id : 'unassigned'}', '${miner.miner_id}')" title="Assign Band">
            <i data-lucide="link" style="width:12px; height:12px;"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  updateKPIs();
  renderSelectedMiner();
  lucide.createIcons();
}

function selectMiner(minerId) {
  selectedMinerId = minerId;
  updateMinersUI();
}

function renderSelectedMiner() {
  const container = document.getElementById('selected-miner-details-view');
  if (!container) return;

  const miner = miners.find(m => m.miner_id === selectedMinerId);
  if (!miner) {
    if (miners.length > 0) {
      selectedMinerId = miners[0].miner_id;
      renderSelectedMiner();
    }
    return;
  }

  const band = bands.find(b => b.miner_id === miner.miner_id);

  let statusClass = 'safe';
  if (miner.status === 'WARNING') statusClass = 'warning';
  if (miner.status === 'SOS') statusClass = 'sos';
  if (miner.status === 'OFFLINE') statusClass = 'offline';

  let batteryColor = 'var(--accent-green)';
  if (band && band.battery_level <= 20) batteryColor = 'var(--accent-red)';
  else if (band && band.battery_level <= 50) batteryColor = 'var(--accent-amber)';

  container.innerHTML = `
    <div class="miner-details-header">
      <div class="miner-avatar-large">${miner.name.split(' ').map(n=>n[0]).join('')}</div>
      <div>
        <h3 style="font-size: 15px; font-weight: 700; color: #fff;">${escapeHTML(miner.name)}</h3>
        <span style="font-size: 11px; opacity: 0.6;">Miner ID: ${escapeHTML(miner.miner_id)}</span>
      </div>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
      <div class="miner-detail-row">
        <span>Employee ID</span>
        <span>${escapeHTML(miner.employee_id || 'N/A')}</span>
      </div>
      <div class="miner-detail-row">
        <span>Zone Location</span>
        <span><span class="badge warning">${escapeHTML(miner.zone_id)}</span></span>
      </div>
      <div class="miner-detail-row">
        <span>Safety Status</span>
        <span><span class="badge ${statusClass}">${miner.status}</span></span>
      </div>
      <div class="miner-detail-row">
        <span>Assigned Wearable</span>
        <span>${band ? band.band_id : 'None'}</span>
      </div>
      ${band ? `
        <div class="miner-detail-row">
          <span>Battery Charge</span>
          <span style="color: ${batteryColor}; font-weight: 700;">${band.battery_level}%</span>
        </div>
        <div class="miner-detail-row">
          <span>LoRa RSSI Signal</span>
          <span>${band.online ? `${band.signal_strength} dB` : 'Offline'}</span>
        </div>
        <div class="miner-detail-row">
          <span>Last Communication</span>
          <span>${new Date(band.last_active).toLocaleTimeString()}</span>
        </div>
      ` : ''}
      <div class="miner-detail-row">
        <span>Emergency Contact</span>
        <span>${escapeHTML(miner.phone || 'N/A')}</span>
      </div>
    </div>
  `;
}

function updateKPIs() {
  const activeMiners = miners.length;
  const bandsOnline = bands.filter(b => b.online).length;
  const lowBattery = bands.filter(b => b.online && b.battery_level <= 20).length;
  const fallCount = fallEvents.length;
  const sosCount = activeSosEvents.length;

  const mEl = document.getElementById('kpi-miners'); if (mEl) mEl.innerText = activeMiners;
  const bEl = document.getElementById('kpi-bands'); if (bEl) bEl.innerText = bandsOnline;
  
  const lowBatteryEl = document.getElementById('kpi-low-battery');
  if (lowBatteryEl) {
    lowBatteryEl.innerText = lowBattery;
    const battCard = document.getElementById('kpi-card-battery');
    if (battCard) {
      if (lowBattery > 0) {
        battCard.style.borderColor = 'var(--accent-amber)';
        battCard.style.background = 'rgba(247, 107, 28, 0.05)';
      } else {
        battCard.style.borderColor = 'var(--border-color)';
        battCard.style.background = 'var(--glass-bg)';
      }
    }
  }

  const fEl = document.getElementById('kpi-falls'); if (fEl) fEl.innerText = fallCount;
  
  const sosKpiEl = document.getElementById('kpi-sos');
  if (sosKpiEl) {
    sosKpiEl.innerText = sosCount;
    const sosCard = document.getElementById('kpi-card-sos');
    if (sosCard) {
      if (sosCount > 0) {
        sosCard.classList.add('sos-active');
      } else {
        sosCard.classList.remove('sos-active');
      }
    }
  }

  const unhandledAlerts = sosCount + fallEvents.filter(f => f.cancellation_status === 'PENDING').length;
  const badg = document.getElementById('alert-badge-count');
  if (badg) badg.innerText = unhandledAlerts;
}

// Render Fall Events UI
function updateFallsUI() {
  const tbody = document.getElementById('fall-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  fallEvents.slice(0, 10).forEach(fall => {
    const time = new Date(fall.timestamp).toLocaleTimeString();
    let statusClass = 'badge warning';
    if (fall.cancellation_status === 'CANCELLED') statusClass = 'badge safe';
    if (fall.cancellation_status === 'SOS_TRIGGERED') statusClass = 'badge sos';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><small>${time}</small></td>
      <td><strong>${escapeHTML(fall.miner_id || 'Unknown')}</strong></td>
      <td>${fall.acceleration.toFixed(1)} m/s²</td>
      <td>${escapeHTML(fall.orientation)}</td>
      <td><span class="${statusClass}">${fall.cancellation_status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Sync Active Emergency Alarm Header
function updateEmergencyBanner() {
  const panel = document.getElementById('main-sos-panel');
  const detailsContainer = document.getElementById('active-sos-details-container');
  const idleRadar = document.getElementById('idle-radar-container');
  const quickAckBtn = document.getElementById('btn-quick-ack');

  const sosCount = activeSosEvents.length;
  updateKPIs();

  if (sosCount > 0) {
    panel.classList.add('active-alarm');
    detailsContainer.style.display = 'block';
    idleRadar.style.display = 'none';

    const latestSos = activeSosEvents[activeSosEvents.length - 1];
    const miner = miners.find(m => m.miner_id === latestSos.miner_id);
    const band = bands.find(b => b.band_id === latestSos.band_id);

    if (quickAckBtn) {
      quickAckBtn.style.display = 'flex';
      quickAckBtn.onclick = () => ackEmergency(latestSos.id);
    }

    document.getElementById('emerg-miner-name').innerText = miner ? miner.name : "UNKNOWN WEARABLE SOS";
    document.getElementById('emerg-miner-id').innerText = latestSos.miner_id || 'UNKNOWN';
    document.getElementById('emerg-band-id').innerText = latestSos.band_id || 'UNKNOWN';
    document.getElementById('emerg-zone-id').innerText = latestSos.zone_id || 'UNKNOWN';
    document.getElementById('emerg-time').innerText = new Date(latestSos.timestamp).toLocaleTimeString();
    
    document.getElementById('emerg-battery').innerText = band ? `${band.battery_level}%` : 'N/A';
    document.getElementById('emerg-comm').innerText = (band && band.online) ? 'CONNECTED' : 'DISCONNECTED';
    document.getElementById('emerg-comm').style.color = (band && band.online) ? 'var(--accent-green)' : 'var(--accent-red)';
    document.getElementById('emerg-source').innerText = latestSos.source || 'MANUAL SOS';
    document.getElementById('emerg-source').style.color = latestSos.source === 'FALL_DETECTION_AUTO' ? 'var(--accent-red)' : 'var(--accent-amber)';
    document.getElementById('emerg-details-text').innerText = `"${latestSos.details || 'Emergency alert triggered'}"`;

    // Bind action events
    document.getElementById('btn-main-ack').onclick = () => ackEmergency(latestSos.id);
    document.getElementById('btn-main-resolve').onclick = () => resolveEmergency(latestSos.id);
    
    const muteBtn = document.getElementById('btn-main-mute');
    muteBtn.onclick = toggleMainSirenMute;
  } else {
    panel.classList.remove('active-alarm');
    detailsContainer.style.display = 'none';
    idleRadar.style.display = 'flex';
    if (quickAckBtn) quickAckBtn.style.display = 'none';
    triggerSiren(false);
  }
}

function toggleMainSirenMute() {
  isSirenMuted = !isSirenMuted;
  const icon = document.getElementById('main-mute-icon');
  if (isSirenMuted) {
    if (icon) icon.setAttribute('data-lucide', 'volume-x');
    triggerSiren(false);
  } else {
    if (icon) icon.setAttribute('data-lucide', 'volume-2');
    if (activeSosEvents.length > 0) {
      triggerSiren(true);
    }
  }
  lucide.createIcons();
}

// Populate / Sync Dropdown of Bands in Simulator Panel
function syncSimulatorDropdown() {
  const select = document.getElementById('simulator-select-band');
  const originalVal = select.value;
  select.innerHTML = '<option value="">-- Choose Band --</option>';

  bands.forEach(band => {
    const miner = miners.find(m => m.miner_id === band.miner_id);
    const minerText = miner ? ` (${miner.name})` : ' (Unassigned)';
    const opt = document.createElement('option');
    opt.value = band.band_id;
    opt.innerText = band.band_id + minerText;
    select.appendChild(opt);
  });

  if (originalVal && bands.some(b => b.band_id === originalVal)) {
    select.value = originalVal;
  } else if (bands.length > 0 && !originalVal) {
    select.value = bands[0].band_id;
    selectBandToSimulate(bands[0].band_id);
  }
}

// Select band simulator hook
function selectBandToSimulate(bandId) {
  currentSimBandId = bandId;
  stopFallCountdown();
  resetDeviceScreen();

  if (!bandId) {
    clearInterval(telemetryInterval);
    return;
  }

  const band = bands.find(b => b.band_id === bandId);
  const miner = miners.find(m => m.miner_id === band.miner_id);

  document.getElementById('screen-lora-id').innerText = band.lora_id;
  document.getElementById('screen-battery-text').innerText = `${band.battery_level}%`;
  document.getElementById('screen-miner-name').innerText = miner ? miner.name : "UNASSIGNED";
  document.getElementById('screen-signal').innerHTML = `<i data-lucide="signal" style="width: 10px; height: 10px;"></i> ${band.online ? band.signal_strength + '%' : '0%'}`;
  
  document.getElementById('sim-battery').value = band.battery_level;
  document.getElementById('sim-battery-val').innerText = `${band.battery_level}%`;
  document.getElementById('sim-signal').value = band.online ? band.signal_strength : 0;
  document.getElementById('sim-signal-val').innerText = `${band.online ? band.signal_strength : 0}%`;
  
  lucide.createIcons();

  clearInterval(telemetryInterval);
  telemetryInterval = setInterval(sendSimTelemetry, 3000);
  addTerminalLine("SYS", `Started simulation feed for band: ${bandId}`, "success");
}

// Send Telemetry Packet via API
async function sendSimTelemetry() {
  if (!currentSimBandId) return;

  const isNetworkOn = document.getElementById('sim-network').checked;
  if (!isNetworkOn) {
    addTerminalLine("SYS", "Ingestion paused (Network offline simulated)", "warning");
    return;
  }

  const battery = parseInt(document.getElementById('sim-battery').value);
  const signal = parseInt(document.getElementById('sim-signal').value);
  const motion = document.getElementById('sim-motion').value;

  let x_accel = 0.1, y_accel = 0.3, z_accel = 9.8;
  if (motion === 'ACTIVE') {
    x_accel = (Math.random() * 4 - 2);
    y_accel = (Math.random() * 4 - 2);
    z_accel = 9.8 + (Math.random() * 6 - 3);
  } else if (motion === 'INACTIVE') {
    x_accel = 0.0;
    y_accel = 0.0;
    z_accel = 9.8;
  }

  document.getElementById('screen-battery-text').innerText = `${battery}%`;
  document.getElementById('screen-signal').innerHTML = `<i data-lucide="signal" style="width: 10px; height: 10px;"></i> ${signal}%`;
  lucide.createIcons();

  const isSos = activeSosEvents.some(e => e.band_id === currentSimBandId);

  const payload = {
    band_id: currentSimBandId,
    battery,
    signal_strength: signal,
    motion_status: motion,
    fall_detected: (fallCountdownInterval !== null),
    sos: isSos,
    x_accel,
    y_accel,
    z_accel
  };

  try {
    const res = await fetch('/api/bands/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Telemetry transmit failed");
  } catch (err) {
    addTerminalLine("ERR", `Tx failed: ${err.message}`, "critical");
  }
}

// Fall detection countdown initiation
function startFallCountdown(fallEventId, timeoutSecs) {
  stopFallCountdown();
  
  activeFallEventId = fallEventId;
  fallCountdownVal = timeoutSecs;
  
  const bodyContent = document.getElementById('screen-body-content');
  const deviceBezel = document.getElementById('virtual-screen-bezel');
  const deviceBody = document.getElementById('virtual-device');

  deviceBezel.classList.add('alert-red');
  deviceBody.classList.add('vibrating');

  fallCountdownInterval = setInterval(() => {
    fallCountdownVal--;
    playLocalBeep(1800, 0.05);

    if (fallCountdownVal <= 0) {
      triggerAutoFallSOS(activeFallEventId);
      stopFallCountdown();
    } else {
      bodyContent.innerHTML = `
        <span style="font-weight:900; color:var(--accent-red); font-size:13px; animation:blink-text 0.5s infinite;">FALL DETECTED</span>
        <span style="font-size:9px;">CANCEL IN: ${fallCountdownVal}s</span>
        <span style="font-size:7px; background:#fff; color:#000; padding:2px; margin-top:2px;">PRESS SIDE BUTTON</span>
      `;
    }
  }, 1000);

  bodyContent.innerHTML = `
    <span style="font-weight:900; color:var(--accent-red); font-size:13px; animation:blink-text 0.5s infinite;">FALL DETECTED</span>
    <span style="font-size:9px;">CANCEL IN: ${fallCountdownVal}s</span>
    <span style="font-size:7px; background:#fff; color:#000; padding:2px; margin-top:2px;">PRESS SIDE BUTTON</span>
  `;
}

function stopFallCountdown() {
  if (fallCountdownInterval) {
    clearInterval(fallCountdownInterval);
    fallCountdownInterval = null;
  }
  const deviceBezel = document.getElementById('virtual-screen-bezel');
  const deviceBody = document.getElementById('virtual-device');
  
  if (deviceBezel) deviceBezel.classList.remove('alert-red');
  if (deviceBody) deviceBody.classList.remove('vibrating');
}

async function triggerAutoFallSOS(fallId) {
  try {
    await fetch('/api/fall-events/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fallId })
    });
  } catch (err) {
    console.error("Auto SOS upgrade failed:", err);
  }
}

// Reset watch simulator screen back to default state
function resetDeviceScreen() {
  const bodyContent = document.getElementById('screen-body-content');
  if (!currentSimBandId) return;

  const band = bands.find(b => b.band_id === currentSimBandId);
  const miner = miners.find(m => m.miner_id === band?.miner_id);
  const motion = document.getElementById('sim-motion').value;

  bodyContent.innerHTML = `
    <span style="font-size: 10px; opacity: 0.6;">MINER:</span>
    <span id="screen-miner-name" style="font-size: 13px; font-weight: 700; text-transform: uppercase;">${miner ? miner.name : 'UNASSIGNED'}</span>
    <div id="screen-movement-status" style="font-size: 9px; padding: 2px 6px; background: rgba(0, 242, 254, 0.2); border-radius: 4px; border: 1px solid rgba(0, 242, 254, 0.4); margin-top: 4px;">
      STATUS: ${motion}
    </div>
  `;
}

// Custom LCD Alerts
function flashScreenAlert(title, message) {
  const bodyContent = document.getElementById('screen-body-content');
  bodyContent.innerHTML = `
    <span style="font-weight:bold; color:var(--accent-amber); font-size:10px;">${escapeHTML(title)}</span>
    <span style="font-size:12px; font-weight:900; line-height:1.2;">${escapeHTML(message)}</span>
  `;
  
  setTimeout(() => {
    if (fallCountdownInterval === null) {
      resetDeviceScreen();
    }
  }, 10000);
}

// Hardware button click handlers
async function handleSOSButtonClick() {
  if (!currentSimBandId) {
    alert("Please select a band to simulate first!");
    return;
  }
  
  const band = bands.find(b => b.band_id === currentSimBandId);
  const minerId = band ? band.miner_id : null;

  try {
    const res = await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        band_id: currentSimBandId,
        miner_id: minerId,
        details: "Manual SOS pressed from Band Simulator hardware button"
      })
    });
    if (res.ok) {
      addTerminalLine("SYS", "SOS alert command sent from hardware button", "critical");
      triggerDeviceFeedback(2, 0.25);
    }
  } catch (err) {
    console.error("SOS trigger failed:", err);
  }
}

async function handleActionButtonClick() {
  if (fallCountdownInterval !== null && activeFallEventId) {
    try {
      const res = await fetch('/api/fall-events/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeFallEventId })
      });
      if (res.ok) {
        addTerminalLine("SYS", "Fall cancellation sent to Control Room (false alarm)", "success");
        playLocalBeep(880, 0.1);
      }
    } catch (err) {
      console.error("Fall cancel failed:", err);
    }
  } else {
    playLocalBeep(1200, 0.05);
    addTerminalLine("SYS", "Hardware Action button clicked (idle)", "success");
  }
}

// Send manual MPU6050 fall peak telemetry
async function triggerSimulatedFall() {
  if (!currentSimBandId) {
    alert("Select a band to simulate first!");
    return;
  }

  const band = bands.find(b => b.band_id === currentSimBandId);
  const miner = miners.find(m => m.miner_id === band?.miner_id);

  const payload = {
    band_id: currentSimBandId,
    miner_id: miner ? miner.miner_id : null,
    zone_id: miner ? miner.zone_id : 'UNKNOWN',
    acceleration: 28.5,
    orientation: 'TILTED_90',
    cancellation_timeout: 15
  };

  try {
    const res = await fetch('/api/fall-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      addTerminalLine("SYS", "Simulated accelerometer fall peak transmitted!", "warning");
    }
  } catch (err) {
    console.error("Simulated fall alert POST failed:", err);
  }
}

// Quick action broadcast command triggers
async function triggerQuickBroadcast(messageText, severity) {
  let targetType = 'all';
  let targetId = 'ALL_MINERS';

  if (messageText === 'EVACUATE ZONE') {
    const miner = miners.find(m => m.miner_id === selectedMinerId);
    if (miner) {
      targetType = 'zone';
      targetId = miner.zone_id;
    } else {
      const zone = prompt("Enter the Zone to Evacuate:", "ZONE_A");
      if (!zone) return;
      targetType = 'zone';
      targetId = zone;
    }
  }

  const confirmMsg = `Are you sure you want to broadcast "${messageText}" to ${targetType === 'all' ? 'ALL MINERS' : 'Zone ' + targetId}?`;
  if (!confirm(confirmMsg)) return;

  const payload = {
    target_type: targetType,
    target_id: targetId,
    message_text: messageText,
    severity: severity || 'WARNING'
  };

  try {
    const res = await fetch('/api/bands/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      addTerminalLine("SYS", `Quick Broadcast sent: "${messageText}" to ${targetId}`, "success");
    }
  } catch (err) {
    alert("Broadcast failed: " + err.message);
  }
}

// Emergency Header Actions
async function ackEmergency(sosId) {
  try {
    const res = await fetch('/api/sos/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sosId, user: "CONTROL_ROOM_OPERATOR" })
    });
    if (!res.ok) throw new Error("Acknowledge failed");
  } catch (err) {
    alert("Failed to acknowledge: " + err.message);
  }
}

async function resolveEmergency(sosId) {
  try {
    const res = await fetch('/api/sos/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sosId })
    });
    if (!res.ok) throw new Error("Resolve failed");
  } catch (err) {
    alert("Failed to resolve: " + err.message);
  }
}

// Chat log helpers
function appendChatMessage(msg) {
  const box = document.getElementById('chat-messages-box');
  if (!box) return;
  const div = document.createElement('div');
  
  let label = '';
  if (msg.direction === 'CONTROL_TO_MINER') {
    label = `<small style="display:block; opacity:0.6; font-size:10px;">Control &rarr; ${msg.receiver_id}</small>`;
  } else {
    label = `<small style="display:block; opacity:0.6; font-size:10px;">${msg.sender_id} &rarr; Control</small>`;
  }

  div.innerHTML = `${label} ${escapeHTML(msg.message_text)}`;

  if (msg.broadcast) {
    div.className = msg.severity === 'CRITICAL' ? 'chat-msg critical-broadcast' : 'chat-msg broadcast';
  } else {
    div.className = msg.direction === 'CONTROL_TO_MINER' ? 'chat-msg sent' : 'chat-msg received';
  }

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// Web Audio API Dual Oscillator High-Tech Warning Siren
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function triggerSiren(start) {
  initAudio();
  if (start) {
    if (isSirenPlaying || isSirenMuted) return;

    isSirenPlaying = true;
    sirenGainNode = audioCtx.createGain();
    sirenGainNode.gain.setValueAtTime(0.0, audioCtx.currentTime);
    sirenGainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
    sirenGainNode.connect(audioCtx.destination);

    sirenOscillator1 = audioCtx.createOscillator();
    sirenOscillator1.type = 'sawtooth';
    sirenOscillator1.frequency.setValueAtTime(600, audioCtx.currentTime);
    sirenOscillator1.connect(sirenGainNode);
    sirenOscillator1.start();

    sirenOscillator2 = audioCtx.createOscillator();
    sirenOscillator2.type = 'sine';
    sirenOscillator2.frequency.setValueAtTime(800, audioCtx.currentTime);
    sirenOscillator2.connect(sirenGainNode);
    sirenOscillator2.start();

    let alternate = true;
    sirenInterval = setInterval(() => {
      if (alternate) {
        sirenOscillator1.frequency.exponentialRampToValueAtTime(1100, audioCtx.currentTime + 0.4);
        sirenOscillator2.frequency.exponentialRampToValueAtTime(1300, audioCtx.currentTime + 0.4);
      } else {
        sirenOscillator1.frequency.exponentialRampToValueAtTime(550, audioCtx.currentTime + 0.4);
        sirenOscillator2.frequency.exponentialRampToValueAtTime(750, audioCtx.currentTime + 0.4);
      }
      alternate = !alternate;
    }, 450);

  } else {
    if (!isSirenPlaying) return;
    
    isSirenPlaying = false;
    clearInterval(sirenInterval);
    
    if (sirenGainNode) {
      try {
        sirenGainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
        setTimeout(() => {
          if (sirenOscillator1) sirenOscillator1.stop();
          if (sirenOscillator2) sirenOscillator2.stop();
        }, 250);
      } catch (err) {}
    }
  }
}

// Tone Beep Generator
function playLocalBeep(freq = 1500, duration = 0.1) {
  try {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {}
}

// Simulated LEDs/Vibrator flashers on simulator panel
function triggerDeviceFeedback(pulses, duration) {
  let count = 0;
  
  const buzzer = document.getElementById('led-buzzer');
  const vibrator = document.getElementById('led-vibrate');
  const rgb = document.getElementById('led-rgb');

  const flash = () => {
    if (count >= pulses * 2) {
      if (buzzer) buzzer.classList.remove('active-yellow');
      if (vibrator) vibrator.classList.remove('active-yellow');
      if (rgb) rgb.classList.remove('active-red');
      return;
    }

    if (count % 2 === 0) {
      if (buzzer) buzzer.classList.add('active-yellow');
      if (vibrator) vibrator.classList.add('active-yellow');
      if (rgb) rgb.classList.add('active-red');
      playLocalBeep(2400, duration);
    } else {
      if (buzzer) buzzer.classList.remove('active-yellow');
      if (vibrator) vibrator.classList.remove('active-yellow');
      if (rgb) rgb.classList.remove('active-red');
    }

    count++;
    setTimeout(flash, duration * 1000 * 2);
  };
  flash();
}

// Logging stream UI Helper
function addTerminalLine(tag, message, statusClass = "") {
  const term = document.getElementById('sim-terminal');
  if (!term) return;
  const line = document.createElement('div');
  line.className = `terminal-line ${statusClass}`;
  
  const time = new Date().toLocaleTimeString();
  line.innerHTML = `
    <span class="timestamp">[${time}]</span>
    <span class="tag">[${tag}]</span>
    <span class="message">${escapeHTML(message)}</span>
  `;
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
}

// Form Handlers & UI Elements Setup
function setupEventListeners() {
  
  // Select Band Dropdown change
  document.getElementById('simulator-select-band').addEventListener('change', (e) => {
    selectBandToSimulate(e.target.value);
  });

  // Hardware SOS button click
  document.getElementById('hw-btn-sos').addEventListener('click', handleSOSButtonClick);

  // Hardware Action/Cancel button click
  document.getElementById('hw-btn-action').addEventListener('click', handleActionButtonClick);

  // Sensor Control sliders
  document.getElementById('sim-battery').addEventListener('input', (e) => {
    document.getElementById('sim-battery-val').innerText = `${e.target.value}%`;
  });
  document.getElementById('sim-signal').addEventListener('input', (e) => {
    document.getElementById('sim-signal-val').innerText = `${e.target.value}%`;
  });

  // Motion Activity Dropdown update
  document.getElementById('sim-motion').addEventListener('change', (e) => {
    const statusText = document.getElementById('screen-movement-status');
    if (statusText) {
      statusText.innerText = `STATUS: ${e.target.value}`;
    }
    addTerminalLine("SENSOR", `Motion profile updated to: ${e.target.value}`);
  });

  // Network Switch update
  document.getElementById('sim-network').addEventListener('change', (e) => {
    const isOnline = e.target.checked;
    addTerminalLine("NET", `LoRa Transceiver set: ${isOnline ? 'ONLINE' : 'OFFLINE'}`, isOnline ? 'success' : 'critical');
  });

  // Fall Button Click
  document.getElementById('btn-sim-fall').addEventListener('click', triggerSimulatedFall);

  // Manual SOS Button Click (Under slider panel)
  document.getElementById('btn-sim-sos').addEventListener('click', handleSOSButtonClick);

  // Clear Terminal Button
  document.getElementById('btn-clear-terminal').addEventListener('click', () => {
    document.getElementById('sim-terminal').innerHTML = '';
  });

  // Broadcast Target Type selector dependencies
  document.getElementById('broadcast-target-type').addEventListener('change', (e) => {
    const detailInput = document.getElementById('broadcast-target-id');
    if (e.target.value === 'all') {
      detailInput.disabled = true;
      detailInput.value = '';
      detailInput.placeholder = 'N/A (All Miners selected)';
    } else if (e.target.value === 'zone') {
      detailInput.disabled = false;
      detailInput.value = 'ZONE_A';
      detailInput.placeholder = 'e.g. ZONE_A';
    } else {
      detailInput.disabled = false;
      detailInput.value = 'BAND_001';
      detailInput.placeholder = 'e.g. BAND_001';
    }
  });

  // Broadcast form submission
  document.getElementById('broadcast-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('broadcast-target-type').value;
    const targetId = document.getElementById('broadcast-target-id').value;
    const msg = document.getElementById('broadcast-message').value;
    const severity = document.getElementById('broadcast-severity').value;

    const confirmMsg = `Are you sure you want to broadcast "${msg}" to ${type === 'all' ? 'ALL MINERS' : type + ' ' + targetId}?`;
    if (!confirm(confirmMsg)) return;

    const payload = {
      target_type: type,
      target_id: type === 'all' ? 'ALL_MINERS' : targetId,
      message_text: msg,
      severity
    };

    try {
      const res = await fetch('/api/bands/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        document.getElementById('broadcast-message').value = '';
        addTerminalLine("SYS", `Broadcast message submitted successfully (${severity})`, "success");
      }
    } catch (err) {
      alert("Failed to send broadcast: " + err.message);
    }
  });

  // Add Miner Modal Toggle
  document.getElementById('btn-open-add-miner').addEventListener('click', () => {
    openModal('modal-add-miner');
  });

  // Add Band Modal Toggle
  document.getElementById('btn-open-add-band').addEventListener('click', () => {
    openModal('modal-add-band');
  });

  // Forms submit logic
  document.getElementById('form-add-miner').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      miner_id: document.getElementById('add-miner-id').value,
      name: document.getElementById('add-miner-name').value,
      employee_id: document.getElementById('add-miner-emp').value,
      zone_id: document.getElementById('add-miner-zone').value,
      phone: document.getElementById('add-miner-phone').value,
      email: document.getElementById('add-miner-email').value
    };

    try {
      const res = await fetch('/api/miners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        closeModal('modal-add-miner');
        document.getElementById('form-add-miner').reset();
      } else {
        const err = await res.json();
        alert("Error: " + err.error);
      }
    } catch (err) {
      alert("Failed: " + err.message);
    }
  });

  document.getElementById('form-add-band').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      band_id: document.getElementById('add-band-id').value,
      lora_id: document.getElementById('add-band-lora').value
    };

    try {
      const res = await fetch('/api/bands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        closeModal('modal-add-band');
        document.getElementById('form-add-band').reset();
      } else {
        const err = await res.json();
        alert("Error: " + err.error);
      }
    } catch (err) {
      alert("Failed: " + err.message);
    }
  });

  document.getElementById('form-pair-band').addEventListener('submit', async (e) => {
    e.preventDefault();
    const bandId = document.getElementById('pair-band-id').value;
    const minerId = document.getElementById('pair-miner-select').value || null;

    try {
      const res = await fetch(`/api/bands/${bandId}/pair`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ miner_id: minerId })
      });
      if (res.ok) {
        closeModal('modal-pair-band');
      }
    } catch (err) {
      alert("Failed to pair: " + err.message);
    }
  });
}

// Modals open/close helper
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Delete Miner API call
async function deleteMiner(minerId) {
  if (confirm(`Are you sure you want to delete miner ${minerId}?`)) {
    try {
      await fetch(`/api/miners/${minerId}`, { method: 'DELETE' });
      if (selectedMinerId === minerId) {
        selectedMinerId = null;
      }
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }
}

// Edit Miner triggers
function openEditMiner(minerId) {
  const miner = miners.find(m => m.miner_id === minerId);
  if (!miner) return;

  const newZone = prompt(`Update Zone for Miner: ${miner.name}`, miner.zone_id);
  if (newZone !== null) {
    fetch(`/api/miners/${minerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone_id: newZone })
    }).catch(err => alert("Update zone failed"));
  }
}

// Pair device modal setup
function openPairModal(bandId, minerId) {
  let finalBandId = bandId;
  if (bandId === 'unassigned') {
    const unassignedBand = bands.find(b => !b.miner_id);
    if (unassignedBand) {
      finalBandId = unassignedBand.band_id;
    } else if (bands.length > 0) {
      finalBandId = bands[0].band_id;
    } else {
      alert("No bands registered! Please register a smart band first.");
      return;
    }
  }

  document.getElementById('pair-band-id').value = finalBandId;
  document.getElementById('pair-band-label').innerText = finalBandId;

  const select = document.getElementById('pair-miner-select');
  select.innerHTML = '<option value="">-- Unassigned (None) --</option>';

  miners.forEach(miner => {
    const pairedBand = bands.find(b => b.miner_id === miner.miner_id);
    const labelSuffix = pairedBand ? ` (Currently paired to ${pairedBand.band_id})` : '';

    const opt = document.createElement('option');
    opt.value = miner.miner_id;
    opt.innerText = miner.name + labelSuffix;
    
    if (minerId && miner.miner_id === minerId) {
      opt.selected = true;
    } else if (!minerId && pairedBand && pairedBand.band_id === finalBandId) {
      opt.selected = true;
    }

    select.appendChild(opt);
  });

  openModal('modal-pair-band');
}

// HTML Escaping Helper
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
