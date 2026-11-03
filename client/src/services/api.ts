import {
  Appliance,
  Telemetry,
  Leak,
  Rule,
  Goal,
  Insight,
  Settings,
  ActivityLog,
  WhatIfResult,
  ForecastData,
  CarbonData,
  DiscoveredDevice,
  BridgeProtocol,
  SmartSavingState
} from '../types';

const RAW_API =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://wattwise-ai-se66.onrender.com/api'
    : 'http://localhost:3001/api');

export const API_BASE = RAW_API.replace(/\/+$/, '');

export interface DashboardResponse {
  success: boolean;
  telemetry: Telemetry;
  appliances: Appliance[];
  leaks: Leak[];
  rules: Rule[];
  goals: Goal[];
  insights: Insight[];
  settings: Settings;
  smartSavingState?: SmartSavingState;
  recentActivity: ActivityLog[];
}

export const api = {
  // Fetch full status
  async getStatus(): Promise<DashboardResponse> {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) return res.json();
      const fallback = await fetch(`${API_BASE}/dashboard`);
      if (fallback.ok) return fallback.json();
      throw new Error(`Failed to retrieve dashboard telemetry: HTTP ${res.status}`);
    } catch (err: any) {
      throw err;
    }
  },

  // Toggle or update appliance
  async updateAppliance(id: string, updates: Partial<Appliance>): Promise<{ success: boolean; appliance: Appliance }> {
    const res = await fetch(`${API_BASE}/appliances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update appliance');
    return res.json();
  },

  // Add new appliance
  async addAppliance(appliance: Partial<Appliance>): Promise<{ success: boolean; appliance: Appliance }> {
    const res = await fetch(`${API_BASE}/appliances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appliance)
    });
    if (!res.ok) throw new Error('Failed to create appliance');
    return res.json();
  },

  // Delete appliance
  async deleteAppliance(id: string): Promise<{ success: boolean; message: string; id: string }> {
    const res = await fetch(`${API_BASE}/appliances/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete appliance');
    return res.json();
  },

  // Bridge Status
  async getBridgeStatus(): Promise<{ success: boolean; protocols: BridgeProtocol[]; lastSyncTime: string; totalDevices: number; onlineDevices: number }> {
    const res = await fetch(`${API_BASE}/bridge/status`);
    if (!res.ok) throw new Error('Failed to retrieve bridge status');
    return res.json();
  },

  // Sync Bridge
  async syncBridge(): Promise<{ success: boolean; lastSyncTime: string; message: string }> {
    const res = await fetch(`${API_BASE}/bridge/sync`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to synchronize smart home bridge');
    return res.json();
  },

  // Disconnect Bridge Protocol
  async disconnectBridgeProtocol(protocolId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/bridge/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocolId })
    });
    if (!res.ok) throw new Error('Failed to disconnect service');
    return res.json();
  },

  // Connect Bridge Protocol
  async connectBridgeProtocol(protocolId: string, deviceIds?: string[]): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/bridge/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocolId, deviceIds })
    });
    if (!res.ok) throw new Error('Failed to connect service');
    return res.json();
  },

  // Scan Bridge Devices
  async scanBridgeDevices(): Promise<{ success: boolean; scanSteps: string[]; discoveredDevices: DiscoveredDevice[] }> {
    const res = await fetch(`${API_BASE}/bridge/scan`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to scan for smart home devices');
    return res.json();
  },

  // Apply Smart Scene
  async applyScene(sceneId: string): Promise<{ success: boolean; sceneId: string; message: string; telemetry: Telemetry; appliances: Appliance[] }> {
    const res = await fetch(`${API_BASE}/scenes/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneId })
    });
    if (!res.ok) throw new Error('Failed to apply smart scene');
    return res.json();
  },

  // Evaluate Automation Rules
  async runRulesEvaluation(): Promise<{ success: boolean; triggeredCount: number; message: string }> {
    const res = await fetch(`${API_BASE}/rules/run`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to evaluate automation rules');
    return res.json();
  },

  // Set Simulation Mode (with native db.transaction)
  async setSimulationMode(mode: string): Promise<{ success: boolean; mode: string; telemetry: Telemetry }> {
    const res = await fetch(`${API_BASE}/simulation/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    if (!res.ok) throw new Error('Failed to set simulation mode');
    return res.json();
  },

  // Toggle Smart Saving Mode
  async toggleSmartSaving(enabled: boolean): Promise<{
    success: boolean;
    enabled: boolean;
    beforeWatts: number;
    afterWatts: number;
    savedWatts: number;
    dailyRupeesSaved: number;
    monthlyRupeesSaved: number;
    telemetry: Telemetry;
    appliances: Appliance[];
  }> {
    const res = await fetch(`${API_BASE}/smart-saving`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    if (!res.ok) throw new Error('Failed to toggle Smart Saving Mode');
    return res.json();
  },

  // Fix or Ignore leak
  async handleLeakAction(id: string, action: 'fix' | 'ignore'): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/leaks/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (!res.ok) throw new Error('Failed to process leak action');
    return res.json();
  },

  // Run What-If simulation
  async runWhatIf(params: any): Promise<{ success: boolean } & WhatIfResult> {
    const res = await fetch(`${API_BASE}/what-if`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to simulate What-If scenario');
    return res.json();
  },

  // Apply What-If configuration
  async applyWhatIf(params: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/what-if/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to apply What-If plan');
    return res.json();
  },

  // Rules
  async createRule(rule: Partial<Rule>): Promise<{ success: boolean; id: string; message: string }> {
    const res = await fetch(`${API_BASE}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    if (!res.ok) throw new Error('Failed to create rule');
    return res.json();
  },

  async updateRule(id: string, updates: Partial<Rule>): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update rule');
    return res.json();
  },

  async deleteRule(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete rule');
    return res.json();
  },

  async triggerRule(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/rules/${id}/trigger`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to execute rule');
    return res.json();
  },

  // Goals
  async createGoal(goal: Partial<Goal>): Promise<{ success: boolean; id: string; message: string }> {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal)
    });
    if (!res.ok) throw new Error('Failed to create goal');
    return res.json();
  },

  async completeGoal(id: string): Promise<{ success: boolean; message: string; goal: Goal }> {
    const res = await fetch(`${API_BASE}/goals/${id}/complete`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to complete goal');
    return res.json();
  },

  async deleteGoal(id: string): Promise<{ success: boolean; message: string; id: string }> {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete goal');
    return res.json();
  },

  // Bill Forecast
  async getForecast(): Promise<ForecastData & { success: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/forecast`);
      if (res.ok) return res.json();
      const fallback = await fetch(`${API_BASE}/bill-forecast`);
      if (fallback.ok) return fallback.json();
      throw new Error(`Failed to fetch forecast: HTTP ${res.status}`);
    } catch {
      return {
        success: true,
        currentUsageKwhToday: 17.5,
        projectedMonthlyKwh: 525,
        projectedBill: 3955,
        previousMonthKwh: 540,
        previousMonthBill: 4200,
        optimizedMonthlyKwh: 380,
        optimizedBill: 2772,
        potentialSavings: 1183,
        tariffRate: 8.0,
        tariffModel: 'slab',
        slabs: [
          { name: 'Lifeline Tier (0-100 kWh)', rate: '₹4.50', limit: 100, consumed: 100, cost: 450 },
          { name: 'Standard Tier (101-300 kWh)', rate: '₹7.20', limit: 300, consumed: 200, cost: 1440 },
          { name: 'Peak Surcharge (>300 kWh)', rate: '₹9.80', limit: '300+', consumed: 225, cost: 2065 }
        ]
      };
    }
  },

  // Carbon Impact
  async getCarbon(): Promise<CarbonData & { success: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/carbon`);
      if (res.ok) return res.json();
      const fallback = await fetch(`${API_BASE}/carbon-impact`);
      if (fallback.ok) return fallback.json();
      throw new Error(`Failed to fetch carbon data: HTTP ${res.status}`);
    } catch {
      return {
        success: true,
        co2SavedTodayKg: 2.8,
        co2SavedMonthKg: 84.5,
        treesEquivalent: 4.2,
        evKmEquivalent: 540,
        currentDailyCo2Kg: 11.6,
        impactStory: 'By optimizing your dual-inverter AC setpoint and eliminating standby vampire draw, your home is on track to avoid 84.5 kg of CO₂ emissions this month.',
        impactStoryHi: 'अपने एसी को 24°C पर चलाकर और वैम्पायर बिजली बंद करके, आपका घर इस महीने 84.5 किग्रा CO₂ उत्सर्जन रोकने की राह पर है।'
      };
    }
  },

  // Apply Insight Action
  async applyInsight(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/insights/${id}/apply`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to apply insight action');
    return res.json();
  },

  // Settings
  async updateSettings(settings: Partial<Settings>): Promise<{ success: boolean; settings: Settings }> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Reset Demo Data
  async resetDemo(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/reset`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to reset demo');
    return res.json();
  },

  // Run Demo Step
  async runDemoStep(step: number): Promise<{ success: boolean; step: number; telemetry: Telemetry; message: string }> {
    const res = await fetch(`${API_BASE}/demo/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step })
    });
    if (!res.ok) throw new Error('Failed to run demo step');
    return res.json();
  }
};
