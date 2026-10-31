import express from 'express';
import { getDb, seedDatabase } from '../db/database.js';
import {
  computeTelemetry,
  generateInsights,
  calculateWhatIfSimulation,
  calculateSlabCost,
  CO2_PER_KWH,
  CO2_PER_TREE_MONTH,
  CO2_PER_EV_KM
} from '../engine/intelligence.js';

const router = express.Router();

// Helper to get all settings as an object
function getSettingsMap(db) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}

// Log activity helper
function logActivity(db, eventType, message, messageHi, kwh = 0, cost = 0) {
  const stmt = db.prepare(`
    INSERT INTO activity_log (event_type, message, message_hi, kwh_impact, cost_impact, timestamp)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  stmt.run(eventType, message, messageHi, kwh, cost);
}

// GET /api/status - Comprehensive snapshot for dashboard
router.get(['/status', '/dashboard'], (req, res) => {
  try {
    const db = getDb();
    const appliances = db.prepare('SELECT * FROM appliances ORDER BY is_on DESC, power_watts DESC').all();
    const leaks = db.prepare("SELECT * FROM leaks WHERE status = 'active' ORDER BY waste_cost_daily DESC").all();
    const rules = db.prepare('SELECT * FROM rules ORDER BY trigger_count DESC').all();
    const goals = db.prepare('SELECT * FROM goals ORDER BY status ASC').all();
    const settings = getSettingsMap(db);
    const recentActivity = db.prepare('SELECT * FROM activity_log ORDER BY id DESC LIMIT 10').all();

    const simulationMode = settings.simulation_mode || 'Normal Day';
    const tariffRate = parseFloat(settings.tariff_kwh || '8.0');
    const tariffModel = settings.tariff_model || 'slab';

    const telemetry = computeTelemetry(appliances, simulationMode, tariffRate, tariffModel);
    const insights = generateInsights(telemetry, appliances, leaks);

    const smartSavingState = {
      isEnabled: settings.smart_saving_enabled === 'true',
      beforeWatts: parseInt(settings.smart_saving_before_watts || '2320', 10),
      afterWatts: parseInt(settings.smart_saving_after_watts || '1690', 10),
      savedWatts: Math.max(0, parseInt(settings.smart_saving_before_watts || '2320', 10) - parseInt(settings.smart_saving_after_watts || '1690', 10)),
      dailyRupeesSaved: Math.round(((parseInt(settings.smart_saving_before_watts || '2320', 10) - parseInt(settings.smart_saving_after_watts || '1690', 10)) * 14 / 1000) * tariffRate),
      monthlyRupeesSaved: Math.round(((parseInt(settings.smart_saving_before_watts || '2320', 10) - parseInt(settings.smart_saving_after_watts || '1690', 10)) * 14 / 1000) * tariffRate * 30),
      optimizedCount: appliances.filter(a => a.smart_saving_active === 1).length
    };

    const dashboardSummary = {
      currentPower: telemetry.currentWatts,
      todayConsumption: telemetry.todayKwh,
      todayCost: telemetry.todayCost,
      efficiencyScore: telemetry.efficiencyScore,
      activeAppliances: appliances.filter(a => a.is_on === 1).length,
      potentialSavings: telemetry.potentialSavingsTodayCost,
      energyTrend: telemetry.hourlyGraph ? telemetry.hourlyGraph.map(h => parseFloat((h.watts / 1000).toFixed(2))) : []
    };

    res.json({
      success: true,
      telemetry,
      appliances,
      leaks,
      rules,
      goals,
      insights,
      settings,
      smartSavingState,
      recentActivity,
      ...dashboardSummary,
      data: {
        ...dashboardSummary,
        telemetry,
        appliances,
        leaks,
        rules,
        goals,
        insights,
        settings,
        smartSavingState,
        recentActivity
      }
    });
  } catch (err) {
    console.error('Error in /api/status:', err);
    res.status(500).json({ success: false, error: 'Internal system error fetching status' });
  }
});

// GET /api/appliances
router.get('/appliances', (req, res) => {
  try {
    const db = getDb();
    const appliances = db.prepare('SELECT * FROM appliances ORDER BY is_on DESC, power_watts DESC').all();
    res.json({ success: true, appliances, data: appliances });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve appliances' });
  }
});

// POST /api/appliances/:id/toggle
router.post('/appliances/:id/toggle', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM appliances WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Appliance not found' });
    }
    const newIsOn = existing.is_on ? 0 : 1;
    db.prepare("UPDATE appliances SET is_on = ?, updated_at = datetime('now') WHERE id = ?").run(newIsOn, id);
    const updated = db.prepare('SELECT * FROM appliances WHERE id = ?').get(id);
    logActivity(
      db,
      'appliance_toggle',
      `${existing.name} toggled ${newIsOn ? 'ON' : 'OFF'}`,
      `${existing.name_hi || existing.name} ${newIsOn ? 'चालू' : 'बंद'} किया गया`,
      newIsOn ? (existing.power_watts / 1000) : -(existing.power_watts / 1000),
      newIsOn ? (existing.power_watts * 8 / 1000) : -(existing.power_watts * 8 / 1000)
    );
    res.json({ success: true, appliance: updated, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle appliance' });
  }
});

// PUT /api/appliances/:id
router.put('/appliances/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const {
      is_on,
      power_watts,
      temp_setpoint,
      schedule_start,
      schedule_end,
      schedule_enabled,
      is_priority,
      daily_hours,
      vampire_active,
      connection_type,
      is_connected,
      device_speed,
      brightness,
      water_temp,
      smart_saving_active
    } = req.body;

    const existing = db.prepare('SELECT * FROM appliances WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Appliance not found' });
    }

    const newIsOn = is_on !== undefined ? (is_on ? 1 : 0) : existing.is_on;
    let newWatts = power_watts !== undefined ? parseFloat(power_watts) : existing.power_watts;
    const newTemp = temp_setpoint !== undefined ? parseFloat(temp_setpoint) : existing.temp_setpoint;
    const newStart = schedule_start !== undefined ? schedule_start : existing.schedule_start;
    const newEnd = schedule_end !== undefined ? schedule_end : existing.schedule_end;
    const newSchedEnabled = schedule_enabled !== undefined ? (schedule_enabled ? 1 : 0) : existing.schedule_enabled;
    const newPriority = is_priority !== undefined ? (is_priority ? 1 : 0) : existing.is_priority;
    const newHours = daily_hours !== undefined ? parseFloat(daily_hours) : existing.daily_hours;
    const newVampire = vampire_active !== undefined ? (vampire_active ? 1 : 0) : existing.vampire_active;
    const newConnType = connection_type !== undefined ? connection_type : (existing.connection_type || 'demo');
    const newIsConnected = is_connected !== undefined ? (is_connected ? 1 : 0) : (existing.is_connected ?? 1);
    const newSpeed = device_speed !== undefined ? parseInt(device_speed, 10) : (existing.device_speed || 3);
    const newBrightness = brightness !== undefined ? parseInt(brightness, 10) : (existing.brightness || 100);
    const newWaterTemp = water_temp !== undefined ? parseFloat(water_temp) : (existing.water_temp || 55.0);
    const newSmartSave = smart_saving_active !== undefined ? (smart_saving_active ? 1 : 0) : (existing.smart_saving_active || 0);

    // Dynamic power recalculations based on specific controls
    if (power_watts === undefined) {
      if (id === 'fan' && device_speed !== undefined) {
        const speedFactors = { 1: 0.35, 2: 0.55, 3: 0.75, 4: 0.90, 5: 1.0 };
        newWatts = Math.round(existing.baseline_watts * (speedFactors[newSpeed] || 0.75));
      } else if (id === 'lights' && brightness !== undefined) {
        newWatts = Math.round(existing.baseline_watts * (Math.max(10, Math.min(100, newBrightness)) / 100));
      } else if (id === 'ac' && temp_setpoint !== undefined) {
        const factor = Math.max(0.7, 1 + (24.0 - newTemp) * 0.06);
        newWatts = Math.round(1450 * factor);
      } else if (id === 'geyser' && water_temp !== undefined) {
        newWatts = newWaterTemp > 52 ? 2000 : 1600;
      }
    }

    const stmt = db.prepare(`
      UPDATE appliances SET
        is_on = ?,
        power_watts = ?,
        temp_setpoint = ?,
        schedule_start = ?,
        schedule_end = ?,
        schedule_enabled = ?,
        is_priority = ?,
        daily_hours = ?,
        vampire_active = ?,
        connection_type = ?,
        is_connected = ?,
        device_speed = ?,
        brightness = ?,
        water_temp = ?,
        smart_saving_active = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(
      newIsOn, newWatts, newTemp, newStart, newEnd, newSchedEnabled,
      newPriority, newHours, newVampire, newConnType, newIsConnected,
      newSpeed, newBrightness, newWaterTemp, newSmartSave, id
    );

    // Activity log if toggled
    if (is_on !== undefined && is_on !== existing.is_on) {
      logActivity(
        db,
        'appliance_toggle',
        `${existing.name} turned ${newIsOn ? 'ON' : 'OFF'} (${newWatts}W)`,
        `${existing.name_hi} को ${newIsOn ? 'चालू' : 'बंद'} किया गया (${newWatts}W)`,
        newIsOn ? (newWatts / 1000) : -(newWatts / 1000),
        newIsOn ? (newWatts * 8 / 1000) : -(newWatts * 8 / 1000)
      );
    }

    const updated = db.prepare('SELECT * FROM appliances WHERE id = ?').get(id);
    res.json({ success: true, appliance: updated });
  } catch (err) {
    console.error('Error updating appliance:', err);
    res.status(500).json({ success: false, error: 'Failed to update appliance' });
  }
});

// GET /api/bridge/status - Smart Home Bridge & Protocol Connection Center
router.get('/bridge/status', (req, res) => {
  try {
    const db = getDb();
    const appliances = db.prepare('SELECT * FROM appliances').all();
    const settings = getSettingsMap(db);

    const lastSyncTime = settings.last_sync_time || 'Just now';

    const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'google_oauth_access_token'").get();
    const isGoogleConnected = Boolean(tokenRow?.value) && settings.google_home_status === 'connected';
    const googleStatus = isGoogleConnected ? 'connected' : (process.env.GOOGLE_CLIENT_ID ? 'ready' : 'ready_for_credentials');

    const protocols = [
      {
        id: 'google_home',
        name: 'Google Home',
        status: googleStatus,
        label: isGoogleConnected ? 'Google Home Connected' : 'Google Home Integration Ready',
        connectedDevicesCount: appliances.filter(a => a.connection_type === 'google_home').length,
        projectId: settings.google_home_project_id || 'wattwise-smart-home-2026',
        lastSyncTime,
        supportedTypes: ['Thermostat', 'Smart Plug', 'Lighting', 'Water Heater']
      },
      {
        id: 'smart_plugs',
        name: 'Smart Plugs & Sockets',
        status: settings.smart_plugs_status || 'connected',
        label: 'Matter & Zigbee Smart Plugs',
        connectedDevicesCount: appliances.filter(a => a.category === 'entertainment' || a.category === 'computing').length,
        lastSyncTime,
        supportedTypes: ['16A Heavy Sockets', '6A Ambient Plugs', 'Energy Monitoring Plugs']
      },
      {
        id: 'smart_lights',
        name: 'Smart Lights & Dimmers',
        status: settings.smart_lights_status || 'connected',
        label: 'Adaptive Ambient Lighting Grid',
        connectedDevicesCount: appliances.filter(a => a.category === 'lighting').length,
        lastSyncTime,
        supportedTypes: ['Warm White Dimmers', 'RGB CCT Tunable', 'Ceiling Panels']
      },
      {
        id: 'matter',
        name: 'Matter Protocol',
        status: 'connected',
        label: 'Matter Over Thread / Wi-Fi',
        fabricId: settings.matter_fabric_id || 'FABRIC-MATTER-IND-0042',
        connectedDevicesCount: appliances.filter(a => a.connection_type === 'matter').length,
        lastSyncTime,
        supportedTypes: ['Inverter AC', 'BLDC Fan', 'Smart Washers', 'Smart Lights']
      },
      {
        id: 'cloud',
        name: 'Cloud Smart Home',
        status: 'connected',
        label: 'MQTT / REST Energy Gateway',
        connectedDevicesCount: appliances.filter(a => a.connection_type === 'cloud').length,
        lastSyncTime,
        supportedTypes: ['Utility Pumps', 'Solar Inverters']
      },
      {
        id: 'demo',
        name: 'Demo Devices',
        status: 'active',
        label: 'Local Telemetry Simulation',
        connectedDevicesCount: appliances.filter(a => a.connection_type === 'demo').length,
        lastSyncTime,
        supportedTypes: ['Microwave', 'Workstation Setup']
      }
    ];

    res.json({
      success: true,
      protocols,
      lastSyncTime,
      totalDevices: appliances.length,
      onlineDevices: appliances.filter(a => a.is_on === 1).length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch bridge status' });
  }
});

// POST /api/bridge/sync - Trigger synchronization of all connected bridge devices
router.post('/bridge/sync', (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_sync_time', ?)").run(now);
    logActivity(
      db,
      'bridge_synced',
      `Smart Home Bridge synced: all protocols reporting 100% telemetry fidelity (${now})`,
      `स्मार्ट होम ब्रिज सफलतापूर्वक सिंक हुआ (${now})`
    );
    res.json({ success: true, lastSyncTime: now, message: 'All smart home protocols and devices synchronized.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to synchronize bridge' });
  }
});

// POST /api/bridge/disconnect - Disconnect a smart service protocol
router.post('/bridge/disconnect', (req, res) => {
  try {
    const db = getDb();
    const { protocolId } = req.body;
    const proto = protocolId || 'google_home';
    const key = `${proto}_status`;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, 'disconnected')").run(key);

    if (proto === 'google_home') {
      db.prepare("UPDATE appliances SET is_connected = 0 WHERE connection_type = 'google_home'").run();
    }

    logActivity(db, 'bridge_disconnected', `Disconnected service: ${proto}`, `${proto} सेवा डिस्कनेक्ट की गई`);
    res.json({ success: true, protocolId: proto, status: 'disconnected', message: `Service ${proto} disconnected.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to disconnect service' });
  }
});

// POST /api/bridge/connect - Connect or commission a smart service protocol with optional device selection
router.post('/bridge/connect', (req, res) => {
  try {
    const db = getDb();
    const { protocolId, deviceIds } = req.body;
    const proto = protocolId || 'google_home';
    const key = `${proto}_status`;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, 'connected')").run(key);

    if (Array.isArray(deviceIds) && deviceIds.length > 0) {
      const placeholders = deviceIds.map(() => '?').join(',');
      db.prepare(`UPDATE appliances SET is_connected = 1 WHERE id IN (${placeholders})`).run(...deviceIds);
    } else {
      db.prepare("UPDATE appliances SET is_connected = 1 WHERE connection_type = ?").run(proto);
    }

    logActivity(
      db,
      'bridge_connected',
      `Connected ${proto} integration: ${Array.isArray(deviceIds) ? deviceIds.length : 'all'} devices linked to WattWise`,
      `${proto} एकीकरण सफलतापूर्वक जोड़ा गया`
    );
    res.json({ success: true, protocolId: proto, status: 'connected', message: `${proto} connected successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to connect service' });
  }
});

// POST /api/bridge/scan - Animated Multi-step Device Discovery
router.post('/bridge/scan', (req, res) => {
  try {
    const db = getDb();
    const appliances = db.prepare('SELECT * FROM appliances').all();

    const discoveredDevices = appliances.map(a => ({
      id: a.id,
      name: a.name,
      name_hi: a.name_hi,
      room: a.room,
      status: a.is_on ? 'online' : 'standby',
      currentWatts: a.is_on ? a.power_watts : (a.vampire_active ? a.standby_watts : 0),
      todayKwh: parseFloat(((a.is_on ? a.power_watts * a.daily_hours : 0) / 1000).toFixed(2)),
      estDailyCost: Math.round(((a.is_on ? a.power_watts * a.daily_hours : 0) / 1000) * 8.0),
      efficiency: a.efficiency_rating,
      is_on: a.is_on === 1,
      protocol: a.connection_type === 'matter' ? 'Matter' : a.connection_type === 'google_home' ? 'Google Home' : a.connection_type === 'cloud' ? 'Cloud Smart Home' : 'Demo Device',
      connectionType: a.connection_type === 'demo' ? 'Demo Device' : 'Connected',
      capabilities: a.id === 'ac' ? ['power', 'temperature', 'eco_mode'] : a.id === 'fan' ? ['power', 'speed_1_to_5', 'timer'] : a.id === 'lights' ? ['power', 'brightness', 'warm_cool'] : a.id === 'geyser' ? ['power', 'temperature', 'auto_cutoff'] : ['power', 'timer']
    }));

    res.json({
      success: true,
      scanSteps: [
        'Searching your smart home...',
        'Discovering devices on Matter & Google Home...',
        'Reading energy telemetry & capabilities...',
        'Building your home energy map...'
      ],
      discoveredDevices
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to scan devices' });
  }
});

// POST /api/smart-saving - Toggle System-Wide Smart Saving Mode
router.post('/smart-saving', (req, res) => {
  try {
    const db = getDb();
    const { enabled, enable } = req.body;
    const isEnabling = Boolean(enabled !== undefined ? enabled : enable);

    const appliances = db.prepare('SELECT * FROM appliances').all();
    const beforeWatts = appliances.reduce((sum, a) => sum + (a.is_on ? a.power_watts : (a.vampire_active ? a.standby_watts : 0)), 0);

    if (isEnabling) {
      // 1. Tune AC to 24°C Eco
      db.prepare("UPDATE appliances SET temp_setpoint = 24.0, power_watts = 1220, smart_saving_active = 1 WHERE id = 'ac'").run();

      // 2. Cut Geyser if idle or set auto-cutoff
      db.prepare("UPDATE appliances SET is_on = 0, smart_saving_active = 1 WHERE id = 'geyser'").run();

      // 3. Cut phantom standby vampire power
      db.prepare("UPDATE appliances SET vampire_active = 0, standby_watts = 2, smart_saving_active = 1 WHERE id IN ('tv', 'laptop')").run();

      // 4. Set Fan to eco level 3 (45W)
      db.prepare("UPDATE appliances SET device_speed = 3, power_watts = 45, smart_saving_active = 1 WHERE id = 'fan'").run();

      // 5. Dim Lights to 70% (77W)
      db.prepare("UPDATE appliances SET brightness = 70, power_watts = 77, smart_saving_active = 1 WHERE id = 'lights'").run();

      const afterAppliances = db.prepare('SELECT * FROM appliances').all();
      const afterWatts = afterAppliances.reduce((sum, a) => sum + (a.is_on ? a.power_watts : (a.vampire_active ? a.standby_watts : 0)), 0);

      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('smart_saving_enabled', 'true')").run();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('smart_saving_before_watts', ?)").run(String(beforeWatts));
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('smart_saving_after_watts', ?)").run(String(afterWatts));

      logActivity(
        db,
        'smart_saving_engaged',
        `Smart Saving Mode ENGAGED: Power dropped from ${beforeWatts}W → ${afterWatts}W (Saved ${beforeWatts - afterWatts}W)`,
        `स्मार्ट सेविंग मोड सक्रिय: लोड ${beforeWatts}W से घटकर ${afterWatts}W हुआ (${beforeWatts - afterWatts}W की बचत)`,
        (beforeWatts - afterWatts) * 14 / 1000,
        (beforeWatts - afterWatts) * 14 * 8 / 1000
      );
    } else {
      // Disengage: reset smart_saving_active flags
      db.prepare("UPDATE appliances SET smart_saving_active = 0").run();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('smart_saving_enabled', 'false')").run();

      logActivity(
        db,
        'smart_saving_disengaged',
        'Smart Saving Mode Disengaged: Appliances returned to standard settings',
        'स्मार्ट सेविंग मोड बंद: उपकरण सामान्य सेटिंग्स पर वापस'
      );
    }

    const settings = getSettingsMap(db);
    const updatedAppliances = db.prepare('SELECT * FROM appliances').all();
    const telemetry = computeTelemetry(updatedAppliances, settings.simulation_mode || 'Normal Day');
    const finalBefore = parseInt(settings.smart_saving_before_watts || String(beforeWatts), 10);
    const finalSaved = Math.max(0, finalBefore - telemetry.currentWatts);
    const dailyRupees = Math.round((finalSaved * 14 / 1000) * 8.0);
    const monthlyRupees = dailyRupees * 30;

    const smartSavingState = {
      isEnabled: isEnabling,
      beforeWatts: finalBefore,
      afterWatts: telemetry.currentWatts,
      savedWatts: finalSaved,
      dailyRupeesSaved: dailyRupees,
      monthlyRupeesSaved: monthlyRupees,
      optimizedCount: isEnabling ? 4 : 0
    };

    res.json({
      success: true,
      enabled: isEnabling,
      beforeWatts: finalBefore,
      afterWatts: telemetry.currentWatts,
      savedWatts: finalSaved,
      dailyRupeesSaved: dailyRupees,
      monthlyRupeesSaved: monthlyRupees,
      smartSavingState,
      telemetry,
      appliances: updatedAppliances
    });
  } catch (err) {
    console.error('Error toggling smart saving:', err);
    res.status(500).json({ success: false, error: 'Failed to toggle Smart Saving Mode' });
  }
});

// GET /api/leaks
router.get('/leaks', (req, res) => {
  try {
    const db = getDb();
    const leaks = db.prepare('SELECT * FROM leaks ORDER BY status ASC, waste_cost_daily DESC').all();
    res.json({ success: true, leaks, data: leaks });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve leaks' });
  }
});

// POST /api/leaks/:id/action & /api/leaks/:id/fix
router.post(['/leaks/:id/action', '/leaks/:id/fix'], (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const action = req.body?.action || 'fix'; // default to 'fix' if called via /fix

    const leak = db.prepare('SELECT * FROM leaks WHERE id = ?').get(id);
    if (!leak) {
      return res.status(404).json({ success: false, error: 'Leak record not found' });
    }

    if (action === 'fix') {
      const app = db.prepare('SELECT * FROM appliances WHERE id = ?').get(leak.appliance_id);
      if (app) {
        if (leak.leak_type === 'vampire_standby') {
          db.prepare("UPDATE appliances SET vampire_active = 0, standby_watts = 2 WHERE id = ?").run(leak.appliance_id);
        } else if (leak.leak_type === 'inefficient_setpoint') {
          db.prepare("UPDATE appliances SET temp_setpoint = 24.0, power_watts = 1220 WHERE id = ?").run(leak.appliance_id);
        } else if (leak.leak_type === 'unusual_spike' || leak.leak_type === 'forgotten_on') {
          db.prepare("UPDATE appliances SET is_on = 0 WHERE id = ?").run(leak.appliance_id);
        }
      }

      db.prepare("UPDATE leaks SET status = 'fixed' WHERE id = ?").run(id);

      logActivity(
        db,
        'leak_fixed',
        `Leak Resolved: ${leak.title}. Saved ~${leak.waste_kwh_daily} kWh/day (₹${leak.waste_cost_daily})`,
        `लीक समाधान: ${leak.title_hi}। ~${leak.waste_kwh_daily} kWh/दिन (₹${leak.waste_cost_daily}) की बचत`,
        leak.waste_kwh_daily,
        leak.waste_cost_daily
      );
    } else if (action === 'ignore') {
      db.prepare("UPDATE leaks SET status = 'ignored' WHERE id = ?").run(id);
    }

    res.json({ success: true, message: `Leak marked as ${action === 'fix' ? 'fixed' : 'ignored'}` });
  } catch (err) {
    console.error('Error handling leak action:', err);
    res.status(500).json({ success: false, error: 'Failed to process leak action' });
  }
});

// POST /api/what-if - Dynamic scenario projection
router.post(['/what-if', '/whatif', '/whatif/calculate'], (req, res) => {
  try {
    const params = req.body || {};
    // Map any frontend params if needed
    const mappedParams = {
      acTemp: params.acTemp !== undefined ? params.acTemp : (params.ac_temp_delta !== undefined ? (24 - params.ac_temp_delta) : 24),
      acHours: params.acHours !== undefined ? params.acHours : (params.ac_hours !== undefined ? Math.max(1, 6.5 - params.ac_hours) : 6.0),
      geyserMinutes: params.geyserMinutes !== undefined ? params.geyserMinutes : (params.geyser_hours !== undefined ? Math.max(10, Math.round(params.geyser_hours * 60)) : 25),
      fanHours: params.fanHours !== undefined ? params.fanHours : (params.fan_hours !== undefined ? Math.max(2, 12 - params.fan_hours) : 12),
      bldcFanUpgrade: params.bldcFanUpgrade !== undefined ? params.bldcFanUpgrade : true,
      peakHourShiftPct: params.peakHourShiftPct !== undefined ? params.peakHourShiftPct : (params.peak_usage_pct || 30),
      ...params
    };
    const result = calculateWhatIfSimulation(mappedParams);

    const currentBill = result.current?.monthlyCost || 3120;
    const optimizedBill = result.optimized?.monthlyCost || 2480;
    const savingsVal = result.savings?.monthlyRupees || Math.max(0, currentBill - optimizedBill);
    const currentConsumption = result.current?.monthlyKwh || 390;
    const optimizedConsumption = result.optimized?.monthlyKwh || 310;
    const currentCO2 = Math.round(currentConsumption * 0.82);
    const optimizedCO2 = Math.round(optimizedConsumption * 0.82);

    res.json({
      success: true,
      ...result,
      currentBill,
      optimizedBill,
      savings: savingsVal,
      currentConsumption,
      optimizedConsumption,
      currentCO2,
      optimizedCO2,
      data: {
        currentBill,
        optimizedBill,
        savings: savingsVal,
        currentConsumption,
        optimizedConsumption,
        currentCO2,
        optimizedCO2,
        ...result
      }
    });
  } catch (err) {
    console.error('Error in what-if simulation:', err);
    res.status(500).json({ success: false, error: 'Failed to compute what-if simulation' });
  }
});

// POST /api/what-if/apply - Apply the what-if plan to active appliances
router.post(['/what-if/apply', '/whatif/apply'], (req, res) => {
  try {
    const db = getDb();
    const { acTemp, acHours, geyserMinutes, bldcFanUpgrade } = req.body;

    if (acTemp !== undefined) {
      const acWatts = Math.round(1450 * Math.max(0.65, 1.12 - ((acTemp - 22) * 0.06)));
      db.prepare("UPDATE appliances SET temp_setpoint = ?, power_watts = ?, daily_hours = ? WHERE id = 'ac'")
        .run(parseFloat(acTemp), acWatts, parseFloat(acHours || 6.5));
    }

    if (geyserMinutes !== undefined) {
      db.prepare("UPDATE appliances SET daily_hours = ? WHERE id = 'geyser'")
        .run(parseFloat(geyserMinutes) / 60);
    }

    if (bldcFanUpgrade) {
      db.prepare("UPDATE appliances SET power_watts = 84, baseline_watts = 84, efficiency_rating = 'BLDC 28W High Efficiency' WHERE id = 'fan'")
        .run();
    }

    logActivity(
      db,
      'whatif_applied',
      `Applied What-If Optimization Plan: AC Setpoint ${acTemp}°C, Geyser ${geyserMinutes}m runtime`,
      `व्हाट-इफ योजना लागू की गई: एसी सेटपॉइंट ${acTemp}°C, गीज़र ${geyserMinutes} मिनट`,
      1.8,
      14.4
    );

    res.json({ success: true, message: 'Optimized What-If configuration successfully applied to your home' });
  } catch (err) {
    console.error('Error applying what-if plan:', err);
    res.status(500).json({ success: false, error: 'Failed to apply what-if configuration' });
  }
});

// Rules CRUD
router.get('/rules', (req, res) => {
  try {
    const db = getDb();
    const rules = db.prepare('SELECT * FROM rules ORDER BY is_enabled DESC, trigger_count DESC').all();
    res.json({ success: true, rules, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch rules' });
  }
});

router.post('/rules', (req, res) => {
  try {
    const db = getDb();
    const { title, title_hi, description, description_hi, trigger_type, threshold_val, action_type, target_appliance_id } = req.body;
    const id = `rule-${Date.now()}`;

    const stmt = db.prepare(`
      INSERT INTO rules (id, title, title_hi, description, description_hi, trigger_type, threshold_val, action_type, target_appliance_id, is_enabled, trigger_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `);
    stmt.run(
      id,
      title || 'Custom Automation Rule',
      title_hi || 'कस्टम ऑटोमेशन नियम',
      description || 'User configured energy rule',
      description_hi || 'उपयोगकर्ता द्वारा कॉन्फ़िगर किया गया नियम',
      trigger_type || 'power_threshold',
      parseFloat(threshold_val || 0),
      action_type || 'turn_off_non_essential',
      target_appliance_id || null
    );

    logActivity(db, 'rule_created', `New Smart Rule created: ${title}`, `नया स्मार्ट नियम बनाया गया: ${title_hi || title}`);
    res.json({ success: true, id, message: 'Rule created successfully' });
  } catch (err) {
    console.error('Error creating rule:', err);
    res.status(500).json({ success: false, error: 'Failed to create rule' });
  }
});

router.put('/rules/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { is_enabled } = req.body;

    const existing = db.prepare('SELECT * FROM rules WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    const newEnabled = is_enabled !== undefined ? (is_enabled ? 1 : 0) : existing.is_enabled;
    db.prepare('UPDATE rules SET is_enabled = ? WHERE id = ?').run(newEnabled, id);

    res.json({ success: true, message: `Rule ${newEnabled ? 'enabled' : 'disabled'}` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update rule' });
  }
});

router.delete('/rules/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    db.prepare('DELETE FROM rules WHERE id = ?').run(id);
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete rule' });
  }
});

// Trigger a rule manually to test execution
router.post(['/rules/:id/trigger', '/rules/:id/execute'], (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const rule = db.prepare('SELECT * FROM rules WHERE id = ?').get(id);
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    if (rule.action_type === 'turn_off_non_essential') {
      db.prepare("UPDATE appliances SET is_on = 0 WHERE category IN ('entertainment', 'lighting') AND is_priority = 0").run();
    } else if (rule.action_type === 'cut_standby') {
      db.prepare("UPDATE appliances SET vampire_active = 0, standby_watts = 2 WHERE category IN ('entertainment', 'computing')").run();
    } else if (rule.action_type === 'shed_heavy_load') {
      db.prepare("UPDATE appliances SET is_on = 0 WHERE id = 'pump' OR id = 'washer'").run();
    } else if (rule.action_type === 'adjust_setpoint') {
      db.prepare("UPDATE appliances SET temp_setpoint = 25.0, power_watts = 1150 WHERE id = 'ac'").run();
    }

    db.prepare("UPDATE rules SET last_triggered_at = datetime('now'), trigger_count = trigger_count + 1 WHERE id = ?").run(id);

    logActivity(
      db,
      'rule_executed',
      `Manual test executed rule: "${rule.title}"`,
      `नियम परीक्षण सक्रिय: "${rule.title_hi}"`,
      0.45,
      3.60
    );

    res.json({ success: true, message: `Rule "${rule.title}" triggered and executed successfully!` });
  } catch (err) {
    console.error('Error triggering rule:', err);
    res.status(500).json({ success: false, error: 'Failed to execute rule' });
  }
});

// Goals CRUD
router.get('/goals', (req, res) => {
  try {
    const db = getDb();
    const goals = db.prepare('SELECT * FROM goals ORDER BY status ASC, created_at DESC').all();
    res.json({ success: true, goals, data: goals });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch goals' });
  }
});

router.post('/goals', (req, res) => {
  try {
    const db = getDb();
    const { title, title_hi, description, target_metric, target_value, unit } = req.body;
    const id = `goal-${Date.now()}`;

    const stmt = db.prepare(`
      INSERT INTO goals (id, title, title_hi, description, target_metric, target_value, current_value, unit, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'active', datetime('now'))
    `);
    stmt.run(
      id,
      title || 'Custom Energy Goal',
      title_hi || 'कस्टम ऊर्जा लक्ष्य',
      description || 'Tracked energy reduction goal',
      target_metric || 'bill_reduction_pct',
      parseFloat(target_value || 10),
      unit || '%'
    );

    logActivity(db, 'goal_created', `New Goal set: ${title}`, `नया लक्ष्य निर्धारित: ${title_hi || title}`);
    res.json({ success: true, id, message: 'Goal added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create goal' });
  }
});

router.post('/goals/:id/complete', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }

    db.prepare("UPDATE goals SET status = 'completed', current_value = target_value WHERE id = ?").run(id);

    logActivity(
      db,
      'goal_achieved',
      `Goal Achieved: "${goal.title}"! Target accomplished.`,
      `लक्ष्य पूरा हुआ: "${goal.title_hi}"! बधाई हो।`
    );

    res.json({
      success: true,
      message: `Congratulations! Goal "${goal.title}" completed!`,
      goal: { ...goal, status: 'completed', current_value: goal.target_value }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to complete goal' });
  }
});

// GET /api/forecast - Detailed electricity bill projection
router.get(['/forecast', '/bill-forecast'], (req, res) => {
  try {
    const db = getDb();
    const appliances = db.prepare('SELECT * FROM appliances').all();
    const settings = getSettingsMap(db);
    const simulationMode = settings.simulation_mode || 'Normal Day';
    const tariffRate = parseFloat(settings.tariff_kwh || '8.0');
    const tariffModel = settings.tariff_model || 'slab';

    const telemetry = computeTelemetry(appliances, simulationMode, tariffRate, tariffModel);

    const projectedMonthlyKwh = Math.round(telemetry.todayKwh * 30);
    const projectedBill = Math.round(calculateSlabCost(projectedMonthlyKwh));
    const previousMonthKwh = Math.round(projectedMonthlyKwh * 1.14);
    const previousMonthBill = Math.round(calculateSlabCost(previousMonthKwh));
    const optimizedMonthlyKwh = Math.round(projectedMonthlyKwh * 0.78);
    const optimizedBill = Math.round(calculateSlabCost(optimizedMonthlyKwh));

    const slabs = [
      { name: 'Slab 1 (0–100 kWh)', rate: '₹4.20 / unit', limit: 100, consumed: Math.min(projectedMonthlyKwh, 100), cost: Math.min(projectedMonthlyKwh, 100) * 4.20 },
      { name: 'Slab 2 (101–200 kWh)', rate: '₹6.50 / unit', limit: 100, consumed: Math.max(0, Math.min(projectedMonthlyKwh - 100, 100)), cost: Math.max(0, Math.min(projectedMonthlyKwh - 100, 100)) * 6.50 },
      { name: 'Slab 3 (201–400 kWh)', rate: '₹8.00 / unit', limit: 200, consumed: Math.max(0, Math.min(projectedMonthlyKwh - 200, 200)), cost: Math.max(0, Math.min(projectedMonthlyKwh - 200, 200)) * 8.00 },
      { name: 'Slab 4 (>400 kWh)', rate: '₹10.20 / unit', limit: 'Above 400', consumed: Math.max(0, projectedMonthlyKwh - 400), cost: Math.max(0, projectedMonthlyKwh - 400) * 10.20 }
    ];

    const dailyProjection = Array.from({ length: 30 }, (_, i) => Math.round(telemetry.todayCost * (i + 1)));

    res.json({
      success: true,
      currentUsageKwhToday: telemetry.todayKwh,
      currentUsage: telemetry.todayKwh,
      projectedMonthlyKwh,
      projectedMonthly: projectedMonthlyKwh,
      projectedBill,
      previousMonthKwh,
      previousMonth: previousMonthBill,
      previousMonthBill,
      optimizedMonthlyKwh,
      optimizedBill,
      potentialSavings: Math.max(0, projectedBill - optimizedBill),
      tariffRate,
      tariffModel,
      slabs,
      dailyProjection,
      data: {
        currentUsage: telemetry.todayKwh,
        projectedMonthly: projectedMonthlyKwh,
        projectedBill,
        previousMonth: previousMonthBill,
        optimizedBill,
        dailyProjection
      }
    });
  } catch (err) {
    console.error('Error in /api/forecast:', err);
    res.status(500).json({ success: false, error: 'Failed to compute forecast' });
  }
});

// GET /api/carbon - Detailed carbon footprint
router.get(['/carbon', '/carbon-impact'], (req, res) => {
  try {
    const db = getDb();
    const appliances = db.prepare('SELECT * FROM appliances').all();
    const settings = getSettingsMap(db);
    const telemetry = computeTelemetry(appliances, settings.simulation_mode || 'Normal Day');

    const co2SavedTodayKg = Math.round(telemetry.potentialSavingsTodayKwh * CO2_PER_KWH * 100) / 100;
    const co2SavedMonthKg = Math.round(telemetry.potentialSavingsTodayKwh * 30 * CO2_PER_KWH * 10) / 10;
    const treesEquivalent = Math.round((co2SavedMonthKg / CO2_PER_TREE_MONTH) * 10) / 10;
    const evKmEquivalent = Math.round(co2SavedMonthKg / CO2_PER_EV_KM);

    const impactStory = `By optimizing your dual-inverter AC setpoint and eliminating ${telemetry.standbyVampireWatts}W of standby vampire draw, your home is on track to avoid ${co2SavedMonthKg} kg of CO₂ emissions this month. This environmental saving is equivalent to the CO₂ absorbed by ${treesEquivalent} mature trees or driving ${evKmEquivalent} kilometers in an electric vehicle.`;
    const impactStoryHi = `अपने एसी को 24°C पर चलाकर और ${telemetry.standbyVampireWatts}W की वैम्पायर बिजली बंद करके, आपका घर इस महीने ${co2SavedMonthKg} किग्रा CO₂ उत्सर्जन रोकने की राह पर है। यह ${treesEquivalent} पूरे पेड़ लगाने या EV से ${evKmEquivalent} किमी चलने के बराबर है।`;

    res.json({
      success: true,
      co2SavedTodayKg,
      co2SavedToday: co2SavedTodayKg,
      co2SavedMonthKg,
      co2SavedMonth: co2SavedMonthKg,
      treesEquivalent,
      equivalentTrees: treesEquivalent,
      evKmEquivalent,
      equivalentEvKm: evKmEquivalent,
      currentDailyCo2Kg: telemetry.co2TodayKg,
      impactStory,
      impactStoryHi,
      data: {
        co2SavedToday: co2SavedTodayKg,
        co2SavedMonth: co2SavedMonthKg,
        equivalentTrees: treesEquivalent,
        equivalentEvKm: evKmEquivalent,
        impactStory
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch carbon impact' });
  }
});

// POST /api/insights/:id/apply - 1-Click apply recommendation from insight
router.post('/insights/:id/apply', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    if (id === 'ins-ac-load-share' || id === 'ins-ac-setpoint') {
      db.prepare("UPDATE appliances SET temp_setpoint = 24.0, power_watts = 1220 WHERE id = 'ac'").run();
      db.prepare("UPDATE leaks SET status = 'fixed' WHERE appliance_id = 'ac'").run();
      logActivity(db, 'recommendation_applied', 'AC set to 24°C Eco Comfort Mode', 'एसी को 24°C इको कम्फर्ट मोड पर सेट किया गया', 2.9, 23.2);
    } else if (id === 'ins-geyser-runtime') {
      db.prepare("UPDATE appliances SET is_on = 0 WHERE id = 'geyser'").run();
      db.prepare("UPDATE leaks SET status = 'fixed' WHERE appliance_id = 'geyser'").run();
      logActivity(db, 'recommendation_applied', 'Water heater auto-cutoff activated', 'वाटर हीटर ऑटो-कटऑफ सक्रिय किया गया', 1.15, 9.2);
    } else if (id === 'ins-standby-devices' || id === 'ins-vampire-drain') {
      db.prepare("UPDATE appliances SET vampire_active = 0, standby_watts = 2 WHERE category IN ('entertainment', 'computing')").run();
      db.prepare("UPDATE leaks SET status = 'fixed' WHERE leak_type = 'vampire_standby'").run();
      logActivity(db, 'recommendation_applied', 'All phantom standby vampire circuits isolated', 'सभी फैंटम स्टैंडबाय सर्किट बंद किए गए', 0.48, 3.84);
    } else if (id === 'ins-fleet-eco-mode') {
      db.prepare("UPDATE appliances SET temp_setpoint = 24.0, power_watts = 1220 WHERE id = 'ac'").run();
      db.prepare("UPDATE appliances SET vampire_active = 0, standby_watts = 2 WHERE id IN ('tv', 'laptop')").run();
      db.prepare("UPDATE appliances SET device_speed = 3, power_watts = 45 WHERE id = 'fan'").run();
      db.prepare("UPDATE appliances SET brightness = 70, power_watts = 77 WHERE id = 'lights'").run();
      logActivity(db, 'recommendation_applied', 'Smart Home Fleet switched to Eco Mode', 'स्मार्ट होम उपकरणों को इको मोड पर बदला गया', 3.5, 28.0);
    } else if (id === 'ins-evening-peak') {
      db.prepare("UPDATE appliances SET schedule_start = '11:00', schedule_end = '11:45', schedule_enabled = 1 WHERE id = 'pump'").run();
      logActivity(db, 'recommendation_applied', 'Water pump scheduled to 11:00 AM off-peak solar window', 'वाटर पंप को 11:00 AM ऑफ-पीक समय पर शेड्यूल किया गया', 0.75, 6.0);
    }

    res.json({ success: true, message: 'Action successfully applied to home telemetry' });
  } catch (err) {
    console.error('Error applying insight action:', err);
    res.status(500).json({ success: false, error: 'Failed to apply insight action' });
  }
});

// POST /api/scenes/apply - Smart Home Scenes Execution (Sleep, Away, Peak Saver, Morning, Bill Saver)
router.post('/scenes/apply', (req, res) => {
  try {
    const db = getDb();
    const { sceneId } = req.body;

    const tx = db.transaction(() => {
      if (sceneId === 'sleep') {
        db.prepare("UPDATE appliances SET is_on = 0, vampire_active = 0 WHERE id = 'tv'").run();
        db.prepare("UPDATE appliances SET is_on = 0 WHERE id = 'lights'").run();
        db.prepare("UPDATE appliances SET temp_setpoint = 24.0, power_watts = 1220, is_on = 1 WHERE id = 'ac'").run();
        db.prepare("UPDATE appliances SET device_speed = 3, power_watts = 45, is_on = 1 WHERE id = 'fan'").run();
        db.prepare("UPDATE appliances SET is_on = 0 WHERE id IN ('geyser', 'washer', 'microwave', 'pump')").run();
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('active_scene', 'sleep')").run();
        logActivity(db, 'scene_activated', '🌙 Sleep Mode activated: TV & living lights OFF, AC at 24°C, fan on level 3', '🌙 स्लीप मोड चालू: टीवी व लाइटें बंद, एसी 24°C', 2.3, 18.4);
      } else if (sceneId === 'away') {
        db.prepare("UPDATE appliances SET is_on = 0 WHERE id != 'fridge'").run();
        db.prepare("UPDATE appliances SET vampire_active = 0, standby_watts = 2 WHERE id IN ('tv', 'laptop')").run();
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('active_scene', 'away')").run();
        logActivity(db, 'scene_activated', '🏠 Away Mode activated: All non-essential appliances turned OFF, Refrigerator protected', '🏠 अवे मोड चालू: सभी गैर-ज़रूरी उपकरण बंद, केवल फ्रिज चालू', 4.8, 38.4);
      } else if (sceneId === 'peak_saver') {
        db.prepare("UPDATE appliances SET temp_setpoint = 25.0, power_watts = 1150 WHERE id = 'ac'").run();
        db.prepare("UPDATE appliances SET brightness = 60, power_watts = 66 WHERE id = 'lights'").run();
        db.prepare("UPDATE appliances SET is_on = 0 WHERE id IN ('geyser', 'washer', 'pump')").run();
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('active_scene', 'peak_saver')").run();
        logActivity(db, 'scene_activated', '⚡ Peak Saver activated: Heavy loads curtailed, AC trimmed to 25°C, lights dimmed to 60%', '⚡ पीक सेवर चालू: भारी लोड स्थगित, एसी 25°C, लाइट 60%', 3.2, 25.6);
      } else if (sceneId === 'morning') {
        db.prepare("UPDATE appliances SET is_on = 0 WHERE id = 'ac'").run();
        db.prepare("UPDATE appliances SET is_on = 1, water_temp = 55.0 WHERE id = 'geyser'").run();
        db.prepare("UPDATE appliances SET is_on = 1, device_speed = 3, power_watts = 45 WHERE id = 'fan'").run();
        db.prepare("UPDATE appliances SET is_on = 1, brightness = 75, power_watts = 82 WHERE id = 'lights'").run();
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('active_scene', 'morning')").run();
        logActivity(db, 'scene_activated', '☀️ Morning Routine activated: Geyser pre-heated, AC off, ambient morning profile', '☀️ मॉर्निंग रूटीन चालू: गीज़र तैयार, एसी बंद', 1.5, 12.0);
      } else if (sceneId === 'bill_saver') {
        db.prepare("UPDATE appliances SET temp_setpoint = 25.0, power_watts = 1150, smart_saving_active = 1 WHERE id = 'ac'").run();
        db.prepare("UPDATE appliances SET device_speed = 3, power_watts = 45, smart_saving_active = 1 WHERE id = 'fan'").run();
        db.prepare("UPDATE appliances SET brightness = 65, power_watts = 71, smart_saving_active = 1 WHERE id = 'lights'").run();
        db.prepare("UPDATE appliances SET is_on = 0, smart_saving_active = 1 WHERE id IN ('geyser', 'washer')").run();
        db.prepare("UPDATE appliances SET vampire_active = 0, standby_watts = 2, smart_saving_active = 1 WHERE id IN ('tv', 'laptop')").run();
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('active_scene', 'bill_saver')").run();
        logActivity(db, 'scene_activated', '💰 Bill Saver Mode engaged: Aggressive fleet-wide eco parameters applied', '💰 बिल सेवर मोड चालू: सभी उपकरणों पर अधिकतम बचत सेटिंग', 3.8, 30.4);
      }
    });

    tx();

    const updated = db.prepare('SELECT * FROM appliances').all();
    const settings = getSettingsMap(db);
    const telemetry = computeTelemetry(updated, settings.simulation_mode || 'Normal Day');

    res.json({
      success: true,
      sceneId,
      message: `Scene "${sceneId}" successfully applied across smart home`,
      telemetry,
      appliances: updated
    });
  } catch (err) {
    console.error('Error applying scene:', err);
    res.status(500).json({ success: false, error: 'Failed to apply scene' });
  }
});

// POST /api/rules/run - Evaluate and execute active automation rules against live appliance telemetry
router.post('/rules/run', (req, res) => {
  try {
    const db = getDb();
    const appliances = db.prepare('SELECT * FROM appliances').all();
    const rules = db.prepare('SELECT * FROM rules WHERE is_enabled = 1').all();
    const triggered = [];

    const ac = appliances.find(a => a.id === 'ac');
    const totalWatts = appliances.reduce((sum, a) => sum + (a.is_on ? a.power_watts : 0), 0);
    const vampireWatts = appliances.reduce((sum, a) => sum + (a.vampire_active ? a.standby_watts : 0), 0);

    for (const rule of rules) {
      let isTriggered = false;
      let actionMsg = '';

      if (rule.trigger_type === 'power_threshold' && totalWatts > rule.threshold_val) {
        isTriggered = true;
        actionMsg = `Total power ${totalWatts}W exceeded threshold ${rule.threshold_val}W`;
      } else if (rule.id === 'rule-ac-power' || (rule.trigger_type === 'power_threshold' && ac && ac.is_on && ac.power_watts > 1200)) {
        isTriggered = true;
        actionMsg = `AC power draw is ${ac?.power_watts || 1450}W (>1200W threshold)`;
      } else if (rule.trigger_type === 'night_standby' && vampireWatts > 20) {
        isTriggered = true;
        actionMsg = `Standby consumption is ${vampireWatts}W (>20W). Vampire circuits isolated.`;
      } else if (rule.trigger_type === 'occupancy_empty') {
        isTriggered = true;
        actionMsg = 'No occupancy detected: non-essential devices verified idle';
      }

      if (isTriggered) {
        db.prepare("UPDATE rules SET trigger_count = trigger_count + 1, last_triggered_at = datetime('now') WHERE id = ?").run(rule.id);
        logActivity(db, 'rule_triggered', `Automation Triggered: ${rule.title} (${actionMsg})`, `ऑटोमेशन नियम सक्रिय: ${rule.title_hi}`);
        triggered.push({ id: rule.id, title: rule.title, actionMsg });
      }
    }

    res.json({
      success: true,
      triggeredCount: triggered.length,
      triggered,
      message: `${triggered.length} automation rules evaluated successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to run rules evaluation' });
  }
});

// POST /api/simulation/mode - Apply simulation mode using db.transaction
router.post('/simulation/mode', (req, res) => {
  try {
    const db = getDb();
    const { mode } = req.body;
    const modeKey = mode || 'Normal Day';

    const tx = db.transaction(() => {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('simulation_mode', ?)").run(modeKey);

      if (modeKey === 'High Usage' || modeKey === 'high_usage') {
        db.prepare("UPDATE appliances SET is_on = 1 WHERE id IN ('ac', 'tv', 'fan', 'lights', 'geyser', 'washer')").run();
        db.prepare("UPDATE appliances SET temp_setpoint = 19.0, power_watts = 1680 WHERE id = 'ac'").run();
      } else if (modeKey === 'Vacation Mode' || modeKey === 'vacation') {
        db.prepare("UPDATE appliances SET is_on = 0 WHERE id != 'fridge'").run();
        db.prepare("UPDATE appliances SET is_on = 1, power_watts = 110 WHERE id = 'fridge'").run();
      } else if (modeKey === 'Optimized Home' || modeKey === 'optimized') {
        db.prepare("UPDATE appliances SET temp_setpoint = 24.0, power_watts = 1220 WHERE id = 'ac'").run();
        db.prepare("UPDATE appliances SET vampire_active = 0, standby_watts = 2 WHERE id IN ('tv', 'laptop')").run();
        db.prepare("UPDATE appliances SET device_speed = 3, power_watts = 45 WHERE id = 'fan'").run();
        db.prepare("UPDATE appliances SET brightness = 70, power_watts = 77 WHERE id = 'lights'").run();
      } else if (modeKey === 'Peak Hour' || modeKey === 'peak_hour') {
        db.prepare("UPDATE appliances SET is_on = 0 WHERE id IN ('geyser', 'washer', 'pump')").run();
      } else {
        db.prepare("UPDATE appliances SET is_on = 1 WHERE id IN ('fridge', 'fan', 'lights', 'ac', 'laptop')").run();
        db.prepare("UPDATE appliances SET temp_setpoint = 22.0, power_watts = 1450 WHERE id = 'ac'").run();
      }
    });

    tx();

    logActivity(db, 'simulation_mode_changed', `Simulation mode set to: ${modeKey}`, `सिमुलेशन मोड: ${modeKey}`);

    const updated = db.prepare('SELECT * FROM appliances').all();
    const settings = getSettingsMap(db);
    const telemetry = computeTelemetry(updated, modeKey);

    res.json({ success: true, mode: modeKey, telemetry, appliances: updated });
  } catch (err) {
    console.error('Error in /api/simulation/mode:', err);
    res.status(500).json({ success: false, error: `Simulation failed: ${err.message}` });
  }
});

// POST /api/simulation/demo & /api/demo/start - Reset simulation demo baseline
router.post(['/simulation/demo', '/demo/start'], (req, res) => {
  try {
    const db = getDb();
    const tx = db.transaction(() => {
      seedDatabase(db);
    });
    tx();
    res.json({ success: true, message: 'Simulation demo reset to baseline' });
  } catch (err) {
    res.status(500).json({ success: false, error: `Simulation failed: ${err.message}` });
  }
});

// PUT /api/settings
router.put('/settings', (req, res) => {
  try {
    const db = getDb();
    const updates = req.body;

    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(updates)) {
      stmt.run(k, String(v));
    }

    const current = getSettingsMap(db);
    res.json({ success: true, settings: current });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// POST /api/reset & /api/demo/reset - Complete reset of demo state
router.post(['/reset', '/demo/reset'], (req, res) => {
  try {
    const db = getDb();
    seedDatabase(db);
    res.json({ success: true, message: 'All demo data, appliances, leaks, and rules reset to pristine baseline state.' });
  } catch (err) {
    console.error('Error resetting demo:', err);
    res.status(500).json({ success: false, error: 'Failed to reset demo data' });
  }
});

// POST /api/demo/step - Interactive 9-step Hackathon Walkthrough Demo
router.post('/demo/step', (req, res) => {
  try {
    const db = getDb();
    const { step } = req.body;

    if (step === 1) {
      // 1. Discover devices: refresh connections
      db.prepare("UPDATE appliances SET is_connected = 1").run();
      logActivity(db, 'demo_scan', 'Demo Step 1: Smart Home Bridge discovered 10 connected devices', 'डेमो चरण 1: स्मार्ट होम ब्रिज ने 10 उपकरण खोजे');
    } else if (step === 2) {
      // 2. Connect devices
      db.prepare("UPDATE appliances SET is_connected = 1").run();
      logActivity(db, 'demo_connect', 'Demo Step 2: All Matter, Google Home, and Demo devices paired', 'डेमो चरण 2: सभी उपकरण सफलतापूर्वक जोड़े गए');
    } else if (step === 3) {
      // 3. Generate energy readings: standard baseline
      db.prepare("UPDATE appliances SET is_on = 1 WHERE id IN ('fridge', 'fan', 'lights', 'laptop')").run();
      db.prepare("UPDATE appliances SET is_on = 0 WHERE id IN ('ac', 'geyser', 'washer', 'pump')").run();
      logActivity(db, 'demo_baseline', 'Demo Step 3: Energy readings flowing through virtual rooms', 'डेमो चरण 3: वास्तविक समय बिजली प्रवाह सक्रिय');
    } else if (step === 4) {
      // 4. Show an energy problem (Surge: AC @ 19°C + Geyser + TV Standby)
      db.prepare("UPDATE appliances SET is_on = 1 WHERE id IN ('ac', 'tv', 'fan', 'lights', 'geyser')").run();
      db.prepare("UPDATE appliances SET temp_setpoint = 19.0, power_watts = 1680 WHERE id = 'ac'").run();
      db.prepare("UPDATE appliances SET vampire_active = 1, standby_watts = 35 WHERE id = 'tv'").run();
      db.prepare("UPDATE leaks SET status = 'active' WHERE id IN ('leak-tv-standby', 'leak-ac-suboptimal', 'leak-geyser-idle')").run();
      logActivity(db, 'demo_surge', 'Demo Step 4: Household Evening Load Surged to >3.8 kW with multiple anomalies', 'डेमो चरण 4: शाम का भारी लोड सर्ज (>3.8 kW)');
    } else if (step === 5) {
      // 5. AI explains the problem
      logActivity(db, 'demo_explained', 'Demo Step 5: WattWise AI identified 42% preventable energy waste across AC and standby circuits', 'डेमो चरण 5: एआई ने 42% रोकी जा सकने वाली ऊर्जा बर्बादी पहचानी');
    } else if (step === 6) {
      // 6. User can optimize: Smart Saving Mode engaged
      db.prepare("UPDATE appliances SET temp_setpoint = 24.0, power_watts = 1220, smart_saving_active = 1 WHERE id = 'ac'").run();
      db.prepare("UPDATE appliances SET is_on = 0, smart_saving_active = 1 WHERE id = 'geyser'").run();
      db.prepare("UPDATE appliances SET vampire_active = 0, standby_watts = 2, smart_saving_active = 1 WHERE id IN ('tv', 'laptop')").run();
      db.prepare("UPDATE appliances SET device_speed = 3, power_watts = 45, smart_saving_active = 1 WHERE id = 'fan'").run();
      db.prepare("UPDATE appliances SET brightness = 70, power_watts = 77, smart_saving_active = 1 WHERE id = 'lights'").run();
      db.prepare("UPDATE leaks SET status = 'fixed'").run();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('smart_saving_enabled', 'true')").run();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('smart_saving_before_watts', '3850')").run();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('smart_saving_after_watts', '1690')").run();
      logActivity(db, 'demo_optimized', 'Demo Step 6: Smart Saving Mode engaged — optimizations applied', 'डेमो चरण 6: स्मार्ट सेविंग मोड लागू', 4.1, 32.8);
    } else if (step === 7) {
      // 7. Consumption decreases
      logActivity(db, 'demo_decreased', 'Demo Step 7: Home load stabilized at 1,690W (Down from 3,850W)', 'डेमो चरण 7: लोड घटकर 1,690W पर स्थिर हुआ');
    } else if (step === 8) {
      // 8. Savings increase
      logActivity(db, 'demo_savings', 'Demo Step 8: Estimated monthly bill projection dropped by ₹740', 'डेमो चरण 8: मासिक बिल पूर्वानुमान में ₹740 की कमी');
    } else if (step === 9) {
      // 9. Final Smart Home Optimized state
      logActivity(db, 'demo_complete', 'Demo Step 9: Smart Home fully optimized with living pulse in green eco rhythm', 'डेमो चरण 9: स्मार्ट होम पूर्णतः अनुकूलित');
    }

    const appliances = db.prepare('SELECT * FROM appliances').all();
    const settings = getSettingsMap(db);
    const telemetry = computeTelemetry(appliances, settings.simulation_mode || 'Normal Day');

    res.json({
      success: true,
      step,
      telemetry,
      message: `Demo step ${step} executed.`
    });
  } catch (err) {
    console.error('Error in demo step:', err);
    res.status(500).json({ success: false, error: 'Failed to advance demo step' });
  }
});

export default router;
