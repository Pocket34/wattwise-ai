// WattWise Intelligence Engine
// Deterministic AI Reasoning, Telemetry Simulation, Anomaly Detector, and Energy Forecasting

// Grid carbon factor in India (BEE standard): ~0.82 kg CO2 per kWh
export const CO2_PER_KWH = 0.82;
// Average tree absorbs ~21.77 kg of CO2 per year (~1.81 kg per month)
export const CO2_PER_TREE_MONTH = 1.81;
// Average EV car emission avoidance: ~0.12 kg CO2 per km compared to ICE vehicle
export const CO2_PER_EV_KM = 0.12;

// Standard Indian Residential Tariff Slab:
// Slab 1: 0 - 100 kWh -> ₹4.20 / unit
// Slab 2: 101 - 200 kWh -> ₹6.50 / unit
// Slab 3: 201 - 400 kWh -> ₹8.00 / unit
// Slab 4: > 400 kWh -> ₹10.20 / unit
export function calculateSlabCost(kwh) {
  let cost = 0;
  let remaining = kwh;

  if (remaining > 400) {
    cost += (remaining - 400) * 10.20;
    remaining = 400;
  }
  if (remaining > 200) {
    cost += (remaining - 200) * 8.00;
    remaining = 200;
  }
  if (remaining > 100) {
    cost += (remaining - 100) * 6.50;
    remaining = 100;
  }
  cost += remaining * 4.20;
  return cost;
}

export function calculateEffectiveTariff(kwh, baseRate = 8.0, model = 'slab') {
  if (model === 'flat') {
    return baseRate;
  }
  if (kwh <= 0) return 4.20;
  return calculateSlabCost(kwh) / kwh;
}

/**
 * Computes telemetry state for the home
 */
export function computeTelemetry(appliances, simulationMode = 'Normal Day', tariffRate = 8.0, tariffModel = 'slab') {
  let currentWatts = 0;
  let baselineWatts = 0;
  let standbyVampireWatts = 0;
  let todayKwh = 0;
  let activeCount = 0;

  const roomMap = {};
  const categoryMap = {};

  for (const app of appliances) {
    baselineWatts += (app.baseline_watts || app.power_watts);

    // If appliance is ON, add its operating power
    let appDrawWatts = 0;
    if (app.is_on) {
      activeCount++;
      // If AC, adjust power based on temperature setpoint (24°C is baseline; each 1°C lower adds ~6% draw)
      if (app.id === 'ac') {
        const tempDelta = 24.0 - (app.temp_setpoint || 24.0);
        const factor = 1 + (tempDelta * 0.06);
        appDrawWatts = Math.round(app.power_watts * Math.max(0.7, factor));
      } else if (app.id === 'fan' && app.device_speed) {
        // Fan speed 1-5 factors: Speed 1 (35%), Speed 2 (55%), Speed 3 (75%), Speed 4 (90%), Speed 5 (100%)
        const speedFactors = { 1: 0.35, 2: 0.55, 3: 0.75, 4: 0.90, 5: 1.0 };
        const factor = speedFactors[app.device_speed] || 0.75;
        appDrawWatts = Math.round(app.power_watts * factor);
      } else if (app.id === 'lights' && app.brightness !== undefined) {
        // Brightness scaling 10% to 100%
        appDrawWatts = Math.round(app.power_watts * (Math.max(10, Math.min(100, app.brightness)) / 100));
      } else if (app.id === 'geyser' && app.water_temp) {
        // Water heater draw
        appDrawWatts = app.water_temp > 52 ? 2000 : 1600;
      } else {
        appDrawWatts = app.power_watts;
      }
      currentWatts += appDrawWatts;
    } else {
      // If appliance is OFF but has vampire standby active, draw standby
      if (app.vampire_active && app.standby_watts > 0) {
        standbyVampireWatts += app.standby_watts;
        appDrawWatts = app.standby_watts;
        currentWatts += app.standby_watts;
      }
    }

    // Daily consumption (kWh)
    let dailyHours = app.daily_hours || 0;
    if (simulationMode === 'Vacation Mode') {
      dailyHours = app.id === 'fridge' ? 24 : 0.2;
    } else if (simulationMode === 'High Usage') {
      dailyHours = Math.min(24, dailyHours * 1.35);
    } else if (simulationMode === 'Optimized Home') {
      dailyHours = Math.max(0.5, dailyHours * 0.78);
    }

    const appDailyKwh = (app.is_on ? (appDrawWatts * dailyHours) / 1000 : 0) +
                       (app.vampire_active ? (app.standby_watts * (24 - dailyHours)) / 1000 : 0);

    todayKwh += appDailyKwh;

    // Room accumulation
    roomMap[app.room] = (roomMap[app.room] || 0) + (app.is_on ? appDrawWatts : (app.vampire_active ? app.standby_watts : 0));

    // Category accumulation
    categoryMap[app.category] = (categoryMap[app.category] || 0) + (app.is_on ? appDrawWatts : (app.vampire_active ? app.standby_watts : 0));
  }

  // Simulation mode modifiers
  if (simulationMode === 'Peak Hour') {
    currentWatts = Math.round(currentWatts * 1.25);
  } else if (simulationMode === 'Optimized Home') {
    currentWatts = Math.round(currentWatts * 0.72);
  } else if (simulationMode === 'Vacation Mode') {
    currentWatts = Math.min(currentWatts, 220); // Only fridge and minimum standby
  }

  const effectiveTariff = tariffModel === 'slab' ? calculateEffectiveTariff(todayKwh * 30, tariffRate, 'slab') : tariffRate;
  const todayCost = Math.round(todayKwh * effectiveTariff * 100) / 100;

  // Efficiency Score (0 to 100):
  let efficiencyScore = 88;
  if (standbyVampireWatts > 30) efficiencyScore -= 12;
  else if (standbyVampireWatts > 10) efficiencyScore -= 6;

  const acApp = appliances.find(a => a.id === 'ac');
  if (acApp && acApp.is_on && acApp.temp_setpoint < 24) {
    efficiencyScore -= Math.round((24 - acApp.temp_setpoint) * 4);
  }

  if (currentWatts > 3200) efficiencyScore -= 15;
  else if (currentWatts > 2400) efficiencyScore -= 8;

  if (simulationMode === 'Optimized Home') efficiencyScore = 96;
  if (simulationMode === 'High Usage') efficiencyScore = Math.min(efficiencyScore, 64);
  if (simulationMode === 'Vacation Mode') efficiencyScore = 94;

  efficiencyScore = Math.max(35, Math.min(99, efficiencyScore));

  // Potential savings today
  const potentialSavingsTodayKwh = Math.round((standbyVampireWatts * 18 / 1000 + (acApp && acApp.is_on && acApp.temp_setpoint < 24 ? 2.4 : 0.8)) * 100) / 100;
  const potentialSavingsTodayCost = Math.round(potentialSavingsTodayKwh * effectiveTariff);

  // Carbon metric
  const co2TodayKg = Math.round(todayKwh * CO2_PER_KWH * 100) / 100;
  const co2AvoidedMonthKg = Math.round(potentialSavingsTodayKwh * 30 * CO2_PER_KWH * 10) / 10;
  const equivalentTrees = Math.round((co2AvoidedMonthKg / CO2_PER_TREE_MONTH) * 10) / 10;
  const equivalentEvKm = Math.round(co2AvoidedMonthKg / CO2_PER_EV_KM);

  // 24-hour simulation load curve
  const hourlyGraph = generateHourlyCurve(appliances, simulationMode);

  return {
    currentWatts,
    baselineWatts,
    standbyVampireWatts,
    activeCount,
    todayKwh: Math.round(todayKwh * 100) / 100,
    todayCost,
    effectiveTariff: Math.round(effectiveTariff * 100) / 100,
    efficiencyScore,
    potentialSavingsTodayKwh,
    potentialSavingsTodayCost,
    co2TodayKg,
    co2AvoidedMonthKg,
    equivalentTrees,
    equivalentEvKm,
    hourlyGraph,
    roomContributions: Object.entries(roomMap).map(([room, watts]) => ({ room, watts })),
    categoryContributions: Object.entries(categoryMap).map(([category, watts]) => ({ category, watts }))
  };
}

/**
 * 24-hour load profile generator based on Indian household routines
 */
function generateHourlyCurve(appliances, simulationMode) {
  const hours = [];
  const currentHour = new Date().getHours();

  for (let h = 0; h < 24; h++) {
    let hourLoad = 380; // Base standby + fridge cycle

    // Morning routine (06:00 - 09:00): Geyser, pump, kitchen
    if (h >= 6 && h <= 9) {
      hourLoad += 1800;
    }
    // Midday (10:00 - 16:00): Moderate home office, fans, fridge
    else if (h >= 10 && h <= 16) {
      hourLoad += 650;
    }
    // Evening Peak (18:00 - 22:30): Lights, TV, AC pre-cool, kitchen
    else if (h >= 18 && h <= 22) {
      hourLoad += 2250;
    }
    // Night Sleep (23:00 - 05:00): AC sleep curve + fans
    else {
      hourLoad += 1200;
    }

    if (simulationMode === 'High Usage') hourLoad *= 1.45;
    if (simulationMode === 'Optimized Home') hourLoad *= 0.72;
    if (simulationMode === 'Vacation Mode') hourLoad = Math.min(hourLoad, 240);

    const isPeak = (h >= 18 && h <= 22);

    hours.push({
      hour: `${h.toString().padStart(2, '0')}:00`,
      hourNum: h,
      watts: Math.round(hourLoad + (Math.sin(h * 0.8) * 120)),
      isCurrent: h === currentHour,
      isPeak,
      costRate: Math.round(((hourLoad / 1000) * (isPeak ? 9.5 : 7.2)) * 10) / 10
    });
  }
  return hours;
}

/**
 * Generates deterministic AI insights from current telemetry and appliance state
 */
export function generateInsights(telemetry, appliances, leaks) {
  const insights = [];

  const ac = appliances.find(a => a.id === 'ac');
  const geyser = appliances.find(a => a.id === 'geyser');

  // 1. AC Load Proportion
  if (ac && ac.is_on && telemetry.currentWatts > 0) {
    const acDraw = Math.round(ac.power_watts * (1 + (24.0 - (ac.temp_setpoint || 24.0)) * 0.06));
    const acPct = Math.round((acDraw / telemetry.currentWatts) * 100);
    insights.push({
      id: 'ins-ac-load-share',
      type: 'cooling_optimization',
      severity: acPct > 35 ? 'high' : 'medium',
      title: `AC is consuming ${acPct}% of your current household load`,
      title_hi: `एसी आपके वर्तमान घरेलू लोड का ${acPct}% उपभोग कर रहा है`,
      description: `Master Bed AC is drawing ${acDraw}W out of ${telemetry.currentWatts}W total active power. Increasing temperature to 24°C saves ~6% compressor energy per degree.`,
      description_hi: `मास्टर एसी कुल ${telemetry.currentWatts}W में से ${acDraw}W बिजली खींच रहा है। तापमान 24°C करने से प्रति डिग्री 6% बचत होगी।`,
      whyItMatters: 'Compressor cycling frequency increases exponentially below 24°C, raising power draw by 180-240 Watts.',
      estimatedImpact: 'Saves ₹22–₹35 / day',
      actionLabel: 'Optimize Now (Set 24°C)',
      actionPayload: { action: 'update_appliance', id: 'ac', updates: { temp_setpoint: 24.0, power_watts: 1220 } }
    });
  }

  // 2. Water Heater Overrun Warning
  if (geyser && (geyser.is_on || geyser.daily_hours > 0.8)) {
    insights.push({
      id: 'ins-geyser-runtime',
      type: 'heating_overrun',
      severity: 'medium',
      title: 'Water heater running longer than typical morning pattern',
      title_hi: 'वाटर हीटर (गीज़र) सामान्य समय से अधिक समय तक चल रहा है',
      description: 'Digital 25L Geyser has exceeded typical 25-minute bath pre-heat window. Water temperature is maintained on continuous thermal recovery draw.',
      description_hi: 'डिजिटल 25L गीज़र सामान्य समय से अधिक समय से चालू है और लगातार थर्मल लॉस की भरपाई कर रहा है।',
      whyItMatters: 'Geysers draw 2,000 Watts continuously. Forgetting it ON for an extra hour wastes 2.0 units (₹16/day).',
      estimatedImpact: 'Saves ₹16 / day (₹480/mo)',
      actionLabel: 'Optimize Now (Auto Cutoff)',
      actionPayload: { action: 'update_appliance', id: 'geyser', updates: { is_on: 0, daily_hours: 0.5 } }
    });
  }

  // 3. Standby Devices Count
  const standbyApps = appliances.filter(a => a.vampire_active === 1);
  if (standbyApps.length > 0) {
    insights.push({
      id: 'ins-standby-devices',
      type: 'vampire_load',
      severity: 'medium',
      title: `${standbyApps.length} devices are consuming standby vampire power`,
      title_hi: `${standbyApps.length} उपकरण लगातार फैंटम स्टैंडबाय बिजली की खपत कर रहे हैं`,
      description: `Idle appliances (${standbyApps.map(a => a.name.split(' ')[0]).join(', ')}) draw ~${telemetry.standbyVampireWatts}W 24/7 even when switched off via remote control.`,
      description_hi: `निष्क्रिय उपकरण (${standbyApps.map(a => a.name_hi.split(' ')[0]).join(', ')}) रिमोट से बंद होने के बाद भी 24/7 लगभग ${telemetry.standbyVampireWatts}W बिजली खींचते हैं।`,
      whyItMatters: 'Phantom loads run continuously 720 hours a month, adding 18–25 unnecessary units to higher billing slabs.',
      estimatedImpact: 'Saves ₹180–₹240 / month',
      actionLabel: 'Optimize Now (Kill Standby)',
      actionPayload: { action: 'fix_vampire_all' }
    });
  }

  // 4. Eco Mode Fleet Saving Opportunity
  insights.push({
    id: 'ins-fleet-eco-mode',
    type: 'smart_saving',
    severity: 'info',
    title: 'Switching connected devices to Smart Saving Mode saves ~₹28 today',
    title_hi: 'उपकरणों को स्मार्ट सेविंग मोड पर बदलने से आज लगभग ₹28 की बचत होगी',
    description: 'Enabling system-wide Smart Saving Mode synchronizes AC to 24°C, cuts phantom vampire sockets, and dims non-essential lighting.',
    description_hi: 'स्मार्ट सेविंग मोड सक्रिय करने से एसी 24°C पर आएगा, स्टैंडबाय सॉकेट बंद होंगे और लाइटें अनुकूलित होंगी।',
    whyItMatters: 'Automated coordination prevents household demand from crossing peak 3.5 kW slab boundaries.',
    estimatedImpact: 'Saves ~₹28 today (~₹840/mo)',
    actionLabel: 'Engage Smart Saving Mode',
    actionPayload: { action: 'toggle_smart_saving', enabled: true }
  });

  return insights;
}

/**
 * What-If Lab habit change simulation calculator
 */
export function calculateWhatIfSimulation({
  acTemp = 22,
  acHours = 6.5,
  geyserMinutes = 45,
  fanHours = 14,
  bldcFanUpgrade = false,
  lightingHours = 6,
  washerLoadsPerWeek = 4,
  peakHourShiftPct = 25,
  currentTariff = 8.0
}) {
  // Baseline monthly calculation
  const baseAcKwhDaily = (1450 * 1.12 * 6.5) / 1000;
  const baseGeyserKwhDaily = (2000 * (45 / 60)) / 1000;
  const baseFanKwhDaily = (225 * 14) / 1000;
  const baseLightKwhDaily = (110 * 6) / 1000;
  const baseWasherKwhDaily = (650 * 1.2 * (4 / 7)) / 1000;
  const baseOtherKwhDaily = 4.2;

  const baseTotalDailyKwh = baseAcKwhDaily + baseGeyserKwhDaily + baseFanKwhDaily + baseLightKwhDaily + baseWasherKwhDaily + baseOtherKwhDaily;
  const baseMonthlyKwh = baseTotalDailyKwh * 30;
  const baseMonthlyCost = calculateSlabCost(baseMonthlyKwh);

  // Optimized scenario
  const acTempDelta = Math.max(0, acTemp - 22);
  const acPowerFactor = Math.max(0.65, 1.12 - (acTempDelta * 0.06));
  const optAcKwhDaily = (1450 * acPowerFactor * acHours) / 1000;
  const optGeyserKwhDaily = (2000 * (geyserMinutes / 60)) / 1000;
  const fanWattage = bldcFanUpgrade ? 84 : 225;
  const optFanKwhDaily = (fanWattage * fanHours) / 1000;
  const optLightKwhDaily = (110 * lightingHours) / 1000;
  const optWasherKwhDaily = (650 * 1.2 * (washerLoadsPerWeek / 7)) / 1000;
  const optOtherKwhDaily = baseOtherKwhDaily * 0.88;

  const optTotalDailyKwh = optAcKwhDaily + optGeyserKwhDaily + optFanKwhDaily + optLightKwhDaily + optWasherKwhDaily + optOtherKwhDaily;
  const optMonthlyKwh = optTotalDailyKwh * 30;

  const peakSavingsFactor = 1 - (peakHourShiftPct * 0.002);
  const optMonthlyCost = calculateSlabCost(optMonthlyKwh) * peakSavingsFactor;

  const monthlySavings = Math.max(0, Math.round(baseMonthlyCost - optMonthlyCost));
  const kwhSavedMonthly = Math.max(0, Math.round(baseMonthlyKwh - optMonthlyKwh));
  const co2AvoidedKg = Math.round(kwhSavedMonthly * CO2_PER_KWH);
  const treesEquivalent = Math.round((co2AvoidedKg / CO2_PER_TREE_MONTH) * 10) / 10;

  return {
    current: {
      monthlyKwh: Math.round(baseMonthlyKwh),
      monthlyCost: Math.round(baseMonthlyCost),
      dailyKwh: Math.round(baseTotalDailyKwh * 10) / 10
    },
    optimized: {
      monthlyKwh: Math.round(optMonthlyKwh),
      monthlyCost: Math.round(optMonthlyCost),
      dailyKwh: Math.round(optTotalDailyKwh * 10) / 10
    },
    savings: {
      monthlyRupees: monthlySavings,
      kwhSavedMonthly,
      percentReduction: Math.round(((baseMonthlyCost - optMonthlyCost) / baseMonthlyCost) * 100),
      co2AvoidedKg,
      treesEquivalent
    }
  };
}
