// Comprehensive Automated E2E Test Suite for WattWise AI
import http from 'node:http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: body });
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

async function runTests() {
  console.log('🚀 Starting WattWise AI Verification Suite...\n');
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
    // 1. Check frontend
    console.log('--- Test 1: Frontend Server ---');
    const feRes = await makeRequest({ hostname: 'localhost', port: 5173, path: '/', method: 'GET' });
    assert(feRes.status === 200, `Frontend root returned 200 OK (Got ${feRes.status})`);
    assert(feRes.raw && feRes.raw.includes('<div id="root"></div>'), 'Frontend HTML includes root div');

    // 2. Check Backend Status
    console.log('\n--- Test 2: Backend Telemetry & Status ---');
    const statusRes = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/status', method: 'GET' });
    assert(statusRes.status === 200, `GET /api/status returned 200 (Got ${statusRes.status})`);
    assert(statusRes.data.telemetry !== undefined, 'Telemetry object present in status');
    assert(statusRes.data.appliances && statusRes.data.appliances.length > 0, `Appliances list returned (${statusRes.data.appliances?.length} items)`);
    assert(statusRes.data.settings !== undefined, 'Settings object present');

    // 3. Check Simulation Mode & db.transaction Fix
    console.log('\n--- Test 3: Simulation Modes & db.transaction Verification ---');
    const simRes1 = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/simulation/mode',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { mode: 'High Usage' });
    assert(simRes1.status === 200, `POST /api/simulation/mode (High Usage) returned 200 (db.transaction succeeded!)`);
    assert(simRes1.data.telemetry?.currentWatts > 2000, `High Usage watts computed properly: ${simRes1.data.telemetry?.currentWatts}W`);

    const simRes2 = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/simulation/mode',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { mode: 'Optimized Home' });
    assert(simRes2.status === 200, `POST /api/simulation/mode (Optimized Home) returned 200`);
    assert(simRes2.data.telemetry?.currentWatts < simRes1.data.telemetry?.currentWatts, `Optimized watts lower than High Usage: ${simRes2.data.telemetry?.currentWatts}W`);

    // 4. Bridge Status & Operations
    console.log('\n--- Test 4: Smart Home Bridge APIs ---');
    const bridgeStatus = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/bridge/status', method: 'GET' });
    assert(bridgeStatus.status === 200, `GET /api/bridge/status returned 200`);
    assert(Array.isArray(bridgeStatus.data.protocols), `Bridge returned ${bridgeStatus.data.protocols?.length} supported protocols`);

    // Sync bridge
    const syncRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/bridge/sync',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    assert(syncRes.status === 200, `POST /api/bridge/sync returned 200`);
    assert(syncRes.data.lastSyncTime !== undefined, `Sync returned updated lastSyncTime: ${syncRes.data.lastSyncTime}`);

    // Disconnect protocol
    const disconnRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/bridge/disconnect',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { protocolId: 'google_home' });
    assert(disconnRes.status === 200, `POST /api/bridge/disconnect returned 200`);

    // Re-connect protocol
    const connRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/bridge/connect',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { protocolId: 'google_home', deviceIds: ['ac', 'tv', 'fan', 'lights', 'fridge'] });
    assert(connRes.status === 200, `POST /api/bridge/connect returned 200`);
    assert(connRes.data.status === 'connected', `Protocol status is connected: ${connRes.data.status}`);

    // 5. Smart Home Scenes
    console.log('\n--- Test 5: Smart Home Scenes ---');
    const scenes = ['sleep', 'away', 'peak_saver', 'morning', 'bill_saver'];
    for (const sc of scenes) {
      const scRes = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/scenes/apply',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { sceneId: sc });
      assert(scRes.status === 200, `Scene '${sc}' applied successfully (200 OK)`);
      assert(scRes.data.sceneId === sc, `Applied scene reported as '${sc}'`);
    }

    // Verify 'sleep' scene specific appliance states
    const sleepRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/scenes/apply',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { sceneId: 'sleep' });
    const acAppliance = sleepRes.data.appliances.find(a => a.id === 'ac');
    const tvAppliance = sleepRes.data.appliances.find(a => a.id === 'tv');
    assert(acAppliance.temp_setpoint === 24, `AC setpoint is 24°C in sleep scene (Got ${acAppliance.temp_setpoint}°C)`);
    assert(tvAppliance.is_on === 0, `TV is OFF in sleep scene (Got is_on=${tvAppliance.is_on})`);

    // 6. Automation Rules Execution
    console.log('\n--- Test 6: Automation Rules Engine ---');
    const rulesRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/rules/run',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    assert(rulesRes.status === 200, `POST /api/rules/run returned 200 OK`);
    assert(Array.isArray(rulesRes.data.triggered), `Rules evaluation returned triggered rules array`);
    console.log(`    Triggered rules (${rulesRes.data.triggeredCount}): ${rulesRes.data.triggered?.map(e => e.title).join(', ')}`);

    // 7. Device Controls & Deterministic Calculations
    console.log('\n--- Test 7: Appliance Controls & Telemetry Updates ---');
    // Turn AC OFF
    const acOffRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/appliances/ac',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { is_on: 0 });
    assert(acOffRes.status === 200, `AC PUT is_on=0 returned 200`);

    const statusAfterAcOff = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/status', method: 'GET' });
    const wattsWithoutAC = statusAfterAcOff.data.telemetry?.currentWatts;

    // Turn AC ON
    const acOnRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/appliances/ac',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { is_on: 1 });
    assert(acOnRes.status === 200, `AC PUT is_on=1 returned 200`);

    const statusAfterAcOn = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/status', method: 'GET' });
    const wattsWithAC = statusAfterAcOn.data.telemetry?.currentWatts;
    assert(wattsWithAC > wattsWithoutAC, `Total power increased deterministically when AC turned ON: ${wattsWithoutAC}W -> ${wattsWithAC}W`);

    // Fan Speed Control
    const fanSpeedRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/appliances/fan',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { device_speed: 5 });
    assert(fanSpeedRes.status === 200, `Fan speed control (speed=5) returned 200`);
    assert(fanSpeedRes.data.appliance.device_speed === 5, `Fan device_speed is 5 (Got ${fanSpeedRes.data.appliance.device_speed})`);
    assert(fanSpeedRes.data.appliance.power_watts === 84, `Fan wattage deterministically scaled to 84W at speed 5 (Got ${fanSpeedRes.data.appliance.power_watts}W)`);

    // Light Dimmer Control
    const lightDimRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/appliances/lights',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { brightness: 40 });
    assert(lightDimRes.status === 200, `Lights dimmer control (brightness=40) returned 200`);
    assert(lightDimRes.data.appliance.brightness === 40, `Lights brightness is 40% (Got ${lightDimRes.data.appliance.brightness}%)`);
    assert(lightDimRes.data.appliance.power_watts === 44, `Lights wattage deterministically scaled to 44W (Got ${lightDimRes.data.appliance.power_watts}W)`);

    // 8. 1-Click Energy Orchestrator Optimization
    console.log('\n--- Test 8: Energy Orchestrator Optimization ---');
    const optRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/insights/ins-ac-load-share/apply',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    assert(optRes.status === 200, `1-Click AC Optimization returned 200 OK`);

    const finalStatus = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/status', method: 'GET' });
    const finalAc = finalStatus.data.appliances.find(a => a.id === 'ac');
    assert(finalAc.temp_setpoint === 24, `AC temp setpoint is now 24.0°C (Got ${finalAc.temp_setpoint}°C)`);
    assert(finalAc.power_watts === 1220, `AC power_watts is now 1220W (Got ${finalAc.power_watts}W)`);

    console.log(`\n=========================================`);
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=========================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
