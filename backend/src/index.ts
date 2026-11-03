import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { initDb, getDb, saveDb, queryAll } from './db.js';
import {
  getDashboard,
  getLeaks,
  getInsights,
  calculateWhatIf,
  getBillForecast,
  getCarbonImpact,
  applySimulationMode,
  runDemo,
} from './engine.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Initialize DB before starting server
await initDb();

// ─── Dashboard & Status ─────────────────────────────────────────────────────────

app.get(['/api/dashboard', '/api/status'], (_req, res) => {
  try {
    const db = getDb();
    const dashboard = getDashboard(db);
    const appliances = queryAll(db, 'SELECT * FROM appliances ORDER BY is_on DESC, power_watts DESC');
    const leaks = getLeaks(db);
    const insights = getInsights(db);
    const rules = queryAll(db, 'SELECT * FROM rules');
    const goals = queryAll(db, 'SELECT * FROM goals');
    const settingsRows = queryAll(db, 'SELECT * FROM settings');
    const settings: Record<string, string> = {};
    for (const row of settingsRows) {
      settings[String(row.key)] = String(row.value);
    }

    const telemetry = {
      currentWatts: dashboard.currentPower,
      todayKwh: dashboard.todayConsumption,
      todayCost: dashboard.todayCost,
      projectedMonthlyBill: Math.round(dashboard.todayCost * 30),
      projectedMonthlyKwh: Math.round(dashboard.todayConsumption * 30),
      efficiencyScore: dashboard.efficiencyScore,
      potentialSavingsTodayCost: dashboard.potentialSavings,
      potentialSavingsTodayKwh: Math.round((dashboard.potentialSavings / 8) * 10) / 10,
      standbyVampireWatts: appliances.reduce((sum: number, a: any) => sum + (Number(a.standby_watts) || 12), 0),
      baseLoadWatts: Math.round(dashboard.currentPower * 0.25),
      peakLoadWatts: dashboard.currentPower,
      co2TodayKg: Math.round(dashboard.todayConsumption * 0.82 * 10) / 10,
      hourlyGraph: (dashboard.energyTrend || []).map((kwh: number, i: number) => ({
        hour: `${String(i).padStart(2, '0')}:00`,
        watts: Math.round(kwh * 1000),
        costRate: Math.round(kwh * 8 * 10) / 10,
        isPeak: i >= 18 && i <= 22,
        isCurrent: i === new Date().getHours()
      }))
    };

    const smartSavingState = {
      isEnabled: settings.smart_saving_enabled === 'true',
      beforeWatts: 2320,
      afterWatts: 1690,
      savedWatts: 630,
      dailyRupeesSaved: 34,
      monthlyRupeesSaved: 1020,
      optimizedCount: 4
    };

    const payload = {
      success: true,
      telemetry,
      appliances,
      leaks,
      rules,
      goals,
      insights,
      settings,
      smartSavingState,
      recentActivity: [
        { id: 'act-1', event_type: 'optimization', message: 'Optimized dual-inverter AC setpoint to 24°C', message_hi: 'एसी को 24°C पर सेट किया गया', kwh_impact: 1.8, cost_impact: 14.4, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'act-2', event_type: 'leak_detected', message: 'Standby leak in Entertainment unit suppressed', message_hi: 'एंटरटेनमेंट यूनिट का स्टैंडबाय लीकेज रोका गया', kwh_impact: 0.6, cost_impact: 4.8, timestamp: new Date(Date.now() - 7200000).toISOString() }
      ],
      ...dashboard,
      data: {
        ...dashboard,
        telemetry,
        appliances,
        leaks,
        rules,
        goals,
        insights,
        settings,
        smartSavingState
      }
    };

    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Appliances ────────────────────────────────────────────────────────────────

app.get('/api/appliances', (_req, res) => {
  try {
    const data = queryAll(getDb(), 'SELECT * FROM appliances');
    res.json({ success: true, data, appliances: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/appliances', (req, res) => {
  try {
    const db = getDb();
    const { name, room, category, power_watts, standby_watts, icon, daily_usage_hours, priority } = req.body;
    const id = req.body.id || `app-${Date.now()}`;
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO appliances (id, name, icon, category, room, power_watts, standby_watts, is_on, priority, schedule_start, schedule_end, daily_usage_hours, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, '', '', ?, ?)`,
      [
        id,
        name || 'New Appliance',
        icon || 'Zap',
        category || 'general',
        room || 'Living Room',
        Number(power_watts) || 100,
        Number(standby_watts) || 5,
        priority || 'medium',
        Number(daily_usage_hours) || 2,
        now
      ]
    );
    saveDb();

    const created = queryAll(db, 'SELECT * FROM appliances WHERE id = ?', [id]);
    res.json({ success: true, appliance: created[0], data: created[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/appliances/:id', (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id);
    const { name, icon, category, room, power_watts, standby_watts, is_on, priority, schedule_start, schedule_end, daily_usage_hours } =
      req.body;

    db.run(
      `UPDATE appliances SET
        name = COALESCE(?, name),
        icon = COALESCE(?, icon),
        category = COALESCE(?, category),
        room = COALESCE(?, room),
        power_watts = COALESCE(?, power_watts),
        standby_watts = COALESCE(?, standby_watts),
        is_on = COALESCE(?, is_on),
        priority = COALESCE(?, priority),
        schedule_start = COALESCE(?, schedule_start),
        schedule_end = COALESCE(?, schedule_end),
        daily_usage_hours = COALESCE(?, daily_usage_hours)
      WHERE id = ?`,
      [
        name ?? null,
        icon ?? null,
        category ?? null,
        room ?? null,
        power_watts ?? null,
        standby_watts ?? null,
        is_on ?? null,
        priority ?? null,
        schedule_start ?? null,
        schedule_end ?? null,
        daily_usage_hours ?? null,
        id,
      ]
    );
    saveDb();

    const updated = queryAll(db, 'SELECT * FROM appliances WHERE id = ?', [id]);
    res.json({ success: true, appliance: updated[0] || null, data: updated[0] || null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/appliances/:id', (req, res) => {
  try {
    const db = getDb();
    db.run('DELETE FROM appliances WHERE id = ?', [String(req.params.id)]);
    saveDb();
    res.json({ success: true, message: 'Appliance removed', data: { deleted: true } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/appliances/:id/toggle', (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id);

    // Get current state
    const rows = queryAll(db, 'SELECT is_on FROM appliances WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Appliance not found' });
      return;
    }

    const newState = req.body?.is_on !== undefined
      ? (req.body.is_on ? 1 : 0)
      : (Number(rows[0].is_on) === 1 ? 0 : 1);

    db.run('UPDATE appliances SET is_on = ? WHERE id = ?', [newState, id]);
    saveDb();

    const updated = queryAll(db, 'SELECT * FROM appliances WHERE id = ?', [id]);
    res.json({ success: true, appliance: updated[0], data: updated[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Leaks ─────────────────────────────────────────────────────────────────────

app.get('/api/leaks', (_req, res) => {
  try {
    const data = getLeaks(getDb());
    res.json({ success: true, leaks: data, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/leaks/:id/fix', '/api/leaks/:id/action'], (req, res) => {
  try {
    const db = getDb();
    const { appliance_id } = req.body;

    if (appliance_id) {
      db.run('UPDATE appliances SET is_on = 0 WHERE id = ?', [appliance_id]);
      saveDb();
    }

    res.json({ success: true, message: 'Leak corrective action applied', data: { fixed: true, appliance_id } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Insights ──────────────────────────────────────────────────────────────────

app.get('/api/insights', (_req, res) => {
  try {
    const data = getInsights(getDb());
    res.json({ success: true, insights: data, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/insights/:id/apply', (_req, res) => {
  try {
    res.json({ success: true, message: 'Insight recommendation applied successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── What-If Simulation ────────────────────────────────────────────────────────

app.post(['/api/whatif', '/api/what-if', '/api/whatif/calculate'], (req, res) => {
  try {
    const b = req.body || {};
    const params = {
      ac_temp_delta: b.ac_temp_delta ?? (b.acTemp !== undefined ? Math.max(0, b.acTemp - 22) : 2),
      ac_hours: b.ac_hours ?? b.acHours ?? 4,
      geyser_hours: b.geyser_hours ?? (b.geyserMinutes !== undefined ? b.geyserMinutes / 60 : 1),
      fan_hours: b.fan_hours ?? b.fanHours ?? 8,
      light_hours: b.light_hours ?? b.lightingHours ?? 4,
      washing_freq: b.washing_freq ?? (b.washerLoadsPerWeek !== undefined ? b.washerLoadsPerWeek / 7 : 1),
      peak_usage_pct: b.peak_usage_pct ?? b.peakHourShiftPct ?? 20,
    };

    const data = calculateWhatIf(getDb(), params);
    const monthlySavings = data.savings;
    const currentCost = data.currentBill;
    const optimizedCost = data.optimizedBill;
    const percentSaved = Math.round((monthlySavings / (currentCost || 1)) * 100);

    const clientFormat = {
      current: {
        monthlyKwh: data.currentConsumption,
        monthlyCost: currentCost,
        co2Kg: data.currentCO2
      },
      optimized: {
        monthlyKwh: data.optimizedConsumption,
        monthlyCost: optimizedCost,
        co2Kg: data.optimizedCO2
      },
      savings: {
        monthlyRupees: monthlySavings,
        amount: monthlySavings,
        monthlyKwh: Math.round(data.currentConsumption - data.optimizedConsumption),
        avoidedCo2Kg: Math.round(data.currentCO2 - data.optimizedCO2),
        percentSaved
      }
    };

    res.json({
      success: true,
      ...data,
      ...clientFormat,
      monthlySavings,
      data: {
        ...data,
        ...clientFormat,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/whatif/apply', '/api/what-if/apply'], (req, res) => {
  try {
    const db = getDb();
    const b = req.body || {};
    const ac_hours = b.ac_hours ?? b.acHours;
    const geyser_hours = b.geyser_hours ?? (b.geyserMinutes !== undefined ? Math.round(b.geyserMinutes / 60) : undefined);
    const fan_hours = b.fan_hours ?? b.fanHours;
    const light_hours = b.light_hours ?? b.lightingHours;
    const washing_freq = b.washing_freq ?? (b.washerLoadsPerWeek !== undefined ? Math.round(b.washerLoadsPerWeek / 7) : undefined);

    if (ac_hours !== undefined) {
      db.run("UPDATE appliances SET daily_usage_hours = ? WHERE name LIKE '%AC%'", [ac_hours]);
    }
    if (geyser_hours !== undefined) {
      db.run("UPDATE appliances SET daily_usage_hours = ? WHERE name LIKE '%Geyser%'", [geyser_hours]);
    }
    if (fan_hours !== undefined) {
      db.run("UPDATE appliances SET daily_usage_hours = ? WHERE name LIKE '%Fan%'", [fan_hours]);
    }
    if (light_hours !== undefined) {
      db.run("UPDATE appliances SET daily_usage_hours = ? WHERE name LIKE '%Light%'", [light_hours]);
    }
    if (washing_freq !== undefined) {
      db.run("UPDATE appliances SET daily_usage_hours = ? WHERE name LIKE '%Wash%'", [washing_freq]);
    }
    saveDb();

    res.json({ success: true, message: 'What-If plan applied successfully', data: { applied: true } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Rules ─────────────────────────────────────────────────────────────────────

app.get('/api/rules', (_req, res) => {
  try {
    const data = queryAll(getDb(), 'SELECT * FROM rules');
    res.json({ success: true, rules: data, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/rules', (req, res) => {
  try {
    const db = getDb();
    const { name, condition, action } = req.body;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.run(
      'INSERT INTO rules (id, name, condition, action, is_enabled, trigger_count, last_triggered, created_at) VALUES (?, ?, ?, ?, 1, 0, ?, ?)',
      [id, name, condition, action, '', now]
    );
    saveDb();

    const created = queryAll(db, 'SELECT * FROM rules WHERE id = ?', [id]);
    res.json({ success: true, id, message: 'Rule created', rule: created[0], data: created[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/rules/:id', (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id);
    const { name, condition, action, is_enabled } = req.body;

    db.run(
      `UPDATE rules SET
        name = COALESCE(?, name),
        condition = COALESCE(?, condition),
        action = COALESCE(?, action),
        is_enabled = COALESCE(?, is_enabled)
      WHERE id = ?`,
      [name ?? null, condition ?? null, action ?? null, is_enabled ?? null, id]
    );
    saveDb();

    const updated = queryAll(db, 'SELECT * FROM rules WHERE id = ?', [id]);
    res.json({ success: true, message: 'Rule updated', rule: updated[0] || null, data: updated[0] || null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/rules/:id', (req, res) => {
  try {
    const db = getDb();
    db.run('DELETE FROM rules WHERE id = ?', [String(req.params.id)]);
    saveDb();
    res.json({ success: true, message: 'Rule deleted', data: { deleted: true } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/rules/:id/execute', '/api/rules/:id/trigger'], (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id);

    const rules = queryAll(db, 'SELECT * FROM rules WHERE id = ?', [id]);
    if (rules.length === 0) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }

    const rule = rules[0];
    const newCount = Number(rule.trigger_count || 0) + 1;
    const now = new Date().toISOString();

    db.run('UPDATE rules SET trigger_count = ?, last_triggered = ? WHERE id = ?', [newCount, now, id]);

    // Apply rule action effects
    let result = 'Trigger condition evaluated.';
    if (rule.name === 'Night Standby Guard') {
      db.run("UPDATE appliances SET is_on = 0 WHERE category = 'entertainment'");
      result = 'Entertainment standby suppressed.';
    } else if (rule.name === 'Nobody Home') {
      db.run("UPDATE appliances SET is_on = 0 WHERE priority != 'high'");
      result = 'Non-essential appliances turned off.';
    } else if (rule.name === 'Peak Tariff Saver') {
      db.run("UPDATE appliances SET is_on = 0 WHERE name = 'Washing Machine'");
      result = 'Washing machine rescheduled outside peak.';
    }
    saveDb();

    res.json({ success: true, message: `Rule executed: ${result}`, data: { rule: rule.name, result } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Goals ─────────────────────────────────────────────────────────────────────

app.get('/api/goals', (_req, res) => {
  try {
    const data = queryAll(getDb(), 'SELECT * FROM goals');
    res.json({ success: true, goals: data, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/goals', (req, res) => {
  try {
    const db = getDb();
    const { title, target_value, unit, type, deadline } = req.body;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.run(
      'INSERT INTO goals (id, title, target_value, current_value, unit, type, is_completed, deadline, created_at) VALUES (?, ?, ?, 0, ?, ?, 0, ?, ?)',
      [id, title, target_value, unit, type, deadline || '', now]
    );
    saveDb();

    const created = queryAll(db, 'SELECT * FROM goals WHERE id = ?', [id]);
    res.json({ success: true, id, message: 'Goal created', goal: created[0], data: created[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/goals/:id', (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id);
    const { title, target_value, current_value, unit, type, is_completed, deadline } = req.body;

    db.run(
      `UPDATE goals SET
        title = COALESCE(?, title),
        target_value = COALESCE(?, target_value),
        current_value = COALESCE(?, current_value),
        unit = COALESCE(?, unit),
        type = COALESCE(?, type),
        is_completed = COALESCE(?, is_completed),
        deadline = COALESCE(?, deadline)
      WHERE id = ?`,
      [
        title ?? null,
        target_value ?? null,
        current_value ?? null,
        unit ?? null,
        type ?? null,
        is_completed ?? null,
        deadline ?? null,
        id,
      ]
    );
    saveDb();

    const updated = queryAll(db, 'SELECT * FROM goals WHERE id = ?', [id]);
    res.json({ success: true, message: 'Goal updated', goal: updated[0] || null, data: updated[0] || null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/goals/:id/complete', (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id);
    db.run('UPDATE goals SET is_completed = 1 WHERE id = ?', [id]);
    saveDb();
    const updated = queryAll(db, 'SELECT * FROM goals WHERE id = ?', [id]);
    res.json({ success: true, message: 'Goal marked completed', goal: updated[0] || null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/goals/:id', (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id);
    db.run('DELETE FROM goals WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true, message: 'Goal deleted', id, data: { deleted: true } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Bill Forecast ─────────────────────────────────────────────────────────────

app.get(['/api/bill-forecast', '/api/forecast'], (_req, res) => {
  try {
    const data = getBillForecast(getDb());
    res.json({
      success: true,
      ...data,
      data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Carbon Impact (Fixes 404 on /api/carbon-impact & /api/carbon) ─────────────

app.get(['/api/carbon', '/api/carbon-impact'], (_req, res) => {
  try {
    const data = getCarbonImpact(getDb());
    res.json({
      success: true,
      todayKwh: data.todayKwh,
      co2Today: data.co2Today,
      co2Month: data.co2Month,
      co2SavedToday: data.co2SavedToday,
      co2SavedTodayKg: data.co2SavedToday,
      co2SavedMonth: data.co2SavedMonth,
      co2SavedMonthKg: data.co2SavedMonth,
      treesEquivalent: data.equivalentTrees,
      equivalentTrees: data.equivalentTrees,
      evKmEquivalent: data.equivalentEvKm,
      equivalentEvKm: data.equivalentEvKm,
      currentDailyCo2Kg: data.co2Today,
      impactStory: data.impactStory,
      impactStoryHi: `अपने ऊर्जा उपयोग को अनुकूलित करके, आप प्रति माह ${data.co2SavedMonth} किलोग्राम CO₂ बचा सकते हैं। यह ${data.equivalentTrees} पेड़ लगाने या पेट्रोल कार के बजाय ${data.equivalentEvKm} किमी ईवी चलाने के बराबर है।`,
      data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Settings ──────────────────────────────────────────────────────────────────

app.get('/api/settings', (_req, res) => {
  try {
    const rows = queryAll(getDb(), 'SELECT * FROM settings');
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[String(row.key)] = String(row.value);
    }
    res.json({ success: true, settings, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const db = getDb();
    const updates = req.body || {};

    for (const [key, value] of Object.entries(updates)) {
      const existing = queryAll(db, 'SELECT key FROM settings WHERE key = ?', [key]);
      if (existing.length > 0) {
        db.run('UPDATE settings SET value = ? WHERE key = ?', [String(value), key]);
      } else {
        db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
      }
    }
    saveDb();

    const rows = queryAll(db, 'SELECT * FROM settings');
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[String(row.key)] = String(row.value);
    }
    res.json({ success: true, settings, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Simulation & Demo ─────────────────────────────────────────────────────────

app.post('/api/simulation/mode', (req, res) => {
  try {
    const db = getDb();
    const { mode } = req.body;

    const normalizedMode = String(mode || 'Normal Day').toLowerCase().replace(/\s+/g, '_');
    const validModes = ['normal', 'normal_day', 'high_usage', 'vacation', 'vacation_mode', 'peak_hour', 'optimized', 'optimized_home'];

    if (!mode || !validModes.includes(normalizedMode)) {
      const data = applySimulationMode(db, 'normal');
      saveDb();
      res.json({ success: true, data });
      return;
    }

    const standardMode = normalizedMode.includes('vacation')
      ? 'vacation'
      : normalizedMode.includes('peak')
      ? 'peak_hour'
      : normalizedMode.includes('high')
      ? 'high_usage'
      : normalizedMode.includes('opt')
      ? 'optimized'
      : 'normal';

    const data = applySimulationMode(db, standardMode);
    saveDb();
    res.json({ success: true, mode, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/simulation/demo', '/api/demo/start'], (_req, res) => {
  try {
    const db = getDb();
    const data = runDemo(db);
    saveDb();
    res.json({ success: true, message: 'Smart home demo started', data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/demo/step', (req, res) => {
  res.json({ success: true, step: req.body?.step || 1, message: 'Demo step executed' });
});

// ─── Smart Saving & Bridge ─────────────────────────────────────────────────────

app.post('/api/smart-saving', (req, res) => {
  try {
    const { isEnabled } = req.body || {};
    res.json({
      success: true,
      smartSavingState: {
        isEnabled: Boolean(isEnabled),
        beforeWatts: 2320,
        afterWatts: 1690,
        savedWatts: 630,
        dailyRupeesSaved: 34,
        monthlyRupeesSaved: 1020,
        optimizedCount: 4
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/bridge/status', (_req, res) => {
  res.json({
    success: true,
    bridge: {
      status: 'connected',
      connectedProtocols: ['Matter 1.3', 'Local MQTT'],
      lastSync: new Date().toISOString()
    }
  });
});

app.post('/api/bridge/sync', (_req, res) => {
  res.json({ success: true, message: 'Bridge synchronized successfully' });
});

app.post('/api/bridge/connect', (req, res) => {
  res.json({ success: true, protocol: req.body?.protocol || 'Matter', status: 'connected' });
});

app.post('/api/bridge/disconnect', (req, res) => {
  res.json({ success: true, protocol: req.body?.protocol || 'Matter', status: 'disconnected' });
});

app.post('/api/bridge/scan', (_req, res) => {
  res.json({
    success: true,
    scanSteps: ['Broadcasting mDNS query', 'Discovering Matter Commissionable nodes', 'Polling Local MQTT broker', 'Scan completed'],
    discoveredDevices: [
      { id: 'disc-1', name: 'Smart Inverter AC', room: 'Master Bedroom', protocol: 'Matter', signal: '-58 dBm' },
      { id: 'disc-2', name: 'Smart Power Strip', room: 'Living Room', protocol: 'MQTT', signal: '-64 dBm' }
    ]
  });
});

// ─── Integrations API (Google Home, Matter, MQTT, Home Assistant) ─────────────

app.get('/api/integrations/status', (_req, res) => {
  res.json({
    success: true,
    mode: 'DEMO',
    hasLiveConnected: false,
    lastSyncTime: new Date().toISOString(),
    providers: [
      { id: 'google_home', name: 'Google Home Graph', type: 'cloud', status: 'ready', authConfigured: true },
      { id: 'matter', name: 'Matter Fabric 1.3', type: 'local', status: 'ready', authConfigured: true },
      { id: 'mqtt', name: 'Home Assistant MQTT', type: 'broker', status: 'ready', authConfigured: true },
      { id: 'generic_api', name: 'REST Device Bridge', type: 'webhook', status: 'ready', authConfigured: true }
    ]
  });
});

app.post('/api/integrations/mode', (req, res) => {
  const mode = req.body?.mode || 'DEMO';
  res.json({ success: true, mode, message: `Switched to ${mode} mode` });
});

app.post('/api/integrations/google/auth', (_req, res) => {
  res.json({
    success: true,
    configured: true,
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fhomegraph&response_type=code',
    instructions: 'Follow standard Google OAuth flow to grant Home Graph permissions.'
  });
});

app.get('/api/integrations/google/devices', (_req, res) => {
  res.json({ success: true, devices: [] });
});

app.post('/api/integrations/google/sync', (_req, res) => {
  res.json({ success: true, message: 'Google Home devices synced' });
});

app.post('/api/integrations/matter/commission', (req, res) => {
  res.json({ success: true, pairingCode: req.body?.code, message: 'Matter device commissioned successfully' });
});

app.post('/api/integrations/mqtt/connect', (_req, res) => {
  res.json({ success: true, message: 'Connected to local MQTT broker' });
});

app.post('/api/integrations/homeassistant/connect', (_req, res) => {
  res.json({ success: true, message: 'Connected to Home Assistant instance' });
});

app.post('/api/integrations/generic/connect', (_req, res) => {
  res.json({ success: true, message: 'Generic device connected' });
});

app.get('/api/integrations/generic/devices', (_req, res) => {
  res.json({ success: true, devices: [] });
});

// ─── Reset ─────────────────────────────────────────────────────────────────────

app.post(['/api/reset', '/api/demo/reset'], async (_req, res) => {
  try {
    const db = getDb();

    // Drop all tables
    db.run('DROP TABLE IF EXISTS appliances');
    db.run('DROP TABLE IF EXISTS rules');
    db.run('DROP TABLE IF EXISTS goals');
    db.run('DROP TABLE IF EXISTS settings');

    // Re-initialize (recreates tables and seeds data)
    await initDb();

    res.json({ success: true, message: 'All data reset', data: { reset: true } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Start Server ──────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`WattWise AI Backend running on port ${PORT}`);
});
