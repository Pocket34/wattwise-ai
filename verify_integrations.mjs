// Comprehensive Automated Verification Suite for WattWise AI Real Integration Layer
import http from 'node:http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runIntegrationTests() {
  console.log('🚀 Starting WattWise AI Real Integration Layer Verification...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Frontend & Backend availability
    console.log('--- Test 1: Frontend & Backend Health ---');
    const fe = await makeRequest({ hostname: 'localhost', port: 5173, path: '/', method: 'GET' });
    assert(fe.status === 200, 'Frontend is serving HTTP 200');

    const be = await makeRequest({ hostname: 'localhost', port: 3001, path: '/health', method: 'GET' });
    assert(be.status === 200 && be.data.status === 'healthy', 'Backend is healthy on port 3001');

    // 2. Integration Status & Providers
    console.log('\n--- Test 2: Provider Registry & Honest Status ---');
    const intStatus = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/integrations/status', method: 'GET' });
    assert(intStatus.status === 200, 'GET /api/integrations/status returned 200');
    assert(intStatus.data.mode === 'DEMO', `Default mode is DEMO (Got ${intStatus.data.mode})`);
    assert(Array.isArray(intStatus.data.providers), `Returns ${intStatus.data.providers?.length} providers`);

    const google = intStatus.data.providers.find(p => p.id === 'google_home');
    const matter = intStatus.data.providers.find(p => p.id === 'matter');
    const deviceApi = intStatus.data.providers.find(p => p.id === 'device_api');
    const demo = intStatus.data.providers.find(p => p.id === 'demo');

    assert(google && google.status === 'not_configured', `Google Home honest status: ${google?.status}`);
    assert(google?.message?.includes('requires configuration'), 'Google Home reports configuration required notice');
    assert(matter && matter.status === 'not_configured', `Matter honest status: ${matter?.status}`);
    assert(matter?.message?.includes('Hardware controller required'), 'Matter reports hardware controller required statement');
    assert(deviceApi && deviceApi.status === 'not_configured', `Device API honest status: ${deviceApi?.status}`);
    assert(demo && demo.status === 'demo', `Demo Provider status: ${demo?.status}`);

    // 3. Google OAuth Security & Error Handling
    console.log('\n--- Test 3: Google Home OAuth Flow & CSRF Protection ---');
    const oauthStart = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/integrations/google/start', method: 'GET' });
    assert(oauthStart.status === 400, 'Google OAuth start rejects without credentials (400 Bad Request)');
    assert(oauthStart.data.configured === false, 'Google OAuth start reports configured=false');
    assert(oauthStart.data.fallback === 'Continue with Demo Home', 'Provides fallback to Continue with Demo Home');

    // Test CSRF protection on callback
    const forgedCallback = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/google/callback?code=mock_code_123&state=forged_unregistered_state',
      method: 'GET'
    });
    assert(forgedCallback.status === 403, `OAuth callback rejected forged state with 403 Forbidden (Got ${forgedCallback.status})`);
    assert(forgedCallback.raw?.includes('Security Validation Failed'), 'CSRF security rejection message displayed');

    // 4. Matter Commissioning Protection
    console.log('\n--- Test 4: Matter Commissioning Controller Requirement ---');
    const matterCommission = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/matter/commission',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { pairingCode: '3497-201-9982' });
    assert(matterCommission.status === 400, 'Matter commissioning rejects without physical controller endpoint');
    assert(matterCommission.data.error?.includes('Hardware controller required'), 'Explains hardware controller requirement');

    // 5. Smart Device API Test
    console.log('\n--- Test 5: Smart Device API Gateway Handling ---');
    const apiTest = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/api-device/test',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    assert(apiTest.status === 400, 'Device API test rejects when SMART_DEVICE_API_URL unconfigured');
    assert(apiTest.data.error?.includes('not configured'), 'Device API provides clear environment configuration instructions');

    // 6. Device Discovery Scanner
    console.log('\n--- Test 6: Device Discovery Scanner ---');
    const demoScan = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/scan',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { providerId: 'demo' });
    assert(demoScan.status === 200, 'Demo provider scan returned 200 OK');
    assert(Array.isArray(demoScan.data.devices) && demoScan.data.devices.length >= 6, `Discovered ${demoScan.data.devices?.length} devices`);
    assert(demoScan.data.devices.every(d => d.source === 'demo'), 'All discovered demo devices have source="demo"');

    // Verify presence of required realistic devices
    const deviceTypes = demoScan.data.devices.map(d => d.type);
    assert(deviceTypes.includes('AC'), 'Discovered AC device');
    assert(deviceTypes.includes('TV'), 'Discovered TV device');
    assert(deviceTypes.includes('FAN'), 'Discovered FAN device');
    assert(deviceTypes.includes('REFRIGERATOR'), 'Discovered Refrigerator device');
    assert(deviceTypes.includes('SMART_PLUG'), 'Discovered Smart Plug device');
    assert(deviceTypes.includes('LIGHT'), 'Discovered Smart Light device');

    // 7. Add Devices to WattWise
    console.log('\n--- Test 7: Add Discovered Devices to WattWise ---');
    const addRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/devices/add',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { devices: demoScan.data.devices });
    assert(addRes.status === 200, 'POST /api/integrations/devices/add returned 200 OK');
    assert(addRes.data.addedCount >= 6, `Successfully added ${addRes.data.addedCount} devices to home database`);

    // 8. Device Controls & Normalized Telemetry
    console.log('\n--- Test 8: Common Device Controls & Telemetry Service ---');
    // AC Temperature Setpoint
    const acControl = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/devices/ac/control',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { action: 'temperature', value: 24 });
    assert(acControl.status === 200, 'AC temperature control returned 200 OK');
    assert(acControl.data.device.state.tempSetpoint === 24, `AC setpoint updated to 24°C`);
    assert(acControl.data.telemetry !== undefined, 'Normalized fleet telemetry returned');

    // Fan Speed
    const fanControl = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/devices/fan/control',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { action: 'fan_speed', value: 5 });
    assert(fanControl.status === 200, 'Fan speed control returned 200 OK');
    assert(fanControl.data.device.state.fanSpeed === 5, 'Fan speed updated to 5');
    assert(fanControl.data.device.powerWatts === 84, `Fan wattage scaled to 84W at speed 5`);

    // Lights Brightness
    const lightControl = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/devices/lights/control',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { action: 'brightness', value: 40 });
    assert(lightControl.status === 200, 'Lights brightness control returned 200 OK');
    assert(lightControl.data.device.state.brightness === 40, 'Lights brightness updated to 40%');
    assert(lightControl.data.device.powerWatts === 44, 'Lights wattage scaled to 44W at 40%');

    // TV Power
    const tvControl = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/devices/tv/control',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { action: 'power', value: false });
    assert(tvControl.status === 200, 'TV power control returned 200 OK');
    assert(tvControl.data.device.state.isOn === false, 'TV power state is false (OFF)');

    // 9. Integration Mode Switching Safeguard
    console.log('\n--- Test 9: DEMO vs LIVE Mode Safeguard ---');
    const liveSwitchAttempt = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/mode',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { mode: 'LIVE' });
    assert(liveSwitchAttempt.status === 400, 'Rejects switching to LIVE MODE when no external providers are authenticated');
    assert(liveSwitchAttempt.data.fallback === 'DEMO', 'Enforces DEMO mode fallback safely');

    const demoSwitch = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/mode',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { mode: 'DEMO' });
    assert(demoSwitch.status === 200 && demoSwitch.data.mode === 'DEMO', 'DEMO mode active and verified');

    console.log(`\n=================================================`);
    console.log(`INTEGRATION TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=================================================`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Integration test runner error:', err);
    process.exit(1);
  }
}

runIntegrationTests();
