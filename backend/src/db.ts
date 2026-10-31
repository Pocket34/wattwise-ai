import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'wattwise.db');
let db: Database;

/**
 * Helper to run parameterized SELECT queries and return rows as objects.
 */
export function queryAll(db: Database, sql: string, params?: any[]): any[] {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Initialize the database: load from file or create new, create tables, seed data.
 */
export async function initDb(): Promise<Database> {
  const SQL = await initSqlJs();

  // Try to load existing db file
  try {
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
  } catch {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS appliances (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      category TEXT,
      power_watts REAL,
      is_on INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'medium',
      schedule_start TEXT DEFAULT '',
      schedule_end TEXT DEFAULT '',
      daily_usage_hours REAL DEFAULT 0,
      created_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      condition TEXT,
      action TEXT,
      is_enabled INTEGER DEFAULT 1,
      trigger_count INTEGER DEFAULT 0,
      last_triggered TEXT,
      created_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      target_value REAL,
      current_value REAL DEFAULT 0,
      unit TEXT,
      type TEXT,
      is_completed INTEGER DEFAULT 0,
      deadline TEXT,
      created_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Seed data if tables are empty
  seedData();

  // Persist to file
  saveDb();

  return db;
}

function seedData(): void {
  const now = new Date().toISOString();

  // Check if appliances already exist
  const countRows = queryAll(db, 'SELECT COUNT(*) as cnt FROM appliances');
  const applianceCount = countRows.length > 0 ? Number(countRows[0].cnt) : 0;

  if (applianceCount === 0) {
    const appliances = [
      { name: 'AC', power: 1500, on: 1, hours: 8, icon: '❄️', category: 'cooling', priority: 'high' },
      { name: 'Refrigerator', power: 150, on: 1, hours: 24, icon: '🧊', category: 'kitchen', priority: 'high' },
      { name: 'Washing Machine', power: 500, on: 0, hours: 1, icon: '👕', category: 'laundry', priority: 'medium' },
      { name: 'TV', power: 120, on: 1, hours: 5, icon: '📺', category: 'entertainment', priority: 'low' },
      { name: 'Fan', power: 75, on: 1, hours: 12, icon: '🌀', category: 'cooling', priority: 'medium' },
      { name: 'Lights', power: 60, on: 1, hours: 8, icon: '💡', category: 'lighting', priority: 'medium' },
      { name: 'Geyser', power: 2000, on: 0, hours: 0.5, icon: '🚿', category: 'heating', priority: 'medium' },
      { name: 'Microwave', power: 1200, on: 0, hours: 0.3, icon: '🍕', category: 'kitchen', priority: 'low' },
      { name: 'Laptop', power: 65, on: 1, hours: 8, icon: '💻', category: 'electronics', priority: 'medium' },
      { name: 'Water Pump', power: 750, on: 0, hours: 1, icon: '💧', category: 'utility', priority: 'low' },
    ];

    for (const a of appliances) {
      db.run(
        `INSERT INTO appliances (id, name, icon, category, power_watts, is_on, priority, schedule_start, schedule_end, daily_usage_hours, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, '', '', ?, ?)`,
        [crypto.randomUUID(), a.name, a.icon, a.category, a.power, a.on, a.priority, a.hours, now]
      );
    }
  }

  // Seed rules
  const ruleCount = queryAll(db, 'SELECT COUNT(*) as cnt FROM rules');
  if (Number(ruleCount[0]?.cnt ?? 0) === 0) {
    const rules = [
      { name: 'Night Standby Guard', condition: 'After 11 PM', action: 'Detect unnecessary standby devices' },
      { name: 'Peak Load Alert', condition: 'Power usage exceeds 4 kW', action: 'Suggest reducing load' },
      { name: 'Nobody Home', condition: 'When nobody is home', action: 'Turn off non-essential appliances' },
      { name: 'Peak Tariff Saver', condition: 'During peak tariff hours', action: 'Postpone washing machine' },
    ];

    for (const r of rules) {
      db.run(
        `INSERT INTO rules (id, name, condition, action, is_enabled, trigger_count, last_triggered, created_at)
         VALUES (?, ?, ?, ?, 1, 0, '', ?)`,
        [crypto.randomUUID(), r.name, r.condition, r.action, now]
      );
    }
  }

  // Seed goals
  const goalCount = queryAll(db, 'SELECT COUNT(*) as cnt FROM goals');
  if (Number(goalCount[0]?.cnt ?? 0) === 0) {
    const goals = [
      { title: 'Reduce monthly bill by 15%', target: 15, current: 7.2, unit: '%', type: 'bill_reduction', deadline: new Date(Date.now() + 30 * 86400000).toISOString() },
      { title: 'Stay below 8 kWh/day', target: 8, current: 6.5, unit: 'kWh', type: 'daily_limit', deadline: new Date(Date.now() + 7 * 86400000).toISOString() },
      { title: 'Reduce AC consumption', target: 30, current: 12, unit: '%', type: 'appliance_reduction', deadline: new Date(Date.now() + 60 * 86400000).toISOString() },
    ];

    for (const g of goals) {
      db.run(
        `INSERT INTO goals (id, title, target_value, current_value, unit, type, is_completed, deadline, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [crypto.randomUUID(), g.title, g.target, g.current, g.unit, g.type, g.deadline, now]
      );
    }
  }

  // Seed settings
  const settingsCount = queryAll(db, 'SELECT COUNT(*) as cnt FROM settings');
  if (Number(settingsCount[0]?.cnt ?? 0) === 0) {
    const defaults: Record<string, string> = {
      tariff: '8',
      peak_tariff: '12',
      language: 'hi',
      sound: 'true',
      voice: 'false',
      simulation_speed: '1',
      theme: 'dark',
      currency: 'INR',
    };

    for (const [key, value] of Object.entries(defaults)) {
      db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
  }
}

export function getDb(): Database {
  return db;
}

export function saveDb(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}
