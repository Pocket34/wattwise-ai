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
app.use(cors());
app.use(express.json());

// Initialize DB before starting server
await initDb();

// ─── Dashboard ─────────────────────────────────────────────────────────────────

app.get('/api/dashboard', (_req, res) => {
  try {
    const data = getDashboard(getDb());
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Appliances ────────────────────────────────────────────────────────────────

app.get('/api/appliances', (_req, res) => {
  try {
    const data = queryAll(getDb(), 'SELECT * FROM appliances');
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/appliances/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, icon, category, power_watts, is_on, priority, schedule_start, schedule_end, daily_usage_hours } =
      req.body;

    db.run(
      `UPDATE appliances SET
        name = COALESCE(?, name),
        icon = COALESCE(?, icon),
        category = COALESCE(?, category),
        power_watts = COALESCE(?, power_watts),
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
        power_watts ?? null,
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
    res.json({ success: true, data: updated[0] || null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/appliances/:id/toggle', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    // Get current state
    const rows = queryAll(db, 'SELECT is_on FROM appliances WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Appliance not found' });
      return;
    }

    const newState = Number(rows[0].is_on) === 1 ? 0 : 1;
    db.run('UPDATE appliances SET is_on = ? WHERE id = ?', [newState, id]);
    saveDb();

    const updated = queryAll(db, 'SELECT * FROM appliances WHERE id = ?', [id]);
    res.json({ success: true, data: updated[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Leaks ─────────────────────────────────────────────────────────────────────

app.get('/api/leaks', (_req, res) => {
  try {
    const data = getLeaks(getDb());
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/leaks/:id/fix', (req, res) => {
  try {
    const db = getDb();
    const { appliance_id } = req.body;

    if (appliance_id) {
      db.run('UPDATE appliances SET is_on = 0 WHERE id = ?', [appliance_id]);
      saveDb();
    }

    res.json({ success: true, data: { fixed: true, appliance_id } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Insights ──────────────────────────────────────────────────────────────────

app.get('/api/insights', (_req, res) => {
  try {
    const data = getInsights(getDb());
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── What-If ───────────────────────────────────────────────────────────────────

app.post('/api/whatif', (req, res) => {
  try {
    const data = calculateWhatIf(getDb(), req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/whatif/apply', (req, res) => {
  try {
    const db = getDb();
    const { ac_hours, geyser_hours, fan_hours, light_hours, washing_freq } = req.body;

    if (ac_hours !== undefined) {
      db.run("UPDATE appliances SET daily_usage_hours = ? WHERE name = 'AC'", [ac_hours]);
    }
    if (geyser_hours !== undefined) {
      db.run("UPDATE appliances SET daily_usage_hours = ? WHERE name = 'Geyser'", [geyser_hours]);
    }
    if (fan_hours !== undefined) {
      db.run("UPDATE appliances SET daily_usage_hours = ? WHERE name = 'Fan'", [fan_hours]);
    }
    if (light_hours !== undefined) {
      db.run("UPDATE appliances SET daily_usage_hours = ? WHERE name = 'Lights'", [light_hours]);
    }
    if (washing_freq !== undefined) {
      db.run("UPDATE appliances SET daily_usage_hours = ? WHERE name = 'Washing Machine'", [washing_freq]);
    }
    saveDb();

    res.json({ success: true, data: { applied: true } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Rules ─────────────────────────────────────────────────────────────────────

app.get('/api/rules', (_req, res) => {
  try {
    const data = queryAll(getDb(), 'SELECT * FROM rules');
    res.json({ success: true, data });
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
    res.json({ success: true, data: created[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/rules/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
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
    res.json({ success: true, data: updated[0] || null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/rules/:id', (req, res) => {
  try {
    const db = getDb();
    db.run('DELETE FROM rules WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ success: true, data: { deleted: true } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/rules/:id/execute', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const rules = queryAll(db, 'SELECT * FROM rules WHERE id = ?', [id]);
    if (rules.length === 0) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }

    const rule = rules[0];
    const now = new Date().toISOString();
    let result = '';

    // Execute rule logic based on condition/action
    const condition = String(rule.condition).toLowerCase();
    const action = String(rule.action).toLowerCase();

    if (condition.includes('11 pm') || condition.includes('standby')) {
      // Night Standby Guard: turn off low-priority devices
      db.run("UPDATE appliances SET is_on = 0 WHERE priority = 'low' AND is_on = 1");
      result = 'Turned off low-priority devices for night standby.';
    } else if (condition.includes('4 kw') || condition.includes('peak load')) {
      // Peak Load Alert: check and report
      const total = queryAll(db, 'SELECT SUM(power_watts) as total FROM appliances WHERE is_on = 1');
      const currentLoad = Number(total[0]?.total ?? 0);
      if (currentLoad > 4000) {
        db.run("UPDATE appliances SET is_on = 0 WHERE priority = 'low' AND is_on = 1");
        result = `Load was ${currentLoad}W (above 4kW). Turned off low-priority devices.`;
      } else {
        result = `Current load ${currentLoad}W is within limits.`;
      }
    } else if (condition.includes('nobody') || condition.includes('home')) {
      // Nobody Home: turn off non-essential
      db.run("UPDATE appliances SET is_on = 0 WHERE priority != 'high'");
      result = 'Turned off all non-essential appliances (nobody home mode).';
    } else if (condition.includes('peak tariff') || condition.includes('washing')) {
      // Peak Tariff Saver: turn off washing machine
      db.run("UPDATE appliances SET is_on = 0 WHERE name = 'Washing Machine'");
      result = 'Washing Machine postponed to off-peak hours.';
    } else {
      result = `Rule "${rule.name}" executed. Custom logic not implemented.`;
    }

    // Update trigger count and last_triggered
    db.run('UPDATE rules SET trigger_count = trigger_count + 1, last_triggered = ? WHERE id = ?', [now, id]);
    saveDb();

    res.json({ success: true, data: { rule: rule.name, result } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Goals ─────────────────────────────────────────────────────────────────────

app.get('/api/goals', (_req, res) => {
  try {
    const data = queryAll(getDb(), 'SELECT * FROM goals');
    res.json({ success: true, data });
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
    res.json({ success: true, data: created[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/goals/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
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
    res.json({ success: true, data: updated[0] || null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/goals/:id', (req, res) => {
  try {
    const db = getDb();
    db.run('DELETE FROM goals WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ success: true, data: { deleted: true } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Bill Forecast ─────────────────────────────────────────────────────────────

app.get('/api/bill-forecast', (_req, res) => {
  try {
    const data = getBillForecast(getDb());
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Carbon Impact ─────────────────────────────────────────────────────────────

app.get('/api/carbon', (_req, res) => {
  try {
    const data = getCarbonImpact(getDb());
    res.json({ success: true, data });
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
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const db = getDb();
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      // Upsert each setting
      const existing = queryAll(db, 'SELECT key FROM settings WHERE key = ?', [key]);
      if (existing.length > 0) {
        db.run('UPDATE settings SET value = ? WHERE key = ?', [String(value), key]);
      } else {
        db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
      }
    }
    saveDb();

    // Return updated settings
    const rows = queryAll(db, 'SELECT * FROM settings');
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[String(row.key)] = String(row.value);
    }
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Simulation ────────────────────────────────────────────────────────────────

app.post('/api/simulation/mode', (req, res) => {
  try {
    const db = getDb();
    const { mode } = req.body;

    if (!mode || !['normal', 'high_usage', 'vacation', 'peak_hour', 'optimized'].includes(mode)) {
      res.status(400).json({
        success: false,
        error: 'Invalid mode. Use: normal, high_usage, vacation, peak_hour, optimized',
      });
      return;
    }

    const data = applySimulationMode(db, mode);
    saveDb();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/simulation/demo', (_req, res) => {
  try {
    const db = getDb();
    const data = runDemo(db);
    saveDb();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Reset ─────────────────────────────────────────────────────────────────────

app.post('/api/reset', async (_req, res) => {
  try {
    const db = getDb();

    // Drop all tables
    db.run('DROP TABLE IF EXISTS appliances');
    db.run('DROP TABLE IF EXISTS rules');
    db.run('DROP TABLE IF EXISTS goals');
    db.run('DROP TABLE IF EXISTS settings');

    // Re-initialize (recreates tables and seeds data)
    await initDb();

    res.json({ success: true, data: { reset: true } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Start Server ──────────────────────────────────────────────────────────────

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`⚡ WattWise AI Backend running on port ${PORT}`);
});
