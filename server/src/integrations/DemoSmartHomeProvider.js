// Demo Smart Home Provider
// Deterministic simulated appliances & telemetry with persistent database state

import { SmartHomeProvider } from './SmartHomeProvider.js';
import { normalizeDevice, DeviceSource, DeviceType } from './CommonDevice.js';
import { getDb } from '../db/database.js';

export class DemoSmartHomeProvider extends SmartHomeProvider {
  constructor() {
    super('demo', 'Demo Smart Home Provider', DeviceSource.DEMO);
  }

  async getStatus() {
    return {
      id: this.id,
      name: this.name,
      status: 'demo',
      label: 'Local Telemetry Simulation',
      configured: true,
      requiresCredentials: false,
      connectedDevicesCount: (await this.getDevices()).length,
      supportedCapabilities: ['power', 'switch', 'temperature', 'brightness', 'fanSpeed', 'energyMonitoring'],
      lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  async getDevices() {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM appliances 
      WHERE connection_type = 'demo' OR connection_type IS NULL OR is_connected = 1
      ORDER BY power_watts DESC
    `).all();

    return rows.map(r => normalizeDevice({ ...r, source: DeviceSource.DEMO }));
  }

  async getDeviceState(deviceId) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM appliances WHERE id = ?').get(deviceId);
    if (!row) throw new Error(`Demo device ${deviceId} not found`);
    return normalizeDevice({ ...row, source: DeviceSource.DEMO });
  }

  async getEnergyTelemetry(deviceId) {
    const device = await this.getDeviceState(deviceId);
    const powerWatts = device.state.isOn ? device.powerWatts : (device.state.vampireActive ? device.state.standbyWatts : 0);
    return {
      deviceId,
      powerWatts,
      voltage: 230,
      current: Number((powerWatts / 230).toFixed(2)),
      timestamp: new Date().toISOString(),
      source: DeviceSource.DEMO
    };
  }

  async setPower(deviceId, isOn) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM appliances WHERE id = ?').get(deviceId);
    if (!existing) return false;

    db.prepare(`
      UPDATE appliances SET 
        is_on = ?, 
        updated_at = datetime('now') 
      WHERE id = ?
    `).run(isOn ? 1 : 0, deviceId);

    return true;
  }

  async setTemperature(deviceId, temp) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM appliances WHERE id = ?').get(deviceId);
    if (!existing) return false;

    // Deterministic power recalculation for AC
    const targetTemp = Math.max(16, Math.min(30, Number(temp)));
    const tempDelta = 24.0 - targetTemp;
    const factor = Math.max(0.7, 1 + (tempDelta * 0.06));
    const powerWatts = Math.round(1450 * factor);

    db.prepare(`
      UPDATE appliances SET 
        temp_setpoint = ?, 
        power_watts = ?,
        updated_at = datetime('now') 
      WHERE id = ?
    `).run(targetTemp, powerWatts, deviceId);

    return true;
  }

  async setBrightness(deviceId, brightness) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM appliances WHERE id = ?').get(deviceId);
    if (!existing) return false;

    const b = Math.max(10, Math.min(100, parseInt(brightness, 10)));
    const powerWatts = Math.round(existing.baseline_watts * (b / 100));

    db.prepare(`
      UPDATE appliances SET 
        brightness = ?, 
        power_watts = ?,
        updated_at = datetime('now') 
      WHERE id = ?
    `).run(b, powerWatts, deviceId);

    return true;
  }

  async setFanSpeed(deviceId, speed) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM appliances WHERE id = ?').get(deviceId);
    if (!existing) return false;

    const s = Math.max(1, Math.min(5, parseInt(speed, 10)));
    const speedFactors = { 1: 0.35, 2: 0.55, 3: 0.75, 4: 0.90, 5: 1.0 };
    const powerWatts = Math.round(existing.baseline_watts * (speedFactors[s] || 0.75));

    db.prepare(`
      UPDATE appliances SET 
        device_speed = ?, 
        power_watts = ?,
        updated_at = datetime('now') 
      WHERE id = ?
    `).run(s, powerWatts, deviceId);

    return true;
  }

  async scanDevices() {
    // Return realistic discovered demo appliances ready to be added to WattWise
    return [
      normalizeDevice({
        id: 'tv',
        name: 'Living Room Smart TV',
        name_hi: 'लिविंग रूम स्मार्ट टीवी',
        room: 'Living Room',
        type: DeviceType.TV,
        power_watts: 145,
        baseline_watts: 160,
        is_on: 1,
        source: DeviceSource.DEMO,
        online: true
      }),
      normalizeDevice({
        id: 'ac',
        name: 'Bedroom Smart AC',
        name_hi: 'बेडरूम स्मार्ट एसी',
        room: 'Master Bedroom',
        type: DeviceType.AC,
        power_watts: 1220,
        baseline_watts: 1450,
        temp_setpoint: 24.0,
        is_on: 1,
        source: DeviceSource.DEMO,
        online: true
      }),
      normalizeDevice({
        id: 'fridge',
        name: 'Kitchen Smart Refrigerator',
        name_hi: 'किचन स्मार्ट रेफ्रिजरेटर',
        room: 'Kitchen',
        type: DeviceType.REFRIGERATOR,
        power_watts: 180,
        baseline_watts: 180,
        is_on: 1,
        source: DeviceSource.DEMO,
        online: true
      }),
      normalizeDevice({
        id: 'fan',
        name: 'Bedroom BLDC Fan',
        name_hi: 'बेडरूम बीएलडीसी पंखा',
        room: 'Bedrooms',
        type: DeviceType.FAN,
        power_watts: 55,
        baseline_watts: 84,
        device_speed: 3,
        is_on: 1,
        source: DeviceSource.DEMO,
        online: true
      }),
      normalizeDevice({
        id: 'plug-kitchen',
        name: 'Kitchen Smart Plug',
        name_hi: 'किचन स्मार्ट प्लग',
        room: 'Kitchen',
        type: DeviceType.SMART_PLUG,
        power_watts: 12,
        baseline_watts: 12,
        is_on: 0,
        vampire_active: 1,
        standby_watts: 12,
        source: DeviceSource.DEMO,
        online: true
      }),
      normalizeDevice({
        id: 'lights',
        name: 'Living Room Smart Light',
        name_hi: 'लिविंग रूम स्मार्ट लाइट',
        room: 'Living Room',
        type: DeviceType.LIGHT,
        power_watts: 77,
        baseline_watts: 110,
        brightness: 70,
        is_on: 1,
        source: DeviceSource.DEMO,
        online: true
      })
    ];
  }
}
