import { Database } from 'sql.js';
import crypto from 'crypto';

// ─── Helper ────────────────────────────────────────────────────────────────────

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

function getSetting(db: Database, key: string, fallback: string = '0'): string {
  const rows = queryAll(db, 'SELECT value FROM settings WHERE key = ?', [key]);
  return rows.length > 0 ? String(rows[0].value) : fallback;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export function getDashboard(db: Database) {
  const appliances = queryAll(db, 'SELECT * FROM appliances');
  const tariff = parseFloat(getSetting(db, 'tariff', '8'));

  const onAppliances = appliances.filter((a: any) => Number(a.is_on) === 1);
  const currentPower = onAppliances.reduce((sum: number, a: any) => sum + Number(a.power_watts), 0);
  const todayConsumption = parseFloat(
    onAppliances.reduce((sum: number, a: any) => sum + (Number(a.power_watts) * Number(a.daily_usage_hours)) / 1000, 0).toFixed(2)
  );
  const todayCost = parseFloat((todayConsumption * tariff).toFixed(2));
  const activeAppliances = onAppliances.length;

  // Efficiency score: start at 100, subtract for wasteful patterns
  let efficiencyScore = 100;
  for (const a of onAppliances) {
    const name = String(a.name).toLowerCase();
    if (name === 'ac') efficiencyScore -= 10;
    if (name === 'geyser') efficiencyScore -= 15;
    if (Number(a.power_watts) > 1000) efficiencyScore -= 5;
  }
  if (activeAppliances > 6) efficiencyScore -= (activeAppliances - 6) * 3;
  if (todayConsumption > 10) efficiencyScore -= 5;
  efficiencyScore = Math.max(0, Math.min(100, efficiencyScore));

  // Potential savings: from turning off low-priority on-devices
  const lowPriOn = onAppliances.filter((a: any) => a.priority === 'low');
  const potentialSavings = parseFloat(
    lowPriOn.reduce((sum: number, a: any) => sum + (Number(a.power_watts) * Number(a.daily_usage_hours) * tariff) / 1000, 0).toFixed(2)
  );

  // Energy trend: 24 hourly values
  const baseLoad = appliances
    .filter((a: any) => Number(a.is_on) === 1 && a.priority === 'high')
    .reduce((s: number, a: any) => s + Number(a.power_watts), 0);
  const peakLoad = currentPower;
  const energyTrend: number[] = [];
  const hourlyProfile = [
    0.2, 0.18, 0.15, 0.15, 0.15, 0.2, // 0-5 AM  low
    0.35, 0.5, 0.55, 0.45, 0.4, 0.4,   // 6-11 AM rise & moderate
    0.42, 0.4, 0.38, 0.4, 0.45, 0.55,  // 12-5 PM moderate
    0.7, 0.85, 0.95, 1.0, 0.8, 0.5,    // 6-11 PM peak
  ];

  for (let h = 0; h < 24; h++) {
    const factor = hourlyProfile[h];
    const value = (baseLoad + (peakLoad - baseLoad) * factor) / 1000;
    // Add slight randomness (deterministic based on hour)
    const noise = ((h * 7 + 3) % 10 - 5) / 100;
    energyTrend.push(parseFloat(Math.max(0, value + value * noise).toFixed(3)));
  }

  return {
    currentPower,
    todayConsumption,
    todayCost,
    efficiencyScore,
    activeAppliances,
    totalAppliances: appliances.length,
    potentialSavings,
    energyTrend,
    tariff,
  };
}

// ─── Leaks ─────────────────────────────────────────────────────────────────────

export function getLeaks(db: Database) {
  const appliances = queryAll(db, 'SELECT * FROM appliances');
  const tariff = parseFloat(getSetting(db, 'tariff', '8'));
  const currentHour = new Date().getHours();
  const leaks: any[] = [];

  for (const a of appliances) {
    const isOn = Number(a.is_on) === 1;
    const name = String(a.name);
    const power = Number(a.power_watts);
    const hours = Number(a.daily_usage_hours);
    const scheduleEnd = String(a.schedule_end || '');

    // TV left on past schedule
    if (name === 'TV' && isOn && scheduleEnd) {
      const endHour = parseInt(scheduleEnd.split(':')[0], 10);
      if (!isNaN(endHour) && currentHour > endHour) {
        const wasteHours = currentHour - endHour;
        const wasteKwh = parseFloat(((power * wasteHours) / 1000).toFixed(3));
        leaks.push({
          id: crypto.randomUUID(),
          appliance_id: a.id,
          applianceName: name,
          type: 'schedule_overrun',
          description: `${name} left on past scheduled end time (${scheduleEnd}). Running ${wasteHours} extra hours.`,
          confidence: 0.9,
          waste_kwh: wasteKwh,
          waste_cost: parseFloat((wasteKwh * tariff).toFixed(2)),
          detected_at: new Date().toISOString(),
        });
      }
    }

    // Geyser running continuously
    if (name === 'Geyser' && isOn) {
      const wasteKwh = parseFloat(((power * 1) / 1000).toFixed(3)); // 1 hour extra
      leaks.push({
        id: crypto.randomUUID(),
        appliance_id: a.id,
        applianceName: name,
        type: 'continuous_run',
        description: 'Geyser is running continuously. It only needs 15-20 minutes to heat water.',
        confidence: 0.95,
        waste_kwh: wasteKwh,
        waste_cost: parseFloat((wasteKwh * tariff).toFixed(2)),
        detected_at: new Date().toISOString(),
      });
    }
  }

  // Standby/vampire load for off devices
  const offDevices = appliances.filter((a: any) => Number(a.is_on) === 0);
  if (offDevices.length > 0) {
    const standbyWatts = 5; // per device
    const totalStandbyW = offDevices.length * standbyWatts;
    const wasteKwh = parseFloat(((totalStandbyW * 24) / 1000).toFixed(3));
    leaks.push({
      id: crypto.randomUUID(),
      appliance_id: null,
      applianceName: `${offDevices.length} standby devices`,
      type: 'standby_waste',
      description: `${offDevices.length} devices in standby mode consuming ~${standbyWatts}W each. Total vampire load: ${totalStandbyW}W.`,
      confidence: 0.7,
      waste_kwh: wasteKwh,
      waste_cost: parseFloat((wasteKwh * tariff).toFixed(2)),
      detected_at: new Date().toISOString(),
    });
  }

  // Unusual nighttime usage
  if (currentHour >= 23 || currentHour < 5) {
    const totalOnPower = appliances
      .filter((a: any) => Number(a.is_on) === 1)
      .reduce((s: number, a: any) => s + Number(a.power_watts), 0);
    if (totalOnPower > 3000) {
      leaks.push({
        id: crypto.randomUUID(),
        appliance_id: null,
        applianceName: 'Multiple devices',
        type: 'nighttime_overuse',
        description: `Total power consumption is ${totalOnPower}W during nighttime hours. Consider turning off non-essential devices.`,
        confidence: 0.8,
        waste_kwh: parseFloat(((totalOnPower * 2) / 1000).toFixed(3)),
        waste_cost: parseFloat((((totalOnPower * 2) / 1000) * tariff).toFixed(2)),
        detected_at: new Date().toISOString(),
      });
    }
  }

  return leaks;
}

// ─── Insights ──────────────────────────────────────────────────────────────────

export function getInsights(db: Database) {
  const appliances = queryAll(db, 'SELECT * FROM appliances');
  const tariff = parseFloat(getSetting(db, 'tariff', '8'));
  const insights: any[] = [];

  // Total daily consumption
  const totalDailyKwh = appliances.reduce(
    (s: number, a: any) => s + (Number(a.power_watts) * Number(a.daily_usage_hours)) / 1000,
    0
  );
  const monthlyKwh = totalDailyKwh * 30;

  // 1. AC percentage
  const ac = appliances.find((a: any) => String(a.name) === 'AC');
  if (ac) {
    const acDailyKwh = (Number(ac.power_watts) * Number(ac.daily_usage_hours)) / 1000;
    const acPct = totalDailyKwh > 0 ? ((acDailyKwh / totalDailyKwh) * 100).toFixed(1) : '0';
    insights.push({
      id: crypto.randomUUID(),
      title: 'AC Dominates Your Consumption',
      description: `Your AC accounts for ${acPct}% of total daily consumption (${acDailyKwh.toFixed(1)} kWh/day).`,
      impact: 'high',
      category: 'consumption',
      recommended_action: 'Set AC to 24°C and use a timer to reduce usage by 20-30%.',
    });
  }

  // 2. Evening peak
  insights.push({
    id: crypto.randomUUID(),
    title: 'Evening Consumption Peak',
    description: 'Your consumption peaks between 7-10 PM when AC, TV, lights, and cooking appliances run simultaneously.',
    impact: 'medium',
    category: 'pattern',
    recommended_action: 'Stagger appliance usage during peak hours to reduce maximum demand.',
  });

  // 3. Standby waste
  const offCount = appliances.filter((a: any) => Number(a.is_on) === 0).length;
  const standbyMonthlyKwh = parseFloat(((offCount * 5 * 24 * 30) / 1000).toFixed(2));
  insights.push({
    id: crypto.randomUUID(),
    title: 'Standby Power Waste',
    description: `${offCount} devices in standby mode waste approximately ${standbyMonthlyKwh} kWh/month (₹${(standbyMonthlyKwh * tariff).toFixed(0)}).`,
    impact: 'low',
    category: 'waste',
    recommended_action: 'Use power strips to fully disconnect devices when not in use.',
  });

  // 4. AC temperature savings
  if (ac) {
    const acMonthly = (Number(ac.power_watts) * Number(ac.daily_usage_hours) * 30) / 1000;
    const savingsPerDegree = acMonthly * 0.07 * tariff;
    const savingsTwo = parseFloat((savingsPerDegree * 2).toFixed(0));
    insights.push({
      id: crypto.randomUUID(),
      title: 'Temperature Optimization',
      description: `Switching AC from 22°C to 24°C could save ₹${savingsTwo}/month (7% savings per degree).`,
      impact: 'high',
      category: 'optimization',
      recommended_action: 'Set AC temperature to 24-25°C for optimal comfort and savings.',
    });
  }

  // 5. Refrigerator baseline
  const fridge = appliances.find((a: any) => String(a.name) === 'Refrigerator');
  if (fridge) {
    const fridgeDailyKwh = (Number(fridge.power_watts) * Number(fridge.daily_usage_hours)) / 1000;
    insights.push({
      id: crypto.randomUUID(),
      title: 'Always-On Baseline',
      description: `Refrigerator is your always-on baseline at ${fridgeDailyKwh.toFixed(1)} kWh/day (₹${(fridgeDailyKwh * tariff).toFixed(0)}/day).`,
      impact: 'low',
      category: 'baseline',
      recommended_action: 'Ensure proper door sealing and maintain coil cleanliness to optimize efficiency.',
    });
  }

  // 6. Washing machine off-peak
  const washer = appliances.find((a: any) => String(a.name) === 'Washing Machine');
  if (washer) {
    const peakTariff = parseFloat(getSetting(db, 'peak_tariff', '12'));
    const loadKwh = (Number(washer.power_watts) * 1) / 1000;
    const savingsPerLoad = parseFloat((loadKwh * (peakTariff - tariff)).toFixed(2));
    insights.push({
      id: crypto.randomUUID(),
      title: 'Off-Peak Washing',
      description: `Running Washing Machine during off-peak hours saves ₹${savingsPerLoad}/load.`,
      impact: 'medium',
      category: 'scheduling',
      recommended_action: 'Schedule washing cycles for early morning or late night when tariff is lower.',
    });
  }

  // 7. Geyser is most power-hungry
  const geyser = appliances.find((a: any) => String(a.name) === 'Geyser');
  if (geyser) {
    insights.push({
      id: crypto.randomUUID(),
      title: 'Highest Power Appliance',
      description: `Geyser is your most power-hungry appliance at ${Number(geyser.power_watts)}W. Even 30 minutes of use consumes ${((Number(geyser.power_watts) * 0.5) / 1000).toFixed(1)} kWh.`,
      impact: 'high',
      category: 'consumption',
      recommended_action: 'Use a timer to limit geyser usage to 15-20 minutes. Consider a solar water heater.',
    });
  }

  // 8. Monthly bill summary
  const monthlyBill = parseFloat((monthlyKwh * tariff).toFixed(0));
  insights.push({
    id: crypto.randomUUID(),
    title: 'Monthly Bill Projection',
    description: `At current usage (${monthlyKwh.toFixed(1)} kWh/month), your projected bill is ₹${monthlyBill}.`,
    impact: 'medium',
    category: 'billing',
    recommended_action: 'Implement the suggested optimizations to reduce your bill by 15-25%.',
  });

  return insights;
}

// ─── What-If Analysis ──────────────────────────────────────────────────────────

export function calculateWhatIf(
  db: Database,
  params: {
    ac_temp_delta?: number;
    ac_hours?: number;
    geyser_hours?: number;
    fan_hours?: number;
    light_hours?: number;
    washing_freq?: number;
    peak_usage_pct?: number;
  }
) {
  const appliances = queryAll(db, 'SELECT * FROM appliances');
  const tariff = parseFloat(getSetting(db, 'tariff', '8'));

  // Current monthly calculation
  let currentMonthlyKwh = 0;
  for (const a of appliances) {
    currentMonthlyKwh += (Number(a.power_watts) * Number(a.daily_usage_hours) * 30) / 1000;
  }
  const currentBill = parseFloat((currentMonthlyKwh * tariff).toFixed(2));

  // Optimized: clone and modify
  let optimizedMonthlyKwh = 0;
  for (const a of appliances) {
    let power = Number(a.power_watts);
    let hours = Number(a.daily_usage_hours);
    const name = String(a.name);

    if (name === 'AC') {
      if (params.ac_temp_delta !== undefined) {
        // Each degree saves 7%
        power = power * (1 - params.ac_temp_delta * 0.07);
      }
      if (params.ac_hours !== undefined) {
        hours = params.ac_hours;
      }
    }
    if (name === 'Geyser' && params.geyser_hours !== undefined) {
      hours = params.geyser_hours;
    }
    if (name === 'Fan' && params.fan_hours !== undefined) {
      hours = params.fan_hours;
    }
    if (name === 'Lights' && params.light_hours !== undefined) {
      hours = params.light_hours;
    }
    if (name === 'Washing Machine' && params.washing_freq !== undefined) {
      hours = params.washing_freq; // hours per day
    }

    optimizedMonthlyKwh += (power * hours * 30) / 1000;
  }

  if (params.peak_usage_pct !== undefined) {
    optimizedMonthlyKwh *= (1 - params.peak_usage_pct / 100);
  }

  const optimizedBill = parseFloat((optimizedMonthlyKwh * tariff).toFixed(2));
  const savings = parseFloat((currentBill - optimizedBill).toFixed(2));

  const CO2_FACTOR = 0.82; // kg per kWh (India grid)
  const currentCO2 = parseFloat((currentMonthlyKwh * CO2_FACTOR).toFixed(2));
  const optimizedCO2 = parseFloat((optimizedMonthlyKwh * CO2_FACTOR).toFixed(2));

  return {
    currentBill,
    optimizedBill,
    savings,
    currentConsumption: parseFloat(currentMonthlyKwh.toFixed(2)),
    optimizedConsumption: parseFloat(optimizedMonthlyKwh.toFixed(2)),
    currentCO2,
    optimizedCO2,
  };
}

// ─── Bill Forecast ─────────────────────────────────────────────────────────────

export function getBillForecast(db: Database) {
  const appliances = queryAll(db, 'SELECT * FROM appliances');
  const tariff = parseFloat(getSetting(db, 'tariff', '8'));

  // Current daily usage
  const currentDailyKwh = appliances.reduce(
    (s: number, a: any) => s + (Number(a.power_watts) * Number(a.daily_usage_hours)) / 1000,
    0
  );
  const projectedMonthly = parseFloat((currentDailyKwh * 30).toFixed(2));
  const projectedBill = parseFloat((projectedMonthly * tariff).toFixed(2));
  const previousMonth = parseFloat((projectedBill * 1.08).toFixed(2));
  const optimizedBill = parseFloat((projectedBill * 0.78).toFixed(2));

  // Daily projection for 30 days with slight variation
  const dailyProjection: { day: number; cost: number; kwh: number }[] = [];
  for (let d = 1; d <= 30; d++) {
    // Deterministic noise based on day
    const noise = 1 + ((d * 13 + 7) % 20 - 10) / 100;
    const dayKwh = parseFloat((currentDailyKwh * noise).toFixed(2));
    const dayCost = parseFloat((dayKwh * tariff).toFixed(2));
    dailyProjection.push({ day: d, cost: dayCost, kwh: dayKwh });
  }

  return {
    currentUsage: parseFloat(currentDailyKwh.toFixed(2)),
    projectedMonthly,
    projectedBill,
    previousMonth,
    optimizedBill,
    dailyProjection,
  };
}

// ─── Carbon Impact ─────────────────────────────────────────────────────────────

export function getCarbonImpact(db: Database) {
  const appliances = queryAll(db, 'SELECT * FROM appliances');

  // Today kWh from on devices
  const onAppliances = appliances.filter((a: any) => Number(a.is_on) === 1);
  const todayKwh = onAppliances.reduce(
    (s: number, a: any) => s + (Number(a.power_watts) * Number(a.daily_usage_hours)) / 1000,
    0
  );

  const CO2_FACTOR = 0.82; // kg CO2 per kWh (India)
  const co2Today = parseFloat((todayKwh * CO2_FACTOR).toFixed(2));
  const co2Month = parseFloat((co2Today * 30).toFixed(2));

  // Assume 20% savings
  const co2SavedToday = parseFloat((co2Today * 0.2).toFixed(2));
  const co2SavedMonth = parseFloat((co2Month * 0.2).toFixed(2));

  // Equivalents
  const equivalentTrees = parseFloat((co2SavedMonth / (22 / 12)).toFixed(1)); // 22 kg CO2 per tree per year
  const equivalentEvKm = parseFloat((co2SavedMonth / 0.05).toFixed(0)); // 50g CO2 per km

  const impactStory = `By optimizing your energy usage, you could save ${co2SavedMonth} kg of CO₂ per month. That's equivalent to planting ${equivalentTrees} trees or driving an EV for ${equivalentEvKm} km instead of a petrol car.`;

  return {
    todayKwh: parseFloat(todayKwh.toFixed(2)),
    co2Today,
    co2Month,
    co2SavedToday,
    co2SavedMonth,
    equivalentTrees,
    equivalentEvKm,
    impactStory,
  };
}

// ─── Simulation Mode ──────────────────────────────────────────────────────────

export function applySimulationMode(db: Database, mode: string) {
  const appliances = queryAll(db, 'SELECT * FROM appliances');

  switch (mode) {
    case 'normal':
      // Reset to defaults
      const defaults: Record<string, { on: number; power?: number; hours: number }> = {
        AC: { on: 1, power: 1500, hours: 8 },
        Refrigerator: { on: 1, power: 150, hours: 24 },
        'Washing Machine': { on: 0, power: 500, hours: 1 },
        TV: { on: 1, power: 120, hours: 5 },
        Fan: { on: 1, power: 75, hours: 12 },
        Lights: { on: 1, power: 60, hours: 8 },
        Geyser: { on: 0, power: 2000, hours: 0.5 },
        Microwave: { on: 0, power: 1200, hours: 0.3 },
        Laptop: { on: 1, power: 65, hours: 8 },
        'Water Pump': { on: 0, power: 750, hours: 1 },
      };
      for (const a of appliances) {
        const d = defaults[String(a.name)];
        if (d) {
          db.run(
            'UPDATE appliances SET is_on = ?, power_watts = ?, daily_usage_hours = ?, schedule_end = ? WHERE id = ?',
            [d.on, d.power ?? Number(a.power_watts), d.hours, '', a.id]
          );
        }
      }
      break;

    case 'high_usage':
      for (const a of appliances) {
        let power = Number(a.power_watts);
        if (String(a.name) === 'AC') power = 2000;
        db.run('UPDATE appliances SET is_on = 1, power_watts = ? WHERE id = ?', [power, a.id]);
      }
      break;

    case 'vacation':
      for (const a of appliances) {
        const isOn = String(a.name) === 'Refrigerator' ? 1 : 0;
        db.run('UPDATE appliances SET is_on = ? WHERE id = ?', [isOn, a.id]);
      }
      break;

    case 'peak_hour':
      db.run("UPDATE settings SET value = '12' WHERE key = 'tariff'");
      for (const a of appliances) {
        const name = String(a.name);
        const shouldBeOn = ['AC', 'Lights', 'TV', 'Fan', 'Refrigerator'].includes(name);
        db.run('UPDATE appliances SET is_on = ? WHERE id = ?', [shouldBeOn ? 1 : 0, a.id]);
      }
      break;

    case 'optimized':
      for (const a of appliances) {
        const name = String(a.name);
        const isEssential = ['Refrigerator', 'Lights', 'Fan', 'Laptop'].includes(name);
        const power = Math.round(Number(a.power_watts) * 0.8);
        db.run('UPDATE appliances SET is_on = ?, power_watts = ? WHERE id = ?', [
          isEssential ? 1 : 0,
          power,
          a.id,
        ]);
      }
      break;
  }

  return { mode, applied: true };
}

// ─── Demo ──────────────────────────────────────────────────────────────────────

export function runDemo(db: Database) {
  const events: string[] = [];

  // 1. Reset to normal
  applySimulationMode(db, 'normal');
  events.push('Reset all appliances to normal state');

  // 2. Turn on TV with schedule_end in the past (simulate forgotten TV)
  const pastHour = new Date().getHours() - 2;
  const scheduleEnd = `${pastHour < 0 ? pastHour + 24 : pastHour}:00`;
  const tvRows = queryAll(db, "SELECT id FROM appliances WHERE name = 'TV'");
  if (tvRows.length > 0) {
    db.run('UPDATE appliances SET is_on = 1, schedule_end = ? WHERE id = ?', [scheduleEnd, tvRows[0].id]);
    events.push(`TV left on past scheduled end time (${scheduleEnd})`);
  }

  // 3. Turn on Geyser (simulate waste)
  const geyserRows = queryAll(db, "SELECT id FROM appliances WHERE name = 'Geyser'");
  if (geyserRows.length > 0) {
    db.run('UPDATE appliances SET is_on = 1 WHERE id = ?', [geyserRows[0].id]);
    events.push('Geyser turned on and running continuously (simulating waste)');
  }

  events.push('Demo scenario ready — check Leaks and Dashboard for detected issues');

  return { events };
}
