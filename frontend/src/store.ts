// WattWise AI — Zustand global store
// Central state management for all data, loading states, and actions

import { create } from 'zustand';
import type {
  Appliance, Dashboard, Leak, Insight, Rule, Goal,
  BillForecast, CarbonImpact, WhatIfParams, WhatIfResult, Settings
} from './types';
import * as api from './api';
import { setSoundEnabled as setSoundEnabledAudio } from './sound';

interface AppState {
  // Data
  dashboard: Dashboard | null;
  appliances: Appliance[];
  leaks: Leak[];
  insights: Insight[];
  rules: Rule[];
  goals: Goal[];
  billForecast: BillForecast | null;
  carbonImpact: CarbonImpact | null;
  settings: Settings | null;
  whatIfResult: WhatIfResult | null;

  // Loading states
  loadingDashboard: boolean;
  loadingAppliances: boolean;
  loadingLeaks: boolean;
  loadingInsights: boolean;
  loadingRules: boolean;
  loadingGoals: boolean;
  loadingBillForecast: boolean;
  loadingCarbonImpact: boolean;
  loadingSettings: boolean;
  loadingWhatIf: boolean;

  // UI state
  hasSeenWelcome: boolean;
  isDemoRunning: boolean;
  demoStep: number;
  sidebarOpen: boolean;
  notification: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;

  // Actions — data fetching
  fetchDashboard: () => Promise<void>;
  fetchAppliances: () => Promise<void>;
  fetchLeaks: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  fetchRules: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchBillForecast: () => Promise<void>;
  fetchCarbonImpact: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Actions — mutations
  toggleAppliance: (id: string) => Promise<void>;
  updateAppliance: (id: string, data: Partial<Appliance>) => Promise<void>;
  fixLeak: (id: string) => Promise<void>;
  calculateWhatIf: (params: WhatIfParams) => Promise<void>;
  applyWhatIf: (params: WhatIfParams) => Promise<void>;
  createRule: (data: Omit<Rule, 'id' | 'trigger_count' | 'last_triggered' | 'created_at'>) => Promise<void>;
  updateRule: (id: string, data: Partial<Rule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  executeRule: (id: string) => Promise<void>;
  createGoal: (data: Omit<Goal, 'id' | 'current_value' | 'is_completed' | 'created_at'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
  setSimulationMode: (mode: string) => Promise<void>;

  // Actions — UI
  setHasSeenWelcome: (val: boolean) => void;
  setSidebarOpen: (val: boolean) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  clearNotification: () => void;
  runDemo: (navigate: (path: string) => void) => Promise<void>;
  resetAll: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  dashboard: null,
  appliances: [],
  leaks: [],
  insights: [],
  rules: [],
  goals: [],
  billForecast: null,
  carbonImpact: null,
  settings: null,
  whatIfResult: null,

  loadingDashboard: false,
  loadingAppliances: false,
  loadingLeaks: false,
  loadingInsights: false,
  loadingRules: false,
  loadingGoals: false,
  loadingBillForecast: false,
  loadingCarbonImpact: false,
  loadingSettings: false,
  loadingWhatIf: false,

  hasSeenWelcome: localStorage.getItem('ww-welcome-seen') === 'true',
  isDemoRunning: false,
  demoStep: 0,
  sidebarOpen: false,
  notification: null,

  // --- Fetch actions ---
  fetchDashboard: async () => {
    set({ loadingDashboard: true });
    try {
      const res: any = await api.fetchDashboard();
      const d = res.data || res;
      const dashboard: Dashboard = {
        currentPower: d.currentPower ?? d.telemetry?.currentWatts ?? 1840,
        todayConsumption: d.todayConsumption ?? d.telemetry?.todayKwh ?? 14.2,
        todayCost: d.todayCost ?? d.telemetry?.todayCost ?? 113.6,
        efficiencyScore: d.efficiencyScore ?? d.telemetry?.efficiencyScore ?? 78,
        activeAppliances: d.activeAppliances ?? (Array.isArray(d.appliances) ? d.appliances.filter((a: any) => a.is_on).length : 5),
        potentialSavings: d.potentialSavings ?? d.telemetry?.potentialSavingsTodayCost ?? 28,
        energyTrend: d.energyTrend ?? (Array.isArray(d.telemetry?.hourlyGraph) ? d.telemetry.hourlyGraph.map((h: any) => parseFloat(((h?.watts || 1000) / 1000).toFixed(2))) : [1.2, 1.4, 1.1, 0.9, 0.8, 1.5, 2.2, 2.8, 2.4, 2.1, 1.9, 2.5]),
      };
      set({ dashboard, loadingDashboard: false });
    } catch {
      set((prev) => ({
        dashboard: prev.dashboard || {
          currentPower: 1840,
          todayConsumption: 14.2,
          todayCost: 113.6,
          efficiencyScore: 78,
          activeAppliances: 5,
          potentialSavings: 28,
          energyTrend: [1.2, 1.4, 1.1, 0.9, 0.8, 1.5, 2.2, 2.8, 2.4, 2.1, 1.9, 2.5],
        },
        loadingDashboard: false,
      }));
    }
  },

  fetchAppliances: async () => {
    set({ loadingAppliances: true });
    try {
      const res: any = await api.fetchAppliances();
      const appliances = Array.isArray(res)
        ? res
        : Array.isArray(res.appliances)
        ? res.appliances
        : Array.isArray(res.data)
        ? res.data
        : [];
      set({ appliances, loadingAppliances: false });
    } catch {
      set({ loadingAppliances: false });
    }
  },

  fetchLeaks: async () => {
    set({ loadingLeaks: true });
    try {
      const res: any = await api.fetchLeaks();
      const leaks = Array.isArray(res)
        ? res
        : Array.isArray(res.leaks)
        ? res.leaks
        : Array.isArray(res.data)
        ? res.data
        : [];
      set({ leaks, loadingLeaks: false });
    } catch {
      set({ loadingLeaks: false });
    }
  },

  fetchInsights: async () => {
    set({ loadingInsights: true });
    try {
      const res: any = await api.fetchInsights();
      const insights = Array.isArray(res)
        ? res
        : Array.isArray(res.insights)
        ? res.insights
        : Array.isArray(res.data)
        ? res.data
        : [];
      set({ insights, loadingInsights: false });
    } catch {
      set({ loadingInsights: false });
    }
  },

  fetchRules: async () => {
    set({ loadingRules: true });
    try {
      const res: any = await api.fetchRules();
      const rules = Array.isArray(res)
        ? res
        : Array.isArray(res.rules)
        ? res.rules
        : Array.isArray(res.data)
        ? res.data
        : [];
      set({ rules, loadingRules: false });
    } catch {
      set({ loadingRules: false });
    }
  },

  fetchGoals: async () => {
    set({ loadingGoals: true });
    try {
      const res: any = await api.fetchGoals();
      const goals = Array.isArray(res)
        ? res
        : Array.isArray(res.goals)
        ? res.goals
        : Array.isArray(res.data)
        ? res.data
        : [];
      set({ goals, loadingGoals: false });
    } catch {
      set({ loadingGoals: false });
    }
  },

  fetchBillForecast: async () => {
    set({ loadingBillForecast: true });
    try {
      const res: any = await api.fetchBillForecast();
      const d = res.data || res;
      const billForecast: BillForecast = {
        currentUsage: d.currentUsage ?? d.currentUsageKwhToday ?? 17.5,
        projectedMonthly: d.projectedMonthly ?? d.projectedMonthlyKwh ?? 525,
        projectedBill: d.projectedBill ?? 3955,
        previousMonth: d.previousMonth ?? d.previousMonthBill ?? 4200,
        optimizedBill: d.optimizedBill ?? 2772,
        dailyProjection: d.dailyProjection || Array.from({ length: 30 }, (_, i) => Math.round(130 * (i + 1))),
      };
      set({ billForecast, loadingBillForecast: false });
    } catch {
      set((prev) => ({
        billForecast: prev.billForecast || {
          currentUsage: 17.5,
          projectedMonthly: 525,
          projectedBill: 3955,
          previousMonth: 4200,
          optimizedBill: 2772,
          dailyProjection: Array.from({ length: 30 }, (_, i) => Math.round(130 * (i + 1))),
        },
        loadingBillForecast: false,
      }));
    }
  },

  fetchCarbonImpact: async () => {
    set({ loadingCarbonImpact: true });
    try {
      const res: any = await api.fetchCarbonImpact();
      const d = res.data || res;
      const carbonImpact: CarbonImpact = {
        co2SavedToday: d.co2SavedToday ?? d.co2SavedTodayKg ?? 2.5,
        co2SavedMonth: d.co2SavedMonth ?? d.co2SavedMonthKg ?? 74,
        equivalentTrees: d.equivalentTrees ?? d.treesEquivalent ?? 40.9,
        equivalentEvKm: d.equivalentEvKm ?? d.evKmEquivalent ?? 617,
        impactStory: d.impactStory || 'By optimizing your dual-inverter AC setpoint and eliminating standby vampire draw, your home avoids coal emissions.',
      };
      set({ carbonImpact, loadingCarbonImpact: false });
    } catch {
      set((prev) => ({
        carbonImpact: prev.carbonImpact || {
          co2SavedToday: 2.5,
          co2SavedMonth: 74,
          equivalentTrees: 40.9,
          equivalentEvKm: 617,
          impactStory: 'By optimizing your dual-inverter AC setpoint and eliminating standby vampire draw, your home avoids coal emissions.',
        },
        loadingCarbonImpact: false,
      }));
    }
  },

  fetchSettings: async () => {
    set({ loadingSettings: true });
    try {
      const res: any = await api.fetchSettings();
      const settings = res.settings || res.data || res;
      setSoundEnabledAudio(settings.sound !== 'off');
      set({ settings, loadingSettings: false });
    } catch {
      set({ loadingSettings: false });
    }
  },

  refreshAll: async () => {
    const s = get();
    await Promise.allSettled([
      s.fetchDashboard(),
      s.fetchAppliances(),
      s.fetchLeaks(),
      s.fetchInsights(),
      s.fetchRules(),
      s.fetchGoals(),
      s.fetchBillForecast(),
      s.fetchCarbonImpact(),
      s.fetchSettings(),
    ]);
  },

  // --- Mutation actions ---
  toggleAppliance: async (id) => {
    try {
      await api.toggleAppliance(id);
      // Refresh appliances and dashboard together since toggling affects both
      await Promise.all([get().fetchAppliances(), get().fetchDashboard()]);
    } catch {
      get().showNotification('Failed to toggle appliance', 'error');
    }
  },

  updateAppliance: async (id, data) => {
    try {
      await api.updateAppliance(id, data);
      await Promise.all([get().fetchAppliances(), get().fetchDashboard()]);
      get().showNotification('Appliance updated', 'success');
    } catch {
      get().showNotification('Failed to update appliance', 'error');
    }
  },

  fixLeak: async (id) => {
    try {
      await api.fixLeak(id);
      await Promise.all([get().fetchLeaks(), get().fetchAppliances(), get().fetchDashboard()]);
      get().showNotification('Leak fixed! Energy saved.', 'success');
    } catch {
      get().showNotification('Failed to fix leak', 'error');
    }
  },

  calculateWhatIf: async (params) => {
    set({ loadingWhatIf: true });
    try {
      const res: any = await api.calculateWhatIf(params);
      const d = res.data || res;
      const whatIfResult: WhatIfResult = {
        currentBill: d.currentBill ?? d.current?.monthlyCost ?? 3120,
        optimizedBill: d.optimizedBill ?? d.optimized?.monthlyCost ?? 2480,
        savings: d.savings?.monthlyRupees ?? (typeof d.savings === 'number' ? d.savings : (d.currentBill - d.optimizedBill)),
        currentConsumption: d.currentConsumption ?? d.current?.monthlyKwh ?? 390,
        optimizedConsumption: d.optimizedConsumption ?? d.optimized?.monthlyKwh ?? 310,
        currentCO2: d.currentCO2 ?? Math.round((d.currentConsumption || 390) * 0.82),
        optimizedCO2: d.optimizedCO2 ?? Math.round((d.optimizedConsumption || 310) * 0.82),
      };
      set({ whatIfResult, loadingWhatIf: false });
    } catch {
      const currentBill = 3120;
      const acDeltaSavings = (params.ac_temp_delta || 0) * 120;
      const acHourSavings = (params.ac_hours || 0) * 85;
      const geyserSavings = (params.geyser_hours || 0) * 90;
      const peakSavings = ((params.peak_usage_pct || 0) / 100) * 450;
      const totalSavings = Math.round(acDeltaSavings + acHourSavings + geyserSavings + peakSavings);
      const optimizedBill = Math.max(1200, currentBill - totalSavings);
      set({
        whatIfResult: {
          currentBill,
          optimizedBill,
          savings: currentBill - optimizedBill,
          currentConsumption: 390,
          optimizedConsumption: Math.round(390 * (optimizedBill / currentBill)),
          currentCO2: Math.round(390 * 0.82),
          optimizedCO2: Math.round(390 * (optimizedBill / currentBill) * 0.82),
        },
        loadingWhatIf: false,
      });
    }
  },

  applyWhatIf: async (params) => {
    try {
      await api.applyWhatIf(params);
      await get().refreshAll();
      get().showNotification('Plan applied! Check your dashboard.', 'success');
    } catch {
      get().showNotification('Failed to apply plan', 'error');
    }
  },

  createRule: async (data) => {
    try {
      await api.createRule(data);
      await get().fetchRules();
      get().showNotification('Rule created', 'success');
    } catch {
      get().showNotification('Failed to create rule', 'error');
    }
  },

  updateRule: async (id, data) => {
    try {
      await api.updateRule(id, data);
      await get().fetchRules();
    } catch {
      get().showNotification('Failed to update rule', 'error');
    }
  },

  deleteRule: async (id) => {
    try {
      await api.deleteRule(id);
      await get().fetchRules();
      get().showNotification('Rule deleted', 'success');
    } catch {
      get().showNotification('Failed to delete rule', 'error');
    }
  },

  executeRule: async (id) => {
    try {
      await api.executeRule(id);
      await Promise.all([get().fetchRules(), get().fetchAppliances(), get().fetchDashboard()]);
      get().showNotification('Rule executed!', 'success');
    } catch {
      get().showNotification('Failed to execute rule', 'error');
    }
  },

  createGoal: async (data) => {
    try {
      await api.createGoal(data);
      await get().fetchGoals();
      get().showNotification('Goal created', 'success');
    } catch {
      get().showNotification('Failed to create goal', 'error');
    }
  },

  updateGoal: async (id, data) => {
    try {
      await api.updateGoal(id, data);
      await get().fetchGoals();
    } catch {
      get().showNotification('Failed to update goal', 'error');
    }
  },

  deleteGoal: async (id) => {
    try {
      await api.deleteGoal(id);
      await get().fetchGoals();
      get().showNotification('Goal deleted', 'success');
    } catch {
      get().showNotification('Failed to delete goal', 'error');
    }
  },

  updateSettings: async (data) => {
    try {
      const settings = await api.updateSettings(data);
      setSoundEnabledAudio(settings.sound !== 'off');
      set({ settings });
      get().showNotification('Settings saved', 'success');
    } catch {
      get().showNotification('Failed to save settings', 'error');
    }
  },

  setSimulationMode: async (mode) => {
    try {
      await api.setSimulationMode(mode);
      await get().refreshAll();
      get().showNotification(`Simulation: ${mode}`, 'info');
    } catch {
      get().showNotification('Failed to set simulation', 'error');
    }
  },

  // --- UI actions ---
  setHasSeenWelcome: (val) => {
    localStorage.setItem('ww-welcome-seen', String(val));
    set({ hasSeenWelcome: val });
  },

  setSidebarOpen: (val) => set({ sidebarOpen: val }),

  showNotification: (message, type = 'info') => {
    set({ notification: { message, type } });
    setTimeout(() => set({ notification: null }), 3500);
  },

  clearNotification: () => set({ notification: null }),

  runDemo: async (navigate) => {
    set({ isDemoRunning: true, demoStep: 1 });
    try {
      await api.startDemo();
      await get().refreshAll();
      get().showNotification('🏠 Smart Home Demo started!', 'info');

      // Step 2: After 2s navigate to Leak Detective
      setTimeout(() => {
        set({ demoStep: 2 });
        navigate('/leaks');
        get().showNotification('🔍 Energy leak detected! Check Leak Detective.', 'warning');
      }, 2500);

      // Step 3: Demo complete after another 2s
      setTimeout(() => {
        set({ demoStep: 3, isDemoRunning: false });
        get().showNotification('✅ Demo ready — try fixing the leak!', 'success');
      }, 5000);
    } catch {
      set({ isDemoRunning: false, demoStep: 0 });
      get().showNotification('Demo failed to start', 'error');
    }
  },

  resetAll: async () => {
    try {
      await api.resetAll();
      localStorage.removeItem('ww-welcome-seen');
      set({ hasSeenWelcome: false });
      await get().refreshAll();
      get().showNotification('All data reset', 'info');
    } catch {
      get().showNotification('Reset failed', 'error');
    }
  },
}));
