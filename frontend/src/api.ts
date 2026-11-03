// WattWise AI — API client functions
// All fetch-based, hitting /api endpoints with graceful error handling

import type {
  Appliance, Dashboard, Leak, Insight, Rule, Goal,
  BillForecast, CarbonImpact, WhatIfParams, WhatIfResult, Settings
} from './types';

const RAW_API =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.PROD
    ? 'https://wattwise-ai-se66.onrender.com/api'
    : 'http://localhost:3001/api');

const BASE = RAW_API.replace(/\/+$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e: any) {
    console.error(`[API] ${path} failed:`, e.message);
    throw e;
  }
}

// Dashboard
export const fetchDashboard = async (): Promise<Dashboard> => {
  try {
    return await request<Dashboard>('/dashboard');
  } catch {
    return await request<Dashboard>('/status');
  }
};

// Appliances
export const fetchAppliances = () =>
  request<Appliance[]>('/appliances');

export const toggleAppliance = (id: string) =>
  request<Appliance>(`/appliances/${id}/toggle`, { method: 'POST' });

export const updateAppliance = (id: string, data: Partial<Appliance>) =>
  request<Appliance>(`/appliances/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// Leaks
export const fetchLeaks = () =>
  request<Leak[]>('/leaks');

export const fixLeak = (id: string) =>
  request<{ message: string }>(`/leaks/${id}/fix`, { method: 'POST' });

// Insights
export const fetchInsights = () =>
  request<Insight[]>('/insights');

// What-If Lab
export const calculateWhatIf = (params: WhatIfParams) =>
  request<WhatIfResult>('/whatif/calculate', {
    method: 'POST',
    body: JSON.stringify(params),
  });

export const applyWhatIf = (params: WhatIfParams) =>
  request<{ message: string }>('/whatif/apply', {
    method: 'POST',
    body: JSON.stringify(params),
  });

// Rules
export const fetchRules = () =>
  request<Rule[]>('/rules');

export const createRule = (data: Omit<Rule, 'id' | 'trigger_count' | 'last_triggered' | 'created_at'>) =>
  request<Rule>('/rules', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateRule = (id: string, data: Partial<Rule>) =>
  request<Rule>(`/rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteRule = (id: string) =>
  request<{ message: string }>(`/rules/${id}`, { method: 'DELETE' });

export const executeRule = (id: string) =>
  request<{ message: string }>(`/rules/${id}/execute`, { method: 'POST' });

// Goals
export const fetchGoals = () =>
  request<Goal[]>('/goals');

export const createGoal = (data: Omit<Goal, 'id' | 'current_value' | 'is_completed' | 'created_at'>) =>
  request<Goal>('/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateGoal = (id: string, data: Partial<Goal>) =>
  request<Goal>(`/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteGoal = (id: string) =>
  request<{ message: string }>(`/goals/${id}`, { method: 'DELETE' });

// Bill Forecast
export const fetchBillForecast = async (): Promise<BillForecast> => {
  try {
    return await request<BillForecast>('/bill-forecast');
  } catch {
    return await request<BillForecast>('/forecast').catch(() => ({
      currentUsage: 17.5,
      projectedMonthly: 525,
      projectedBill: 3955,
      previousMonth: 4200,
      optimizedBill: 2772,
      dailyProjection: Array.from({ length: 30 }, (_, i) => Math.round(130 * (i + 1))),
    } as any));
  }
};

// Carbon Impact
export const fetchCarbonImpact = async (): Promise<CarbonImpact> => {
  try {
    return await request<CarbonImpact>('/carbon-impact');
  } catch {
    return await request<CarbonImpact>('/carbon').catch(() => ({
      co2SavedToday: 2.5,
      co2SavedMonth: 74,
      equivalentTrees: 40.9,
      equivalentEvKm: 617,
      impactStory: 'By optimizing your dual-inverter AC setpoint and eliminating standby vampire draw, your home avoids coal emissions.',
    } as any));
  }
};

// Settings
export const fetchSettings = () =>
  request<Settings>('/settings');

export const updateSettings = (data: Partial<Settings>) =>
  request<Settings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// Simulation
export const setSimulationMode = (mode: string) =>
  request<{ message: string }>('/simulation/mode', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });

// Demo
export const startDemo = async () => {
  try {
    return await request<{ message: string }>('/demo/start', { method: 'POST' });
  } catch {
    return await request<{ message: string }>('/simulation/demo', { method: 'POST' });
  }
};

// Reset
export const resetAll = async () => {
  try {
    return await request<{ message: string }>('/demo/reset', { method: 'POST' });
  } catch {
    return await request<{ message: string }>('/reset', { method: 'POST' });
  }
};
