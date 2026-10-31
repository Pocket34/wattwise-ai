// Smart Home Integrations API Client
// Handles communications with backend /api/integrations endpoints

import { ProviderInfo, CommonDevice, IntegrationMode } from '../types';

const API_BASE = '/api/integrations';

export const integrationsApi = {
  /**
   * Fetches overall system integration status and all providers
   */
  async getStatus(): Promise<{
    success: boolean;
    mode: IntegrationMode;
    hasLiveConnected: boolean;
    providers: ProviderInfo[];
    lastSyncTime: string;
  }> {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error('Failed to fetch integration status');
    return res.json();
  },

  /**
   * Sets system mode (DEMO vs LIVE)
   */
  async setMode(mode: IntegrationMode): Promise<{
    success: boolean;
    mode: IntegrationMode;
    message: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    return res.json();
  },

  /**
   * Starts Google OAuth flow by fetching the secure authorization URL
   */
  async startGoogleOAuth(): Promise<{
    success: boolean;
    configured: boolean;
    authorizationUrl?: string;
    message?: string;
    instructions?: string;
    fallback?: string;
  }> {
    const res = await fetch(`${API_BASE}/google/start`);
    return res.json();
  },

  /**
   * Disconnects Google Home and revokes tokens
   */
  async disconnectGoogle(): Promise<{
    success: boolean;
    status: string;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/google/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  /**
   * Gets detailed Google Home status
   */
  async getGoogleStatus(): Promise<ProviderInfo> {
    const res = await fetch(`${API_BASE}/google/status`);
    return res.json();
  },

  /**
   * Scans devices from selected provider ('demo', 'google_home', 'matter', 'device_api')
   */
  async scanDevices(providerId: string): Promise<{
    success: boolean;
    providerId: string;
    providerName: string;
    configured: boolean;
    message: string;
    devices: CommonDevice[];
  }> {
    const res = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId })
    });
    return res.json();
  },

  /**
   * Adds discovered devices to the WattWise home network
   */
  async addDevices(devices: CommonDevice[]): Promise<{
    success: boolean;
    addedCount: number;
    message: string;
    appliances: any[];
  }> {
    const res = await fetch(`${API_BASE}/devices/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devices })
    });
    return res.json();
  },

  /**
   * Controls a device via its provider
   */
  async controlDevice(
    id: string,
    action: 'power' | 'temperature' | 'brightness' | 'fan_speed',
    value: any
  ): Promise<{
    success: boolean;
    device: CommonDevice;
    telemetry: any;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/devices/${id}/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, value })
    });
    return res.json();
  },

  /**
   * Commissions a Matter device using pairing code
   */
  async commissionMatter(pairingCode: string): Promise<{
    success: boolean;
    paired?: boolean;
    message?: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/matter/commission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairingCode })
    });
    return res.json();
  },

  /**
   * Tests Smart Device API Gateway connection
   */
  async testDeviceApi(): Promise<{
    success: boolean;
    connected?: boolean;
    message?: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/api-device/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  }
};
