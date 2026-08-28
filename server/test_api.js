const http = require('http');

async function testBackend() {
  console.log('Testing MineGuard AI Backend REST API endpoints...');

  const endpoints = [
    { method: 'GET', path: '/api/health' },
    { method: 'POST', path: '/api/auth/login', body: { username: 'admin', password: 'admin123' } },
    { method: 'GET', path: '/api/users' },
    { method: 'GET', path: '/api/roles' },
    { method: 'GET', path: '/api/mines' },
    { method: 'GET', path: '/api/mine-zones' },
    { method: 'GET', path: '/api/sensor-nodes' },
    { method: 'GET', path: '/api/miners' },
    { method: 'GET', path: '/api/alerts' },
    { method: 'GET', path: '/api/alerts/history' },
    { method: 'POST', path: '/api/alerts/ai', body: { zone_id: 'ZONE_D', subsidence_velocity_mm_hr: 9.8, ai_confidence: 96 } },
    { method: 'POST', path: '/api/alerts/miner', body: { miner_id: 'MINER_001', event_type: 'FALL_DETECTED', impact_g: 5.2 } },
    { method: 'GET', path: '/api/incidents' },
    { method: 'GET', path: '/api/rescue-teams/rescue-teams/list' },
    { method: 'GET', path: '/api/bands' },
    { method: 'POST', path: '/api/bands/broadcast', body: { target_type: 'ZONE', target_id: 'ZONE_D', message: 'TEST EVACUATION SIGNAL', alert_level: 'EMERGENCY_EVACUATE' } },
    { method: 'GET', path: '/api/reports' },
    { method: 'GET', path: '/api/reports/analytics/summary' },
    { method: 'POST', path: '/api/reports/generate', body: { report_type: 'SENSOR_EVENTS' } }
  ];

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const res = await request(ep.method, ep.path, ep.body);
      if (res.status >= 200 && res.status < 300) {
        console.log(`[PASS] ${ep.method} ${ep.path} -> HTTP ${res.status}`);
        passed++;
      } else {
        console.error(`[FAIL] ${ep.method} ${ep.path} -> HTTP ${res.status}:`, res.data);
        failed++;
      }
    } catch (err) {
      console.error(`[ERROR] ${ep.method} ${ep.path} ->`, err.message);
      failed++;
    }
  }

  console.log(`\nTest Summary: ${passed} passed, ${failed} failed out of ${endpoints.length} endpoints.`);
  process.exit(failed === 0 ? 0 : 1);
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// If run directly, wait 1.5s for server if needed
setTimeout(testBackend, 1000);
