import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'wattwise.sqlite');

let dbInstance = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  dbInstance = new DatabaseSync(DB_PATH);

  // Provide db.transaction helper compatible with SQLite transaction patterns
  if (typeof dbInstance.transaction !== 'function') {
    dbInstance.transaction = function (fn) {
      return function (...args) {
        dbInstance.exec('BEGIN');
        try {
          const result = fn(...args);
          dbInstance.exec('COMMIT');
          return result;
        } catch (err) {
          try {
            dbInstance.exec('ROLLBACK');
          } catch (_) {}
          throw err;
        }
      };
    };
  }

  initSchema(dbInstance);
  return dbInstance;
}

export function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS appliances (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      category TEXT NOT NULL,
      room TEXT NOT NULL,
      power_watts REAL NOT NULL,
      baseline_watts REAL NOT NULL,
      is_on INTEGER NOT NULL DEFAULT 0,
      daily_hours REAL NOT NULL DEFAULT 0,
      is_priority INTEGER NOT NULL DEFAULT 0,
      schedule_start TEXT DEFAULT '00:00',
      schedule_end TEXT DEFAULT '00:00',
      schedule_enabled INTEGER NOT NULL DEFAULT 0,
      efficiency_rating TEXT NOT NULL,
      temp_setpoint REAL DEFAULT 24.0,
      standby_watts REAL NOT NULL DEFAULT 0,
      vampire_active INTEGER NOT NULL DEFAULT 0,
      connection_type TEXT DEFAULT 'demo',
      is_connected INTEGER DEFAULT 1,
      device_speed INTEGER DEFAULT 3,
      brightness INTEGER DEFAULT 100,
      water_temp REAL DEFAULT 55.0,
      smart_saving_active INTEGER DEFAULT 0,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS leaks (
      id TEXT PRIMARY KEY,
      appliance_id TEXT NOT NULL,
      title TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      description TEXT NOT NULL,
      description_hi TEXT NOT NULL,
      leak_type TEXT NOT NULL,
      confidence_pct INTEGER NOT NULL,
      waste_kwh_daily REAL NOT NULL,
      waste_cost_daily REAL NOT NULL,
      recommended_action TEXT NOT NULL,
      recommended_action_hi TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      detected_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      description TEXT NOT NULL,
      description_hi TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      threshold_val REAL NOT NULL DEFAULT 0,
      action_type TEXT NOT NULL,
      target_appliance_id TEXT,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      last_triggered_at TEXT,
      trigger_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      description TEXT NOT NULL,
      target_metric TEXT NOT NULL,
      target_value REAL NOT NULL,
      current_value REAL NOT NULL,
      unit TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      message_hi TEXT NOT NULL,
      kwh_impact REAL DEFAULT 0,
      cost_impact REAL DEFAULT 0,
      timestamp TEXT NOT NULL
    );
  `);

  // Safe migrations in case tables exist
  try { db.exec("ALTER TABLE appliances ADD COLUMN connection_type TEXT DEFAULT 'demo';"); } catch (e) {}
  try { db.exec("ALTER TABLE appliances ADD COLUMN is_connected INTEGER DEFAULT 1;"); } catch (e) {}
  try { db.exec("ALTER TABLE appliances ADD COLUMN device_speed INTEGER DEFAULT 3;"); } catch (e) {}
  try { db.exec("ALTER TABLE appliances ADD COLUMN brightness INTEGER DEFAULT 100;"); } catch (e) {}
  try { db.exec("ALTER TABLE appliances ADD COLUMN water_temp REAL DEFAULT 55.0;"); } catch (e) {}
  try { db.exec("ALTER TABLE appliances ADD COLUMN smart_saving_active INTEGER DEFAULT 0;"); } catch (e) {}

  // Check if appliances are populated
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM appliances');
  const result = countStmt.get();
  if (!result || result.count === 0) {
    seedDatabase(db);
  }
}

export function seedDatabase(db) {
  // Clear existing
  db.exec('DELETE FROM appliances;');
  db.exec('DELETE FROM leaks;');
  db.exec('DELETE FROM rules;');
  db.exec('DELETE FROM goals;');
  db.exec('DELETE FROM settings;');
  db.exec('DELETE FROM activity_log;');

  const insertAppliance = db.prepare(`
    INSERT INTO appliances (
      id, name, name_hi, category, room, power_watts, baseline_watts, is_on, daily_hours,
      is_priority, schedule_start, schedule_end, schedule_enabled, efficiency_rating,
      temp_setpoint, standby_watts, vampire_active, connection_type, is_connected,
      device_speed, brightness, water_temp, smart_saving_active, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const initialAppliances = [
    {
      id: 'ac',
      name: 'Master Bed Dual Inverter AC',
      name_hi: 'मास्टर बेडरूम डुअल इन्वर्टर एसी',
      category: 'cooling',
      room: 'Master Bedroom',
      power_watts: 1450,
      baseline_watts: 1450,
      is_on: 1,
      daily_hours: 6.5,
      is_priority: 0,
      schedule_start: '22:00',
      schedule_end: '06:00',
      schedule_enabled: 1,
      efficiency_rating: '5-Star BEE',
      temp_setpoint: 22.0,
      standby_watts: 12,
      vampire_active: 0,
      connection_type: 'matter',
      is_connected: 1,
      device_speed: 3,
      brightness: 100,
      water_temp: 55.0,
      smart_saving_active: 0
    },
    {
      id: 'fridge',
      name: 'Smart Frost-Free Refrigerator',
      name_hi: 'स्मार्ट फ्रॉस्ट-फ्री फ्रिज',
      category: 'refrigeration',
      room: 'Kitchen',
      power_watts: 180,
      baseline_watts: 180,
      is_on: 1,
      daily_hours: 24.0,
      is_priority: 1,
      schedule_start: '00:00',
      schedule_end: '23:59',
      schedule_enabled: 0,
      efficiency_rating: '4-Star Inverter',
      temp_setpoint: 3.5,
      standby_watts: 8,
      vampire_active: 0,
      connection_type: 'google_home',
      is_connected: 1,
      device_speed: 3,
      brightness: 100,
      water_temp: 55.0,
      smart_saving_active: 0
    },
    {
      id: 'washer',
      name: 'Front-Load Eco Washing Machine',
      name_hi: 'इको फ्रंट-लोड वाशिंग मशीन',
      category: 'laundry',
      room: 'Utility Balcony',
      power_watts: 650,
      baseline_watts: 650,
      is_on: 0,
      daily_hours: 1.2,
      is_priority: 0,
      schedule_start: '14:00',
      schedule_end: '15:30',
      schedule_enabled: 1,
      efficiency_rating: '5-Star Smart Rinse',
      temp_setpoint: 40.0,
      standby_watts: 4,
      vampire_active: 0,
      connection_type: 'matter',
      is_connected: 1,
      device_speed: 3,
      brightness: 100,
      water_temp: 55.0,
      smart_saving_active: 0
    },
    {
      id: 'tv',
      name: '65" 4K OLED TV + Set-top Box',
      name_hi: '65 इंच 4K OLED टीवी और सेट-टॉप बॉक्स',
      category: 'entertainment',
      room: 'Living Room',
      power_watts: 160,
      baseline_watts: 160,
      is_on: 1,
      daily_hours: 5.5,
      is_priority: 0,
      schedule_start: '19:00',
      schedule_end: '23:30',
      schedule_enabled: 0,
      efficiency_rating: 'Class A OLED',
      temp_setpoint: 0,
      standby_watts: 28, // High standby vampire load
      vampire_active: 1,
      connection_type: 'google_home',
      is_connected: 1,
      device_speed: 3,
      brightness: 100,
      water_temp: 55.0,
      smart_saving_active: 0
    },
    {
      id: 'fan',
      name: 'BLDC Whisper Smart Ceiling Fans (x3)',
      name_hi: 'BLDC स्मार्ट सीलिंग पंखे (3x)',
      category: 'comfort',
      room: 'Bedrooms & Living Room',
      power_watts: 84, // 28W x 3
      baseline_watts: 84,
      is_on: 1,
      daily_hours: 14.0,
      is_priority: 0,
      schedule_start: '00:00',
      schedule_end: '23:59',
      schedule_enabled: 0,
      efficiency_rating: 'BLDC 28W High Efficiency',
      temp_setpoint: 0,
      standby_watts: 3,
      vampire_active: 0,
      connection_type: 'matter',
      is_connected: 1,
      device_speed: 4,
      brightness: 100,
      water_temp: 55.0,
      smart_saving_active: 0
    },
    {
      id: 'lights',
      name: 'Ambient Warm Hue Smart LEDs',
      name_hi: 'स्मार्ट वार्म LED लाइटिंग',
      category: 'lighting',
      room: 'All Living Spaces',
      power_watts: 110,
      baseline_watts: 110,
      is_on: 1,
      daily_hours: 6.0,
      is_priority: 0,
      schedule_start: '18:30',
      schedule_end: '23:30',
      schedule_enabled: 1,
      efficiency_rating: '90lm/W A++ Grade',
      temp_setpoint: 0,
      standby_watts: 5,
      vampire_active: 0,
      connection_type: 'matter',
      is_connected: 1,
      device_speed: 3,
      brightness: 85,
      water_temp: 55.0,
      smart_saving_active: 0
    },
    {
      id: 'geyser',
      name: 'Digital Fast-Heat 25L Geyser',
      name_hi: 'डिजिटल फास्ट-हीट 25L गीज़र',
      category: 'heating',
      room: 'Master Bathroom',
      power_watts: 2000,
      baseline_watts: 2000,
      is_on: 0,
      daily_hours: 1.0,
      is_priority: 0,
      schedule_start: '06:30',
      schedule_end: '07:30',
      schedule_enabled: 1,
      efficiency_rating: '5-Star Polyurethane',
      temp_setpoint: 55.0,
      standby_watts: 15,
      vampire_active: 1,
      connection_type: 'google_home',
      is_connected: 1,
      device_speed: 3,
      brightness: 100,
      water_temp: 55.0,
      smart_saving_active: 0
    },
    {
      id: 'microwave',
      name: 'Convection Smart Microwave Oven',
      name_hi: 'स्मार्ट कन्वेक्शन माइक्रोवेव ओवन',
      category: 'kitchen',
      room: 'Kitchen',
      power_watts: 1200,
      baseline_watts: 1200,
      is_on: 0,
      daily_hours: 0.5,
      is_priority: 0,
      schedule_start: '12:30',
      schedule_end: '13:00',
      schedule_enabled: 0,
      efficiency_rating: 'Eco Inverter Magnetron',
      temp_setpoint: 0,
      standby_watts: 7,
      vampire_active: 1,
      connection_type: 'demo',
      is_connected: 1,
      device_speed: 3,
      brightness: 100,
      water_temp: 55.0,
      smart_saving_active: 0
    },
    {
      id: 'laptop',
      name: 'Home Workstation & Monitor Setup',
      name_hi: 'वर्कस्टेशन एवं डुअल मॉनिटर सेटअप',
      category: 'computing',
      room: 'Home Office',
      power_watts: 140,
      baseline_watts: 140,
      is_on: 1,
      daily_hours: 8.0,
      is_priority: 0,
      schedule_start: '09:00',
      schedule_end: '18:00',
      schedule_enabled: 0,
      efficiency_rating: 'Energy Star 8.0',
      temp_setpoint: 0,
      standby_watts: 18,
      vampire_active: 1,
      connection_type: 'demo',
      is_connected: 1,
      device_speed: 3,
      brightness: 100,
      water_temp: 55.0,
      smart_saving_active: 0
    },
    {
      id: 'pump',
      name: 'Rooftop Automated 1.0 HP Water Pump',
      name_hi: 'रूफटॉप 1.0 HP ऑटोमेटेड वाटर पंप',
      category: 'utility',
      room: 'Terrace & Overhead Tank',
      power_watts: 750,
      baseline_watts: 750,
      is_on: 0,
      daily_hours: 0.7,
      is_priority: 1,
      schedule_start: '07:00',
      schedule_end: '07:45',
      schedule_enabled: 1,
      efficiency_rating: 'IE3 Premium Motor',
      temp_setpoint: 0,
      standby_watts: 2,
      vampire_active: 0,
      connection_type: 'cloud',
      is_connected: 1,
      device_speed: 3,
      brightness: 100,
      water_temp: 55.0,
      smart_saving_active: 0
    }
  ];

  for (const app of initialAppliances) {
    insertAppliance.run(
      app.id, app.name, app.name_hi, app.category, app.room, app.power_watts,
      app.baseline_watts, app.is_on, app.daily_hours, app.is_priority,
      app.schedule_start, app.schedule_end, app.schedule_enabled,
      app.efficiency_rating, app.temp_setpoint, app.standby_watts,
      app.vampire_active, app.connection_type, app.is_connected,
      app.device_speed, app.brightness, app.water_temp, app.smart_saving_active
    );
  }

  // Seed Initial Leaks
  const insertLeak = db.prepare(`
    INSERT INTO leaks (
      id, appliance_id, title, title_hi, description, description_hi,
      leak_type, confidence_pct, waste_kwh_daily, waste_cost_daily,
      recommended_action, recommended_action_hi, status, detected_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  insertLeak.run(
    'leak-tv-standby',
    'tv',
    'Living Room TV & STB Phantom Standby Draw',
    'लिविंग रूम टीवी और सेट-टॉप बॉक्स फैंटम स्टैंडबाय',
    'TV + Set-top box remained in standby drawing 28W continuously for 7h 14m post-midnight.',
    'टीवी और सेट-टॉप बॉक्स आधी रात के बाद लगातार 7 घंटे 14 मिनट तक 28W स्टैंडबाय पावर खींच रहे हैं।',
    'vampire_standby',
    96,
    0.48,
    3.84,
    'Cut smart-plug socket power during 00:00–07:00',
    'रात 12:00 से 7:00 तक स्मार्ट-प्लग सॉकेट बिजली बंद करें',
    'active'
  );

  insertLeak.run(
    'leak-ac-suboptimal',
    'ac',
    'AC Inefficient Temperature Setpoint (22°C)',
    'एसी अकुशल तापमान सेटिंग (22°C)',
    'Master Bedroom AC has consumed 31% more energy than usual evening baseline due to sub-optimal 22°C setpoint.',
    '22°C की कम सेटिंग के कारण मास्टर बेडरूम एसी ने शाम के सामान्य बेसलाइन से 31% अधिक बिजली की खपत की है।',
    'inefficient_setpoint',
    91,
    2.90,
    23.20,
    'Increase AC temperature from 22°C → 24°C',
    'एसी का तापमान 22°C से बढ़ाकर 24°C करें',
    'active'
  );

  insertLeak.run(
    'leak-geyser-idle',
    'geyser',
    'Geyser Extended Pre-Heat Standby Thermal Loss',
    'गीज़र विस्तारित स्टैंडबाय थर्मल लॉस',
    'Geyser remained on thermal standby for 45 minutes beyond typical family shower schedule.',
    'गीज़र सामान्य उपयोग के समय के बाद भी 45 मिनट तक हीटिंग स्टैंडबाय पर रहा।',
    'unusual_spike',
    88,
    1.15,
    9.20,
    'Enable smart geyser auto-cutoff timer (25 mins)',
    'स्मार्ट गीज़र ऑटो-कटऑफ टाइमर (25 मिनट) सक्रिय करें',
    'active'
  );

  // Seed Smart Rules
  const insertRule = db.prepare(`
    INSERT INTO rules (
      id, title, title_hi, description, description_hi,
      trigger_type, threshold_val, action_type, target_appliance_id,
      is_enabled, last_triggered_at, trigger_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 hours'), ?)
  `);

  insertRule.run(
    'rule-empty-home',
    'Empty Home Eco Safeguard',
    'खाली घर इको सुरक्षा',
    'When occupancy drops to 0, immediately cut off non-essential cooling, lights, and appliances.',
    'जब घर में कोई न हो, गैर-ज़रूरी एसी, लाइटें और उपकरण तुरंत बंद करें।',
    'occupancy_empty',
    0,
    'turn_off_non_essential',
    null,
    1,
    14
  );

  insertRule.run(
    'rule-peak-shedding',
    'Peak Tariff Load Shedding (>3.5 kW)',
    'पीक टैरिफ लोड शेडिंग (>3.5 kW)',
    'When total instant power exceeds 3,500 Watts during peak hours (18:00–22:00), stagger water pump and washer.',
    'जब शाम 6 से 10 बजे के बीच कुल बिजली 3,500W से अधिक हो, तो पंप और वाशिंग मशीन को स्थगित करें।',
    'power_threshold',
    3500,
    'shed_heavy_load',
    'pump',
    1,
    7
  );

  insertRule.run(
    'rule-night-vampire',
    'Midnight Vampire Load Annihilator',
    'मिडनाइट वैम्पायर लोड निवारक',
    'After 23:30, automatically isolate entertainment center and workstation standby plugs.',
    'रात 11:30 के बाद टीवी और वर्कस्टेशन के स्टैंडबाय प्लग बंद करें।',
    'night_standby',
    23.5,
    'cut_standby',
    'tv',
    1,
    29
  );

  insertRule.run(
    'rule-ac-eco-comfort',
    'Adaptive Sleep Curve Optimization',
    'अनुकूलित स्लीप टेम्परेचर कर्व',
    'Maintain AC at 24°C from 22:00–02:00, gently raise to 26°C with ceiling fan sync until 06:00.',
    'रात 10 से 2 बजे तक 24°C रखें, फिर सुबह 6 बजे तक धीरे-धीरे 26°C करें।',
    'temp_high',
    24,
    'adjust_setpoint',
    'ac',
    1,
    21
  );

  // Seed Energy Goals
  const insertGoal = db.prepare(`
    INSERT INTO goals (
      id, title, title_hi, description, target_metric,
      target_value, current_value, unit, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  insertGoal.run(
    'goal-bill-reduction',
    'Slash Monthly Bill by 15%',
    'मासिक बिजली बिल में 15% की कमी',
    'Bring current monthly projection from ₹3,120 down below ₹2,650 through optimized scheduling.',
    'bill_reduction_pct',
    15,
    11.8,
    '%',
    'active'
  );

  insertGoal.run(
    'goal-daily-kwh',
    'Maintain Under 12 kWh Daily Baseline',
    'दैनिक खपत 12 kWh से कम रखें',
    'Average daily consumption across weekdays kept under 12 units.',
    'daily_kwh_max',
    12.0,
    10.4,
    'kWh/day',
    'active'
  );

  insertGoal.run(
    'goal-vampire-zero',
    'Zero Vampire Standby Waste',
    'शून्य वैम्पायर स्टैंडबाय वेस्ट',
    'Eliminate phantom standby load across TVs, chargers, and geysers during sleep hours.',
    'vampire_eliminated',
    100,
    82,
    '% eliminated',
    'active'
  );

  // Seed Settings
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  const defaultSettings = [
    ['theme', 'dark'],
    ['sound_enabled', 'true'],
    ['voice_enabled', 'true'],
    ['language', 'hi'],
    ['currency', '₹'],
    ['tariff_kwh', '8.00'],
    ['tariff_model', 'slab'], // slab or flat
    ['simulation_speed', '1x'],
    ['simulation_mode', 'Normal Day'],
    ['has_seen_welcome', 'false'],
    ['smart_saving_enabled', 'false'],
    ['smart_saving_before_watts', '2320'],
    ['smart_saving_after_watts', '1690'],
    ['google_home_status', 'ready_for_credentials'],
    ['google_home_project_id', 'wattwise-smart-home-2026'],
    ['matter_fabric_id', 'FABRIC-MATTER-IND-0042']
  ];

  for (const [k, v] of defaultSettings) {
    insertSetting.run(k, v);
  }

  // Seed Activity Log
  const insertLog = db.prepare(`
    INSERT INTO activity_log (event_type, message, message_hi, kwh_impact, cost_impact, timestamp)
    VALUES (?, ?, ?, ?, ?, datetime('now', '-35 minutes'))
  `);
  insertLog.run(
    'recommendation_applied',
    'Auto-scheduled Water Pump to non-peak off-solar window (11:00 AM)',
    'वाटर पंप को नॉन-पीक समय (सुबह 11:00) के लिए शेड्यूल किया गया',
    0.75,
    6.00
  );
  insertLog.run(
    'rule_executed',
    'Rule triggered: Midnight Vampire Load Annihilator saved 0.28 kWh',
    'स्मार्ट नियम सक्रिय: मिडनाइट वैम्पायर लोड निवारक ने 0.28 kWh बचाया',
    0.28,
    2.24
  );
}
