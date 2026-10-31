// WattWise AI — TypeScript interfaces for all data models

export interface Appliance {
  id: string;
  name: string;
  icon: string;
  category: string;
  power_watts: number;
  is_on: number;
  priority: string;
  schedule_start: string;
  schedule_end: string;
  daily_usage_hours: number;
  created_at: string;
}

export interface Dashboard {
  currentPower: number;
  todayConsumption: number;
  todayCost: number;
  efficiencyScore: number;
  activeAppliances: number;
  potentialSavings: number;
  energyTrend: number[];
}

export interface Leak {
  id: string;
  appliance_id: string;
  applianceName?: string;
  type: string;
  description: string;
  confidence: number;
  waste_kwh: number;
  waste_cost: number;
  detected_at: string;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  impact: string;
  category: string;
  recommended_action: string;
}

export interface Rule {
  id: string;
  name: string;
  condition: string;
  action: string;
  is_enabled: number;
  trigger_count: number;
  last_triggered: string;
  created_at: string;
}

export interface Goal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  type: string;
  is_completed: number;
  deadline: string;
  created_at: string;
}

export interface BillForecast {
  currentUsage: number;
  projectedMonthly: number;
  projectedBill: number;
  previousMonth: number;
  optimizedBill: number;
  dailyProjection: number[];
}

export interface CarbonImpact {
  co2SavedToday: number;
  co2SavedMonth: number;
  equivalentTrees: number;
  equivalentEvKm: number;
  impactStory: string;
}

export interface WhatIfParams {
  ac_temp_delta: number;
  ac_hours: number;
  geyser_hours: number;
  fan_hours: number;
  light_hours: number;
  washing_freq: number;
  peak_usage_pct: number;
}

export interface WhatIfResult {
  currentBill: number;
  optimizedBill: number;
  savings: number;
  currentConsumption: number;
  optimizedConsumption: number;
  currentCO2: number;
  optimizedCO2: number;
}

export interface Settings {
  tariff: string;
  peak_tariff: string;
  language: string;
  sound: string;
  voice: string;
  simulation_speed: string;
  theme: string;
  currency: string;
}
