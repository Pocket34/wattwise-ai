export type NavSection =
  | 'home'
  | 'pulse'
  | 'appliances'
  | 'bridge'
  | 'leaks'
  | 'what-if'
  | 'rules'
  | 'forecast'
  | 'carbon'
  | 'goals'
  | 'insights'
  | 'settings';

export interface Appliance {
  id: string;
  name: string;
  name_hi: string;
  icon?: string;
  category: string;
  room: string;
  power_watts: number;
  baseline_watts: number;
  is_on: number;
  daily_hours: number;
  is_priority: number;
  schedule_start: string;
  schedule_end: string;
  schedule_enabled: number;
  efficiency_rating: string;
  temp_setpoint: number;
  standby_watts: number;
  vampire_active: number;
  connection_type?: string;
  is_connected?: number;
  device_speed?: number;
  brightness?: number;
  water_temp?: number;
  smart_saving_active?: number;
  updated_at?: string;
}

export interface DiscoveredDevice {
  id: string;
  name: string;
  name_hi: string;
  room: string;
  status: 'online' | 'standby' | 'offline';
  currentWatts: number;
  todayKwh: number;
  estDailyCost: number;
  efficiency: string;
  is_on: boolean;
  protocol: 'Matter' | 'Google Home' | 'Cloud Smart Home' | 'Demo Device';
  connectionType: 'Connected' | 'Demo Device';
  capabilities: string[];
}

export type DeviceType =
  | 'AC'
  | 'FAN'
  | 'LIGHT'
  | 'TV'
  | 'REFRIGERATOR'
  | 'WASHING_MACHINE'
  | 'WATER_HEATER'
  | 'SMART_PLUG'
  | 'OTHER';

export type DeviceCapability =
  | 'power'
  | 'switch'
  | 'temperature'
  | 'brightness'
  | 'fanSpeed'
  | 'energyMonitoring';

export type DeviceSource = 'demo' | 'google_home' | 'matter' | 'device_api';
export type ProviderStatusType = 'not_configured' | 'ready' | 'connected' | 'demo';
export type IntegrationMode = 'DEMO' | 'LIVE';

export interface CommonDevice {
  id: string;
  name: string;
  nameHi?: string;
  room: string;
  type: string;
  manufacturer: string;
  online: boolean;
  powerWatts: number;
  baselineWatts?: number;
  energyTodayKwh: number;
  state: {
    isOn: boolean;
    tempSetpoint?: number;
    brightness?: number;
    fanSpeed?: number;
    waterTemp?: number;
    vampireActive?: boolean;
    standbyWatts?: number;
  };
  capabilities: string[];
  source: DeviceSource;
  lastUpdated: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  status: ProviderStatusType;
  label: string;
  configured: boolean;
  requiresCredentials?: boolean;
  connected?: boolean;
  connectedDevicesCount: number;
  message?: string;
  fabricId?: string;
  controllerEndpoint?: string;
  apiUrl?: string;
  lastSyncTime?: string | null;
  supportedCapabilities: string[];
}

export interface BridgeProtocol {
  id: string;
  name: string;
  status: string;
  label: string;
  connectedDevicesCount: number;
  projectId?: string;
  fabricId?: string;
  lastSyncTime?: string;
  supportedTypes: string[];
}

export interface SmartScene {
  id: 'sleep' | 'away' | 'peak_saver' | 'morning' | 'bill_saver';
  name: string;
  nameHi: string;
  icon: string;
  description: string;
  descriptionHi: string;
  estDailySaving: number;
  actions: string[];
}

export interface SmartSavingState {
  isEnabled: boolean;
  beforeWatts: number;
  afterWatts: number;
  savedWatts: number;
  dailyRupeesSaved: number;
  monthlyRupeesSaved: number;
  optimizedCount: number;
}

export interface HourlyDataPoint {
  hour: string;
  hourNum: number;
  watts: number;
  isCurrent: boolean;
  isPeak: boolean;
  costRate: number;
}

export interface Telemetry {
  currentWatts: number;
  baselineWatts: number;
  standbyVampireWatts: number;
  activeCount: number;
  todayKwh: number;
  todayCost: number;
  effectiveTariff: number;
  efficiencyScore: number;
  potentialSavingsTodayKwh: number;
  potentialSavingsTodayCost: number;
  co2TodayKg: number;
  co2AvoidedMonthKg: number;
  equivalentTrees: number;
  equivalentEvKm: number;
  hourlyGraph: HourlyDataPoint[];
  roomContributions: { room: string; watts: number }[];
  categoryContributions: { category: string; watts: number }[];
  totalLoadWatts?: number;
  projectedMonthlyKwh?: number;
  projectedMonthlyBill?: number;
}

export interface Leak {
  id: string;
  appliance_id: string;
  title: string;
  title_hi: string;
  description: string;
  description_hi: string;
  leak_type: string;
  confidence_pct: number;
  waste_kwh_daily: number;
  waste_cost_daily: number;
  recommended_action: string;
  recommended_action_hi: string;
  status: 'active' | 'fixed' | 'ignored';
  detected_at: string;
}

export interface Rule {
  id: string;
  title: string;
  title_hi: string;
  description: string;
  description_hi: string;
  trigger_type: string;
  threshold_val: number;
  action_type: string;
  target_appliance_id: string | null;
  is_enabled: number;
  last_triggered_at: string | null;
  trigger_count: number;
}

export interface Goal {
  id: string;
  title: string;
  title_hi: string;
  description: string;
  target_metric: string;
  target_value: number;
  current_value: number;
  unit: string;
  status: 'active' | 'completed';
  created_at: string;
}

export interface Insight {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'info';
  title: string;
  title_hi: string;
  description: string;
  description_hi: string;
  whyItMatters: string;
  estimatedImpact: string;
  actionLabel: string;
  actionPayload: any;
  category?: string;
  impact_level?: string;
  potential_monthly_savings?: number;
}

export interface ActivityLog {
  id: number;
  event_type: string;
  message: string;
  message_hi: string;
  kwh_impact: number;
  cost_impact: number;
  timestamp: string;
}

export interface Settings {
  theme: string;
  sound_enabled: string;
  voice_enabled: string;
  language: string;
  currency: string;
  tariff_kwh: string;
  tariff_model: string;
  simulation_speed: string;
  simulation_mode: string;
  has_seen_welcome: string;
  smart_saving_enabled?: string;
  smart_saving_before_watts?: string;
  smart_saving_after_watts?: string;
  google_home_status?: string;
  google_home_project_id?: string;
  matter_fabric_id?: string;
  active_scene?: string;
  last_sync_time?: string;
  integration_mode?: 'DEMO' | 'LIVE';
}

export interface WhatIfResult {
  current: {
    monthlyKwh: number;
    monthlyCost: number;
    dailyKwh: number;
  };
  optimized: {
    monthlyKwh: number;
    monthlyCost: number;
    dailyKwh: number;
  };
  savings: {
    monthlyRupees: number;
    kwhSavedMonthly: number;
    percentReduction: number;
    co2AvoidedKg: number;
    treesEquivalent: number;
  };
}

export interface ForecastData {
  currentUsageKwhToday: number;
  projectedMonthlyKwh: number;
  projectedBill: number;
  previousMonthKwh: number;
  previousMonthBill: number;
  optimizedMonthlyKwh: number;
  optimizedBill: number;
  potentialSavings: number;
  tariffRate: number;
  tariffModel: string;
  slabs: {
    name: string;
    rate: string;
    limit: string | number;
    consumed: number;
    cost: number;
  }[];
}

export interface CarbonData {
  co2SavedTodayKg: number;
  co2SavedMonthKg: number;
  treesEquivalent: number;
  evKmEquivalent: number;
  currentDailyCo2Kg: number;
  impactStory: string;
  impactStoryHi: string;
}
