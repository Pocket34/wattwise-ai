// Provider Registry for WattWise AI
// Coordinates active smart home providers and handles DEMO vs LIVE integration mode

import { DemoSmartHomeProvider } from './DemoSmartHomeProvider.js';
import { GoogleHomeProvider } from './GoogleHomeProvider.js';
import { MatterProvider } from './MatterProvider.js';
import { ApiDeviceProvider } from './ApiDeviceProvider.js';
import { DeviceSource } from './CommonDevice.js';
import { getDb } from '../db/database.js';

class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.providers.set(DeviceSource.DEMO, new DemoSmartHomeProvider());
    this.providers.set(DeviceSource.GOOGLE_HOME, new GoogleHomeProvider());
    this.providers.set(DeviceSource.MATTER, new MatterProvider());
    this.providers.set(DeviceSource.DEVICE_API, new ApiDeviceProvider());
  }

  getProvider(sourceOrId) {
    const key = String(sourceOrId).toLowerCase();
    if (this.providers.has(key)) {
      return this.providers.get(key);
    }
    if (key.includes('google')) return this.providers.get(DeviceSource.GOOGLE_HOME);
    if (key.includes('matter')) return this.providers.get(DeviceSource.MATTER);
    if (key.includes('api') || key.includes('cloud')) return this.providers.get(DeviceSource.DEVICE_API);
    return this.providers.get(DeviceSource.DEMO);
  }

  getAllProviders() {
    return Array.from(this.providers.values());
  }

  async getMode() {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'integration_mode'").get();
    return row?.value === 'LIVE' ? 'LIVE' : 'DEMO';
  }

  async setMode(mode) {
    const target = mode === 'LIVE' ? 'LIVE' : 'DEMO';
    const db = getDb();
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('integration_mode', ?)").run(target);
    return target;
  }

  async getSystemStatus() {
    const mode = await this.getMode();
    const providerStatuses = await Promise.all(
      Array.from(this.providers.values()).map(p => p.getStatus())
    );

    const hasLiveConnected = providerStatuses.some(
      p => p.id !== 'demo' && p.status === 'connected'
    );

    return {
      mode, // 'DEMO' | 'LIVE'
      hasLiveConnected,
      providers: providerStatuses,
      lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  /**
   * Returns active device fleet filtered strictly by active mode
   * DEMO MODE returns only demo devices (source='demo')
   * LIVE MODE returns only live authenticated devices (google_home, matter, device_api)
   */
  async getActiveDevices() {
    const mode = await this.getMode();
    if (mode === 'LIVE') {
      const googleDevices = await this.providers.get(DeviceSource.GOOGLE_HOME).getDevices();
      const matterDevices = await this.providers.get(DeviceSource.MATTER).getDevices();
      const apiDevices = await this.providers.get(DeviceSource.DEVICE_API).getDevices();
      return [...googleDevices, ...matterDevices, ...apiDevices];
    } else {
      return this.providers.get(DeviceSource.DEMO).getDevices();
    }
  }
}

export const providerRegistry = new ProviderRegistry();
