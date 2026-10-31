// WattWise AI — API client functions
// All fetch-based, hitting /api endpoints with graceful error handling

import type {
  Appliance, Dashboard, Leak, Insight, Rule, Goal,
  BillForecast, CarbonImpact, WhatIfParams, WhatIfResult, Settings
} from './types';

const BASE = '/api';

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
export const fetchDashboard = () =>
  request<Dashboard>('/dashboard');

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
export const fetchBillForecast = () =>
  request<BillForecast>('/bill-forecast');

// Carbon Impact
export const fetchCarbonImpact = () =>
  request<CarbonImpact>('/carbon-impact');

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
export const startDemo = () =>
  request<{ message: string }>('/demo/start', { method: 'POST' });

// Reset
export const resetAll = () =>
  request<{ message: string }>('/demo/reset', { method: 'POST' });
