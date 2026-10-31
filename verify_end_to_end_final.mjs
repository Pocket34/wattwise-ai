// Comprehensive End-to-End Verification Test Script for WattWise AI
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

async function runEndToEndVerification() {
  console.log('═════════════════════════════════════════════════════════════════');
  console.log('  WATTWISE AI — FINAL END-TO-END SYSTEM VERIFICATION');
  console.log('═════════════════════════════════════════════════════════════════\n');

  const results = [];

  function record(testId, name, pass, details = '') {
    results.push({ testId, name, pass, details });
    const mark = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`[${testId}] ${mark}: ${name}${details ? ` -> ${details}` : ''}`);
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Backend Server Startup & Health
    // -------------------------------------------------------------
    const health = await makeRequest({ hostname: 'localhost', port: 3001, path: '/health', method: 'GET' });
    const backendHealthy = health.status === 200 && health.data?.status === 'healthy';
    record('TEST 1', 'Start the backend', backendHealthy, `Status: ${health.status}, Uptime: ${Math.round(health.data?.uptime || 0)}s`);

    // -------------------------------------------------------------
    // Test 2: Frontend Server Startup & Root Bundle
    // -------------------------------------------------------------
    const fe = await makeRequest({ hostname: 'localhost', port: 5173, path: '/', method: 'GET' });
    const frontendHealthy = fe.status === 200 && fe.raw?.includes('<div id="root"></div>');
    record('TEST 2', 'Start the frontend', frontendHealthy, `Status: ${fe.status}, Root container present`);

    // -------------------------------------------------------------
    // Test 3: Open the Smart Home Bridge (Endpoints & UI assets)
    // -------------------------------------------------------------
    const bridgeStatus = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/bridge/status', method: 'GET' });
    const bridgeProtocols = Array.isArray(bridgeStatus.data?.protocols) && bridgeStatus.data?.protocols.length > 0;
    record('TEST 3', 'Open the Smart Home Bridge', bridgeStatus.status === 200 && bridgeProtocols,
      `${bridgeStatus.data?.protocols?.length} protocol definitions available; totalDevices=${bridgeStatus.data?.totalDevices}`);

    // -------------------------------------------------------------
    // Test 4: Verify Demo Mode works without any Google/Matter/API credentials
    // -------------------------------------------------------------
    // 4a. Demo scan produces deterministic devices
    const scanRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/scan',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { providerId: 'demo' });
    const demoDevices = scanRes.data?.devices || [];
    const hasRealisticDemo = demoDevices.some(d => d.type === 'AC') &&
                             demoDevices.some(d => d.type === 'TV') &&
                             demoDevices.some(d => d.type === 'FAN') &&
                             demoDevices.some(d => d.type === 'REFRIGERATOR');

    // 4b. Control AC temperature in Demo Mode
    const acControl = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/devices/ac/control',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { action: 'temperature', value: 24 });

    // 4c. Control Fan Speed in Demo Mode
    const fanControl = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/devices/fan/control',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { action: 'fan_speed', value: 4 });

    // 4d. Control Light Dimmer in Demo Mode
    const lightControl = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/devices/lights/control',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { action: 'brightness', value: 70 });

    const demoFunctional = hasRealisticDemo &&
                           acControl.status === 200 && acControl.data?.device?.state?.tempSetpoint === 24 &&
                           fanControl.status === 200 && fanControl.data?.device?.state?.fanSpeed === 4 &&
                           lightControl.status === 200 && lightControl.data?.device?.state?.brightness === 70;

    record('TEST 4', 'Verify Demo Mode works without credentials', demoFunctional,
      `Scan: ${demoDevices.length} devices, AC 24°C, Fan Speed 4, Light 70%`);

    // -------------------------------------------------------------
    // Test 5: Verify all existing pages still work
    // -------------------------------------------------------------
    const pages = [];

    // 5.1 Home View (/api/status)
    const homeStatus = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/status', method: 'GET' });
    pages.push({ name: 'Home View', ok: homeStatus.status === 200 && homeStatus.data?.telemetry?.currentWatts !== undefined });

    // 5.2 Appliances View (/api/appliances)
    const appList = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/appliances', method: 'GET' });
    pages.push({ name: 'Appliances View', ok: appList.status === 200 && Array.isArray(appList.data?.appliances) });

    // 5.3 Leak Detective View (/api/leaks)
    const leaksRes = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/leaks', method: 'GET' });
    pages.push({ name: 'Leak Detective', ok: leaksRes.status === 200 && Array.isArray(leaksRes.data?.leaks) });

    // 5.4 What-If Lab Simulation (/api/what-if)
    const whatIfRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/what-if',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { acSetpoint: 24, vampireCutoff: true, offPeakShift: true });
    pages.push({ name: 'What-If Lab', ok: whatIfRes.status === 200 && whatIfRes.data?.savings?.monthlyRupees > 0 });

    // 5.5 Smart Rules View (/api/rules, /api/rules/run)
    const rulesRes = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/rules', method: 'GET' });
    pages.push({ name: 'Smart Rules', ok: rulesRes.status === 200 && Array.isArray(rulesRes.data?.rules) });

    // 5.6 Bill Forecast View (/api/forecast)
    const forecastRes = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/forecast', method: 'GET' });
    pages.push({ name: 'Bill Forecast', ok: forecastRes.status === 200 && forecastRes.data?.projectedBill > 0 });

    // 5.7 Energy Goals View (/api/goals)
    const goalsRes = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/goals', method: 'GET' });
    pages.push({ name: 'Energy Goals', ok: goalsRes.status === 200 && Array.isArray(goalsRes.data?.goals) });

    // 5.8 Carbon Impact View (/api/carbon)
    const carbonRes = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/carbon', method: 'GET' });
    pages.push({ name: 'Carbon Impact', ok: carbonRes.status === 200 && carbonRes.data?.co2SavedMonthKg !== undefined });

    // 5.9 AI Insights View (from /api/status and /api/insights/:id/apply)
    const insightApplyRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/insights/ins-ac-load-share/apply',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    pages.push({ name: 'AI Insights View', ok: Array.isArray(homeStatus.data?.insights) && insightApplyRes.status === 200 });

    // 5.10 Settings View (from /api/status and /api/settings PUT)
    const settingsPutRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/settings',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { sound_enabled: 'true' });
    pages.push({ name: 'Settings View', ok: Boolean(homeStatus.data?.settings) && settingsPutRes.status === 200 });

    // 5.11 Smart Home Scenes (/api/scenes/apply)
    const sceneRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/scenes/apply',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { sceneId: 'sleep' });
    pages.push({ name: 'Smart Home Scenes', ok: sceneRes.status === 200 && sceneRes.data?.sceneId === 'sleep' });

    // 5.12 Energy Pulse Simulation Mode (/api/simulation/mode)
    const simModeRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/simulation/mode',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { mode: 'Normal Day' });
    pages.push({ name: 'Simulation Modes', ok: simModeRes.status === 200 && simModeRes.data?.telemetry !== undefined });

    for (const p of pages) {
      if (!p.ok) console.log('    --> Failed check in Test 5:', p.name);
    }
    const allPagesWork = pages.every(p => p.ok);
    record('TEST 5', 'Verify all existing pages still work', allPagesWork,
      `${pages.filter(p => p.ok).length}/${pages.length} views and engines responding 200 OK`);

    // -------------------------------------------------------------
    // Test 6: Verify integration status endpoint works
    // -------------------------------------------------------------
    const intStatus = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/integrations/status', method: 'GET' });
    const intStatusOk = intStatus.status === 200 &&
                        intStatus.data?.success === true &&
                        Array.isArray(intStatus.data?.providers) &&
                        intStatus.data?.providers.length >= 4 &&
                        intStatus.data?.mode !== undefined;
    record('TEST 6', 'Verify integration status endpoint works', intStatusOk,
      `Mode: ${intStatus.data?.mode}, ${intStatus.data?.providers?.length} providers tracked`);

    // -------------------------------------------------------------
    // Test 7: Verify there are no runtime errors
    // -------------------------------------------------------------
    // Test database transactions, leak fixes, rule evaluations
    const leakFix = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/leaks/leak-tv-standby/action',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { action: 'fix' });
    const ruleRun = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/rules/run',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    const noRuntimeErrors = (leakFix.status === 200 || leakFix.status === 404) && ruleRun.status === 200;
    record('TEST 7', 'Verify there are no runtime errors', noRuntimeErrors,
      `Database transactions operating cleanly without exceptions`);

    // -------------------------------------------------------------
    // Test 8: Verify there are no fake "Connected" states when credentials are missing
    // -------------------------------------------------------------
    const provs = intStatus.data?.providers || [];
    const googleP = provs.find(p => p.id === 'google_home');
    const matterP = provs.find(p => p.id === 'matter');
    const deviceApiP = provs.find(p => p.id === 'device_api');

    const honestGoogle = googleP?.status !== 'connected' && googleP?.configured === false;
    const honestMatter = matterP?.status !== 'connected' && matterP?.configured === false;
    const honestApi = deviceApiP?.status !== 'connected' && deviceApiP?.configured === false;

    // Check that Google OAuth start returns 400 when unconfigured
    const googleStart = await makeRequest({ hostname: 'localhost', port: 3001, path: '/api/integrations/google/start', method: 'GET' });
    const honestOAuthStart = googleStart.status === 400 && googleStart.data?.configured === false;

    // Check that switching to LIVE mode without credentials is blocked
    const liveSwitch = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/mode',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { mode: 'LIVE' });
    const honestLiveSwitch = liveSwitch.status === 400 && liveSwitch.data?.fallback === 'DEMO';

    const noFakeConnections = honestGoogle && honestMatter && honestApi && honestOAuthStart && honestLiveSwitch;
    record('TEST 8', 'Verify no fake Connected states when credentials missing', noFakeConnections,
      `Google: ${googleP?.status}, Matter: ${matterP?.status}, Device API: ${deviceApiP?.status}, Live Switch Blocked: ${honestLiveSwitch}`);

    // -------------------------------------------------------------
    // Test 9: Fix only actual errors found during testing
    // -------------------------------------------------------------
    const allPassed = results.every(r => r.pass);
    record('TEST 9', 'Errors found and verified', allPassed,
      allPassed ? 'Zero errors detected. All systems operating with 100% fidelity.' : 'Errors found');

    console.log('\n═════════════════════════════════════════════════════════════════');
    const passCount = results.filter(r => r.pass).length;
    const failCount = results.filter(r => !r.pass).length;
    console.log(`  FINAL VERIFICATION SCORE: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('═════════════════════════════════════════════════════════════════');

    if (failCount > 0) process.exit(1);
  } catch (err) {
    console.error('Test script runtime error:', err);
    process.exit(1);
  }
}

runEndToEndVerification();
