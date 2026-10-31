// Smart Home Integration Router for WattWise AI
// Google Home OAuth, Matter, Device API, and Demo Provider Endpoints

import express from 'express';
import { providerRegistry } from '../integrations/ProviderRegistry.js';
import { oauthService } from '../services/oauthService.js';
import { telemetryService } from '../services/telemetryService.js';
import { getDb } from '../db/database.js';
import { normalizeDevice, DeviceSource } from '../integrations/CommonDevice.js';

const router = express.Router();

// Helper to log activities
function logActivity(db, eventType, message, messageHi, kwh = 0, cost = 0) {
  const stmt = db.prepare(`
    INSERT INTO activity_log (event_type, message, message_hi, kwh_impact, cost_impact, timestamp)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  stmt.run(eventType, message, messageHi, kwh, cost);
}

// GET /api/integrations/status - Overall Integration & Provider Status
router.get('/status', async (req, res) => {
  try {
    const status = await providerRegistry.getSystemStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (err) {
    console.error('Error fetching integration status:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve integration status' });
  }
});

// POST /api/integrations/mode - Toggle between DEMO and LIVE Integration mode
router.post('/mode', async (req, res) => {
  try {
    const { mode } = req.body;
    const db = getDb();
    const googleProvider = providerRegistry.getProvider(DeviceSource.GOOGLE_HOME);
    const googleStatus = await googleProvider.getStatus();
    const matterProvider = providerRegistry.getProvider(DeviceSource.MATTER);
    const matterStatus = await matterProvider.getStatus();
    const apiProvider = providerRegistry.getProvider(DeviceSource.DEVICE_API);
    const apiStatus = await apiProvider.getStatus();

    const hasLiveAuth = [googleStatus, matterStatus, apiStatus].some(s => s.status === 'connected');

    if (mode === 'LIVE' && !hasLiveAuth) {
      return res.status(400).json({
        success: false,
        error: 'Cannot switch to LIVE INTEGRATION MODE: No external providers are authenticated. Connect Google Home, Matter, or Device API first.',
        fallback: 'DEMO'
      });
    }

    const newMode = await providerRegistry.setMode(mode);
    logActivity(
      db,
      'mode_changed',
      `Switched to ${newMode} Mode`,
      `सिस्टम मोड ${newMode} में बदला गया`
    );

    res.json({
      success: true,
      mode: newMode,
      message: `System operating in ${newMode} Mode.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update system integration mode' });
  }
});

// GET /api/integrations/google/start - Initiate Google Home OAuth
router.get('/google/start', async (req, res) => {
  try {
    const googleProvider = providerRegistry.getProvider(DeviceSource.GOOGLE_HOME);
    if (!googleProvider.isConfigured()) {
      return res.status(400).json({
        success: false,
        configured: false,
        message: 'Google Home integration requires configuration.',
        instructions: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server environment variables.',
        fallback: 'Continue with Demo Home'
      });
    }

    const csrfState = oauthService.generateCsrfState();
    const authUrl = googleProvider.getAuthorizationUrl(csrfState);

    res.json({
      success: true,
      configured: true,
      authorizationUrl: authUrl,
      state: csrfState
    });
  } catch (err) {
    console.error('Error starting Google OAuth:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/integrations/google/callback - Handle Google OAuth Redirect
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).send(`
        <html>
          <body style="background:#0c0f14;color:#f87171;font-family:sans-serif;padding:40px;text-align:center;">
            <h2>Google OAuth Access Denied</h2>
            <p>${error}</p>
            <a href="http://localhost:5173/#bridge" style="color:#f59e0b;text-decoration:none;">Return to WattWise Smart Home</a>
          </body>
        </html>
      `);
    }

    // CSRF Protection Check
    const isStateValid = oauthService.verifyAndConsumeState(state);
    if (!isStateValid) {
      return res.status(403).send(`
        <html>
          <body style="background:#0c0f14;color:#f87171;font-family:sans-serif;padding:40px;text-align:center;">
            <h2>Security Validation Failed</h2>
            <p>Invalid or expired CSRF state token. Please initiate OAuth from WattWise again.</p>
            <a href="http://localhost:5173/#bridge" style="color:#f59e0b;text-decoration:none;">Return to WattWise Smart Home</a>
          </body>
        </html>
      `);
    }

    const googleProvider = providerRegistry.getProvider(DeviceSource.GOOGLE_HOME);
    await googleProvider.exchangeCodeForTokens(code);

    const db = getDb();
    logActivity(
      db,
      'google_home_connected',
      'Google Home account connected successfully via secure OAuth 2.0',
      'गूगल होम खाता सुरक्षित OAuth 2.0 से सफलतापूर्वक जुड़ा'
    );

    // Redirect user back to Vite frontend with success parameter
    res.redirect('http://localhost:5173/#bridge?google_connected=true');
  } catch (err) {
    console.error('Error handling Google OAuth callback:', err);
    res.status(500).send(`
      <html>
        <body style="background:#0c0f14;color:#f87171;font-family:sans-serif;padding:40px;text-align:center;">
          <h2>Google Authentication Failed</h2>
          <p>${err.message}</p>
          <a href="http://localhost:5173/#bridge" style="color:#f59e0b;text-decoration:none;">Return to WattWise Smart Home</a>
        </body>
      </html>
    `);
  }
});

// POST /api/integrations/google/disconnect - Disconnect Google Home
router.post('/google/disconnect', async (req, res) => {
  try {
    const googleProvider = providerRegistry.getProvider(DeviceSource.GOOGLE_HOME);
    await googleProvider.disconnect();

    const db = getDb();
    logActivity(
      db,
      'google_home_disconnected',
      'Google Home disconnected; tokens revoked',
      'गूगल होम डिस्कनेक्ट किया गया'
    );

    res.json({
      success: true,
      status: 'disconnected',
      message: 'Google Home disconnected and credentials revoked.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to disconnect Google Home' });
  }
});

// GET /api/integrations/google/status - Google Home Status
router.get('/google/status', async (req, res) => {
  try {
    const googleProvider = providerRegistry.getProvider(DeviceSource.GOOGLE_HOME);
    const status = await googleProvider.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get Google Home status' });
  }
});

// POST /api/integrations/scan - Scan devices from selected provider
router.post('/scan', async (req, res) => {
  try {
    const { providerId } = req.body;
    const provider = providerRegistry.getProvider(providerId || 'demo');
    const result = await provider.scanDevices();

    // Check if result has devices array or is an array itself
    const devices = Array.isArray(result) ? result : (result.devices || []);
    const configured = result.configured !== undefined ? result.configured : true;
    const message = result.message || `Discovered ${devices.length} devices from ${provider.getProviderName()}`;

    res.json({
      success: true,
      providerId: provider.getProviderId(),
      providerName: provider.getProviderName(),
      configured,
      message,
      devices
    });
  } catch (err) {
    console.error('Error scanning devices:', err);
    res.status(500).json({ success: false, error: `Scan failed: ${err.message}` });
  }
});

// POST /api/integrations/devices/add - Add discovered devices to WattWise
router.post('/devices/add', async (req, res) => {
  try {
    const { devices } = req.body;
    if (!Array.isArray(devices) || devices.length === 0) {
      return res.status(400).json({ success: false, error: 'No devices provided to add' });
    }

    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT INTO appliances (
        id, name, name_hi, category, room, power_watts, baseline_watts, is_on,
        daily_hours, is_priority, schedule_start, schedule_end, schedule_enabled,
        efficiency_rating, temp_setpoint, standby_watts, vampire_active,
        connection_type, is_connected, device_speed, brightness, water_temp,
        smart_saving_active, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        room = excluded.room,
        power_watts = excluded.power_watts,
        connection_type = excluded.connection_type,
        is_connected = 1,
        updated_at = datetime('now')
    `);

    let addedCount = 0;
    const tx = db.transaction(() => {
      for (const d of devices) {
        const norm = normalizeDevice(d);
        insertStmt.run(
          norm.id,
          norm.name,
          norm.nameHi,
          norm.type.toLowerCase(),
          norm.room,
          norm.powerWatts,
          norm.baselineWatts,
          norm.state.isOn ? 1 : 0,
          4.5,
          0,
          '00:00',
          '23:59',
          0,
          'Smart Connected',
          norm.state.tempSetpoint || 24.0,
          norm.state.standbyWatts || 0,
          norm.state.vampireActive ? 1 : 0,
          norm.source || 'demo',
          1,
          norm.state.fanSpeed || 3,
          norm.state.brightness || 100,
          norm.state.waterTemp || 55.0,
          0
        );
        addedCount++;
      }
    });

    tx();

    logActivity(
      db,
      'devices_added',
      `Added ${addedCount} smart device(s) to WattWise home network`,
      `${addedCount} नए स्मार्ट उपकरण जोड़े गए`
    );

    const updatedAppliances = db.prepare('SELECT * FROM appliances ORDER BY power_watts DESC').all();
    res.json({
      success: true,
      addedCount,
      message: `Successfully added ${addedCount} device(s) to WattWise.`,
      appliances: updatedAppliances
    });
  } catch (err) {
    console.error('Error adding devices:', err);
    res.status(500).json({ success: false, error: 'Failed to add devices' });
  }
});

// POST /api/integrations/devices/:id/control - Execute control action through provider
router.post('/devices/:id/control', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, value } = req.body;
    const db = getDb();

    const appliance = db.prepare('SELECT * FROM appliances WHERE id = ?').get(id);
    if (!appliance) {
      return res.status(404).json({ success: false, error: `Device ${id} not found` });
    }

    const provider = providerRegistry.getProvider(appliance.connection_type || 'demo');

    let success = false;
    switch (action) {
      case 'power':
        success = await provider.setPower(id, Boolean(value));
        break;
      case 'temperature':
        success = await provider.setTemperature(id, Number(value));
        break;
      case 'brightness':
        success = await provider.setBrightness(id, Number(value));
        break;
      case 'fan_speed':
        success = await provider.setFanSpeed(id, Number(value));
        break;
      default:
        return res.status(400).json({ success: false, error: `Unsupported control action: ${action}` });
    }

    const updated = db.prepare('SELECT * FROM appliances WHERE id = ?').get(id);
    const norm = normalizeDevice(updated);

    // Compute normalized telemetry
    const allAppliances = db.prepare('SELECT * FROM appliances').all();
    const allNorm = allAppliances.map(a => normalizeDevice(a));
    const fleetTelemetry = telemetryService.computeFleetTelemetry(allNorm);

    res.json({
      success,
      device: norm,
      telemetry: fleetTelemetry,
      message: `Updated ${action} for ${appliance.name}`
    });
  } catch (err) {
    console.error('Error controlling device:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/integrations/matter/commission - Commission Matter Device
router.post('/matter/commission', async (req, res) => {
  try {
    const { pairingCode } = req.body;
    const matterProvider = providerRegistry.getProvider(DeviceSource.MATTER);
    const result = await matterProvider.commissionDevice(pairingCode);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/integrations/api-device/test - Test Cloud Device API Gateway
router.post('/api-device/test', async (req, res) => {
  try {
    const apiProvider = providerRegistry.getProvider(DeviceSource.DEVICE_API);
    const result = await apiProvider.testConnection();

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
