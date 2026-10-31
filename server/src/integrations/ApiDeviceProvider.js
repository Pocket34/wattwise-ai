// Generic Cloud / REST / MQTT Smart Device API Provider
// Connects to external device gateways via REST endpoints with API key authentication

import { SmartHomeProvider } from './SmartHomeProvider.js';
import { normalizeDevice, DeviceSource, DeviceType } from './CommonDevice.js';
import { getDb } from '../db/database.js';

export class ApiDeviceProvider extends SmartHomeProvider {
  constructor() {
    super('device_api', 'Smart Device API Provider', DeviceSource.DEVICE_API);
  }

  isConfigured() {
    return Boolean(
      process.env.SMART_DEVICE_API_URL &&
      process.env.SMART_DEVICE_API_KEY &&
      process.env.SMART_DEVICE_API_KEY !== 'your_api_key_here'
    );
  }

  getApiUrl() {
    return process.env.SMART_DEVICE_API_URL || '';
  }

  getApiKey() {
    return process.env.SMART_DEVICE_API_KEY || '';
  }

  async getStatus() {
    const configured = this.isConfigured();
    const db = getDb();
    const statusRow = db.prepare("SELECT value FROM settings WHERE key = 'device_api_status'").get();
    const isConnected = configured && statusRow?.value === 'connected';

    let status = 'not_configured';
    let message = 'Smart Device API integration requires SMART_DEVICE_API_URL and SMART_DEVICE_API_KEY in environment.';

    if (configured && isConnected) {
      status = 'connected';
      message = 'Connected to Smart Device API Gateway.';
    } else if (configured) {
      status = 'ready';
      message = 'API credentials detected. Ready to fetch device fleet.';
    }

    const connectedDevices = (await this.getDevices()).length;

    return {
      id: this.id,
      name: this.name,
      status, // 'not_configured' | 'ready' | 'connected'
      label: 'Smart Device Cloud API',
      configured,
      requiresCredentials: true,
      connected: isConnected,
      connectedDevicesCount: connectedDevices,
      message,
      apiUrl: configured ? this.getApiUrl() : 'Not configured',
      lastSyncTime: isConnected ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      supportedCapabilities: ['power', 'switch', 'temperature', 'brightness', 'fanSpeed', 'energyMonitoring']
    };
  }

  async testConnection() {
    if (!this.isConfigured()) {
      return {
        success: false,
        connected: false,
        error: 'API Gateway URL or Key not configured in environment.'
      };
    }

    try {
      const response = await fetch(`${this.getApiUrl()}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) {
        throw new Error(`Device API returned status ${response.status}`);
      }

      const db = getDb();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('device_api_status', 'connected')").run();

      return {
        success: true,
        connected: true,
        message: 'Successfully reached Smart Device API Gateway'
      };
    } catch (err) {
      return {
        success: false,
        connected: false,
        error: `Could not reach Smart Device API: ${err.message}`
      };
    }
  }

  async getDevices() {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM appliances WHERE connection_type = 'cloud' OR connection_type = 'device_api'").all();
    return rows.map(r => normalizeDevice({ ...r, source: DeviceSource.DEVICE_API }));
  }

  async getDeviceState(deviceId) {
    const devices = await this.getDevices();
    const found = devices.find(d => d.id === deviceId);
    if (!found) throw new Error(`Cloud API device ${deviceId} not found`);
    return found;
  }

  async getEnergyTelemetry(deviceId) {
    const device = await this.getDeviceState(deviceId);
    return {
      deviceId,
      powerWatts: device.state.isOn ? device.powerWatts : 0,
      voltage: 230,
      current: Number(((device.state.isOn ? device.powerWatts : 0) / 230).toFixed(2)),
      timestamp: new Date().toISOString(),
      source: DeviceSource.DEVICE_API
    };
  }

  async setPower(deviceId, isOn) {
    if (this.isConfigured()) {
      try {
        await fetch(`${this.getApiUrl()}/devices/${deviceId}/control`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getApiKey()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ power: isOn }),
          signal: AbortSignal.timeout(3000)
        });
      } catch (e) {
        console.warn(`[ApiDeviceProvider] Failed to push to remote API: ${e.message}`);
      }
    }

    const db = getDb();
    db.prepare("UPDATE appliances SET is_on = ?, updated_at = datetime('now') WHERE id = ?").run(isOn ? 1 : 0, deviceId);
    return true;
  }

  async setTemperature(deviceId, temp) {
    const db = getDb();
    db.prepare("UPDATE appliances SET temp_setpoint = ?, updated_at = datetime('now') WHERE id = ?").run(temp, deviceId);
    return true;
  }

  async setBrightness(deviceId, brightness) {
    const db = getDb();
    db.prepare("UPDATE appliances SET brightness = ?, updated_at = datetime('now') WHERE id = ?").run(brightness, deviceId);
    return true;
  }

  async setFanSpeed(deviceId, speed) {
    const db = getDb();
    db.prepare("UPDATE appliances SET device_speed = ?, updated_at = datetime('now') WHERE id = ?").run(speed, deviceId);
    return true;
  }

  async scanDevices() {
    const status = await this.getStatus();
    if (!status.configured) {
      return {
        success: false,
        configured: false,
        message: 'Smart Device API is not configured. Provide SMART_DEVICE_API_URL in environment.',
        devices: []
      };
    }

    return {
      success: true,
      configured: true,
      devices: await this.getDevices()
    };
  }
}
