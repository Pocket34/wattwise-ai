// Normalized Telemetry Service for WattWise AI
// Ingests device telemetry across providers and produces standardized deterministic energy metrics

import { CO2_PER_KWH, calculateEffectiveTariff } from '../engine/intelligence.js';

export class TelemetryService {
  /**
   * Normalizes raw device telemetry points into standard telemetry shape
   */
  normalizePoint(raw) {
    const powerWatts = Math.max(0, Number(raw.powerWatts ?? raw.power_watts ?? 0));
    const voltage = Number(raw.voltage || 230);
    const current = raw.current !== undefined ? Number(raw.current) : Number((powerWatts / voltage).toFixed(2));
    const timestamp = raw.timestamp || new Date().toISOString();
    const state = raw.state || { isOn: Boolean(raw.is_on) };

    return {
      powerWatts,
      voltage,
      current,
      timestamp,
      state
    };
  }

  /**
   * Computes holistic normalized telemetry for a fleet of devices
   * @param {Array} devices Normalized CommonDevice items
   * @param {number} tariffRate Tariff rate in rupees per kWh (default 8.0)
   * @param {string} tariffModel Tariff calculation model ('slab' | 'flat')
   */
  computeFleetTelemetry(devices, tariffRate = 8.0, tariffModel = 'slab') {
    let currentPowerWatts = 0;
    let baselineWatts = 0;
    let standbyVampireWatts = 0;
    let activeDevicesCount = 0;
    let energyTodayKwh = 0;

    const roomContributions = {};
    const categoryContributions = {};
    const sourceContributions = {
      demo: 0,
      google_home: 0,
      matter: 0,
      device_api: 0
    };

    for (const dev of devices) {
      baselineWatts += (dev.baselineWatts || dev.powerWatts);
      const isOn = Boolean(dev.state?.isOn);
      const source = dev.source || 'demo';

      let activeWatts = 0;
      if (isOn) {
        activeDevicesCount++;
        activeWatts = dev.powerWatts;
        currentPowerWatts += activeWatts;
      } else if (dev.state?.vampireActive && dev.state?.standbyWatts > 0) {
        standbyVampireWatts += dev.state.standbyWatts;
        activeWatts = dev.state.standbyWatts;
        currentPowerWatts += activeWatts;
      }

      // Track by source
      if (sourceContributions[source] !== undefined) {
        sourceContributions[source] += activeWatts;
      }

      // Track by room
      const room = dev.room || 'General';
      roomContributions[room] = (roomContributions[room] || 0) + activeWatts;

      // Track by type
      const cat = dev.type || 'OTHER';
      categoryContributions[cat] = (categoryContributions[cat] || 0) + activeWatts;

      // Deterministic Daily Energy (kWh = kW * hours)
      // If energyTodayKwh is provided, accumulate; otherwise estimate from runtime
      const devKwh = dev.energyTodayKwh || (isOn ? (activeWatts * (dev.daily_hours || 4.5)) / 1000 : 0);
      energyTodayKwh += devKwh;
    }

    // Cost calculations
    const effectiveTariff = tariffModel === 'slab' 
      ? calculateEffectiveTariff(energyTodayKwh * 30, tariffRate, 'slab') 
      : tariffRate;

    const estimatedDailyCost = Math.round(energyTodayKwh * effectiveTariff * 100) / 100;
    const estimatedMonthlyCost = Math.round(estimatedDailyCost * 30);

    // Carbon emissions (BEE standard ~0.82 kg CO2 per kWh)
    const carbonKg = Math.round(energyTodayKwh * CO2_PER_KWH * 100) / 100;

    // Potential savings
    const potentialSavingsWatts = standbyVampireWatts + (currentPowerWatts > 2500 ? 450 : 150);
    const potentialDailySavingsKwh = (potentialSavingsWatts * 8) / 1000;
    const potentialDailySavingsCost = Math.round(potentialDailySavingsKwh * effectiveTariff * 100) / 100;

    return {
      currentPowerWatts,
      baselineWatts,
      standbyVampireWatts,
      activeDevicesCount,
      totalDevicesCount: devices.length,
      energyTodayKwh: Math.round(energyTodayKwh * 100) / 100,
      estimatedDailyCost,
      estimatedMonthlyCost,
      carbonKg,
      effectiveTariff: Math.round(effectiveTariff * 100) / 100,
      potentialDailySavingsCost,
      potentialMonthlySavingsCost: potentialDailySavingsCost * 30,
      roomContributions: Object.entries(roomContributions).map(([room, watts]) => ({ room, watts })),
      categoryContributions: Object.entries(categoryContributions).map(([category, watts]) => ({ category, watts })),
      sourceContributions
    };
  }
}

export const telemetryService = new TelemetryService();
