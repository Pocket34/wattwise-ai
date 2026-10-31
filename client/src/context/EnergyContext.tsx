import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Appliance,
  Telemetry,
  Leak,
  Rule,
  Goal,
  Insight,
  Settings,
  ActivityLog,
  NavSection,
  SmartSavingState,
  DiscoveredDevice,
  BridgeProtocol,
  ProviderInfo,
  IntegrationMode
} from '../types';
import { api, DashboardResponse } from '../services/api';
import { integrationsApi } from '../services/integrationsApi';
import { soundManager } from '../utils/SoundManager';
import { voiceAssistant } from '../utils/VoiceAssistant';

interface NotificationToast {
  id: string;
  type: 'success' | 'alert' | 'info';
  title: string;
  message: string;
}

interface EnergyContextType {
  navSection: NavSection;
  setNavSection: (sec: NavSection) => void;
  telemetry: Telemetry | null;
  appliances: Appliance[];
  leaks: Leak[];
  rules: Rule[];
  goals: Goal[];
  insights: Insight[];
  settings: Settings | null;
  recentActivity: ActivityLog[];
  smartSavingState: SmartSavingState;
  loading: boolean;
  error: string | null;
  notification: NotificationToast | null;
  clearNotification: () => void;
  showNotification: (type: 'success' | 'alert' | 'info', title: string, message: string) => void;
  refreshStatus: () => Promise<void>;
  toggleAppliance: (id: string, state?: boolean) => Promise<void>;
  updateApplianceDetails: (id: string, updates: Partial<Appliance>) => Promise<void>;
  setApplianceSpeed: (id: string, speed: number) => Promise<void>;
  setApplianceBrightness: (id: string, brightness: number) => Promise<void>;
  setApplianceTemp: (id: string, temp: number) => Promise<void>;
  toggleSmartSaving: (targetState?: boolean) => Promise<void>;
  scanDevices: () => Promise<{ scanSteps: string[]; discoveredDevices: DiscoveredDevice[] }>;
  fixLeak: (id: string) => Promise<void>;
  ignoreLeak: (id: string) => Promise<void>;
  applyInsightAction: (id: string) => Promise<void>;
  setSimulationMode: (mode: string) => Promise<void>;
  toggleSound: () => Promise<void>;
  toggleVoice: () => Promise<void>;
  setLanguage: (lang: 'hi' | 'en') => Promise<void>;
  resetAllData: () => Promise<void>;
  isWelcomeOpen: boolean;
  setIsWelcomeOpen: (open: boolean) => void;
  isDemoModalOpen: boolean;
  setIsDemoModalOpen: (open: boolean) => void;
  isBridgeModalOpen: boolean;
  setIsBridgeModalOpen: (open: boolean) => void;
  demoStep: number;
  runDemoStepAction: (step: number) => Promise<void>;
  lang: 'hi' | 'en';
  integrationMode: 'DEMO' | 'LIVE';
  setIntegrationMode: (mode: 'DEMO' | 'LIVE') => Promise<void>;
  providerStatuses: ProviderInfo[];
  refreshProviders: () => Promise<void>;
}

const EnergyContext = createContext<EnergyContextType | null>(null);

export const EnergyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navSection, setNavSectionState] = useState<NavSection>('home');
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [smartSavingState, setSmartSavingState] = useState<SmartSavingState>({
    isEnabled: false,
    beforeWatts: 2320,
    afterWatts: 1690,
    savedWatts: 630,
    dailyRupeesSaved: 34,
    monthlyRupeesSaved: 1020,
    optimizedCount: 4
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationToast | null>(null);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(0);
  const [integrationMode, setIntegrationModeState] = useState<IntegrationMode>('DEMO');
  const [providerStatuses, setProviderStatuses] = useState<ProviderInfo[]>([]);

  const lang: 'hi' | 'en' = settings?.language === 'en' ? 'en' : 'hi';

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const refreshProviders = useCallback(async () => {
    try {
      const data = await integrationsApi.getStatus();
      if (data.mode) setIntegrationModeState(data.mode);
      if (data.providers) setProviderStatuses(data.providers);
    } catch (e) {}
  }, []);

  const setIntegrationMode = async (mode: IntegrationMode) => {
    try {
      const res = await integrationsApi.setMode(mode);
      if (res.success) {
        setIntegrationModeState(res.mode);
        showNotification('success', `Switched to ${res.mode} Mode`, res.message);
        await refreshStatus();
        await refreshProviders();
      } else {
        showNotification('alert', 'Mode Switch Unavailable', res.error || 'Cannot switch mode');
      }
    } catch (err: any) {
      showNotification('alert', 'Mode Switch Failed', err.message);
    }
  };

  const showNotification = useCallback((type: 'success' | 'alert' | 'info', title: string, message: string) => {
    setNotification({ id: `toast-${Date.now()}`, type, title, message });
    if (type === 'success') {
      soundManager.playSuccessChime();
    } else if (type === 'alert') {
      soundManager.playAlertTone();
    }
  }, []);

  // Update navigation with soft tick sound
  const setNavSection = (sec: NavSection) => {
    soundManager.playNavTick();
    setNavSectionState(sec);
  };

  const applyStatusResponse = (data: DashboardResponse) => {
    setTelemetry(data.telemetry);
    setAppliances(data.appliances);
    setLeaks(data.leaks);
    setRules(data.rules);
    setGoals(data.goals);
    setInsights(data.insights);
    setSettings(data.settings);
    setRecentActivity(data.recentActivity);

    if (data.smartSavingState) {
      setSmartSavingState(data.smartSavingState);
    }

    // Sync sound and voice manager states with persisted settings
    const soundOn = data.settings.sound_enabled !== 'false';
    const voiceOn = data.settings.voice_enabled !== 'false';
    soundManager.setEnabled(soundOn);
    voiceAssistant.setEnabled(voiceOn);
    voiceAssistant.setLanguage(data.settings.language === 'en' ? 'en' : 'hi');

    if (data.settings.integration_mode) {
      setIntegrationModeState(data.settings.integration_mode as IntegrationMode);
    }

    // First time welcome check
    if (data.settings.has_seen_welcome !== 'true') {
      setIsWelcomeOpen(true);
    }
  };

  const refreshStatus = useCallback(async () => {
    try {
      const data = await api.getStatus();
      if (data.success) {
        applyStatusResponse(data);
        setError(null);
      }
    } catch (err: any) {
      console.warn('Network sync notice:', err.message);
      setError('Connecting to WattWise Intelligence Engine...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    refreshProviders();
    // Heartbeat sync every 5 seconds for live simulation feel
    const interval = setInterval(() => {
      refreshStatus();
      refreshProviders();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus, refreshProviders]);

  // Toggle appliance ON/OFF
  const toggleAppliance = async (id: string, targetState?: boolean) => {
    const current = appliances.find(a => a.id === id);
    if (!current) return;
    const newState = targetState !== undefined ? targetState : current.is_on === 0;

    soundManager.playToggleClick(newState);

    // Optimistic local update
    setAppliances(prev => prev.map(a => a.id === id ? { ...a, is_on: newState ? 1 : 0 } : a));

    try {
      await api.updateAppliance(id, { is_on: newState ? 1 : 0 });
      await refreshStatus();
      showNotification(
        'info',
        lang === 'hi' ? `${current.name_hi} ${newState ? 'चालू' : 'बंद'}` : `${current.name} switched ${newState ? 'ON' : 'OFF'}`,
        lang === 'hi' ? `लोड अद्यतनित: ${newState ? '+' : '-'}${current.power_watts} Watts` : `Instant load updated: ${newState ? '+' : '-'}${current.power_watts} Watts`
      );
    } catch (err) {
      showNotification('alert', 'Error', 'Failed to update appliance power state');
      refreshStatus();
    }
  };

  // Adjust Fan Speed
  const setApplianceSpeed = async (id: string, speed: number) => {
    soundManager.playToggleClick(true);
    const speedFactors: Record<number, number> = { 1: 0.35, 2: 0.55, 3: 0.75, 4: 0.90, 5: 1.0 };
    const current = appliances.find(a => a.id === id);
    const newWatts = current ? Math.round(current.baseline_watts * (speedFactors[speed] || 0.75)) : 45;

    setAppliances(prev => prev.map(a => a.id === id ? { ...a, device_speed: speed, power_watts: newWatts } : a));
    try {
      await api.updateAppliance(id, { device_speed: speed });
      await refreshStatus();
    } catch (e) {}
  };

  // Adjust Light Brightness
  const setApplianceBrightness = async (id: string, brightness: number) => {
    soundManager.playToggleClick(true);
    const current = appliances.find(a => a.id === id);
    const newWatts = current ? Math.round(current.baseline_watts * (brightness / 100)) : 85;

    setAppliances(prev => prev.map(a => a.id === id ? { ...a, brightness, power_watts: newWatts } : a));
    try {
      await api.updateAppliance(id, { brightness });
      await refreshStatus();
    } catch (e) {}
  };

  // Adjust AC or Geyser Temperature
  const setApplianceTemp = async (id: string, temp: number) => {
    soundManager.playToggleClick(true);
    try {
      await api.updateAppliance(id, { temp_setpoint: temp });
      await refreshStatus();
    } catch (e) {}
  };

  // Toggle Smart Saving Mode
  const toggleSmartSaving = async (targetState?: boolean) => {
    const nextState = targetState !== undefined ? targetState : !smartSavingState.isEnabled;
    if (nextState) {
      soundManager.playSuccessChime();
    } else {
      soundManager.playToggleClick(false);
    }

    try {
      const res = await api.toggleSmartSaving(nextState);
      if (res.success) {
        setSmartSavingState({
          isEnabled: res.enabled,
          beforeWatts: res.beforeWatts,
          afterWatts: res.afterWatts,
          savedWatts: res.savedWatts,
          dailyRupeesSaved: res.dailyRupeesSaved,
          monthlyRupeesSaved: res.monthlyRupeesSaved,
          optimizedCount: res.appliances.filter(a => a.smart_saving_active === 1).length
        });
        setTelemetry(res.telemetry);
        setAppliances(res.appliances);

        showNotification(
          nextState ? 'success' : 'info',
          nextState
            ? (lang === 'hi' ? 'स्मार्ट सेविंग मोड सक्रिय! ⚡' : 'Smart Saving Mode Engaged! ⚡')
            : (lang === 'hi' ? 'स्मार्ट सेविंग मोड बंद' : 'Smart Saving Mode Disengaged'),
          nextState
            ? (lang === 'hi'
                ? `घर का लोड ${res.beforeWatts}W से घटकर ${res.afterWatts}W हुआ। प्रतिदिन ₹${res.dailyRupeesSaved} की बचत होगी।`
                : `Power dropped from ${res.beforeWatts}W → ${res.afterWatts}W. Slashes ~₹${res.dailyRupeesSaved}/day.`)
            : (lang === 'hi'
                ? 'उपकरण सामान्य ऑपरेशन सेटिंग्स पर लौट आए हैं।'
                : 'Appliances restored to user preferences.')
        );
      }
    } catch (err) {
      showNotification('alert', 'Error', 'Failed to update Smart Saving Mode');
    }
  };

  // Scan Devices
  const scanDevices = async () => {
    soundManager.playSimulationActivate();
    const res = await api.scanBridgeDevices();
    soundManager.playDeviceConnected();
    return res;
  };

  // Update appliance details (temp, schedule, priority, power)
  const updateApplianceDetails = async (id: string, updates: Partial<Appliance>) => {
    soundManager.playToggleClick(true);
    try {
      await api.updateAppliance(id, updates);
      await refreshStatus();
      showNotification(
        'success',
        lang === 'hi' ? 'सेटिंग्स सुरक्षित' : 'Configuration Saved',
        lang === 'hi' ? 'उपकरण पैरामीटर सफलतापूर्वक अद्यतन किए गए' : 'Appliance parameters successfully updated in smart home.'
      );
    } catch (err) {
      showNotification('alert', 'Error', 'Failed to update appliance configuration');
    }
  };

  // Fix leak action
  const fixLeak = async (id: string) => {
    soundManager.playSuccessChime();
    try {
      await api.handleLeakAction(id, 'fix');
      await refreshStatus();
      showNotification(
        'success',
        lang === 'hi' ? 'ऊर्जा रिसाव ठीक किया गया! 🎉' : 'Energy Leak Eliminated! 🎉',
        lang === 'hi' ? 'व्यर्थ बिजली की खपत रोकी गई। आपका बिल घटेगा।' : 'Phantom/inefficient draw eliminated. Simulated power and bill forecast reduced!'
      );
    } catch (err) {
      showNotification('alert', 'Error', 'Failed to resolve leak');
    }
  };

  // Ignore leak action
  const ignoreLeak = async (id: string) => {
    soundManager.playNavTick();
    try {
      await api.handleLeakAction(id, 'ignore');
      await refreshStatus();
    } catch (err) {
      showNotification('alert', 'Error', 'Failed to dismiss alert');
    }
  };

  // Apply insight action
  const applyInsightAction = async (id: string) => {
    soundManager.playSuccessChime();
    try {
      await api.applyInsight(id);
      await refreshStatus();
      showNotification(
        'success',
        lang === 'hi' ? 'सलाह लागू की गई! ⚡' : 'Recommendation Applied! ⚡',
        lang === 'hi' ? 'एआई इंजन ने घर का लोड अनुकूलित कर दिया है।' : 'WattWise AI has tuned the appliance configuration for optimal energy savings.'
      );
    } catch (err) {
      showNotification('alert', 'Error', 'Failed to apply recommendation');
    }
  };

  // Set simulation mode
  const setSimulationMode = async (mode: string) => {
    soundManager.playSimulationActivate();
    try {
      await api.updateSettings({ simulation_mode: mode });
      await refreshStatus();
      showNotification(
        'info',
        lang === 'hi' ? `सिमुलेशन मोड: ${mode}` : `Simulation Mode: ${mode}`,
        lang === 'hi' ? 'स्मार्ट होम टेलीमेट्री मोड के अनुसार अपडेट हुई।' : `Household energy dynamics adapted to ${mode}.`
      );
    } catch (err) {
      showNotification('alert', 'Error', 'Failed to switch simulation mode');
    }
  };

  // Toggle sound
  const toggleSound = async () => {
    const nextVal = soundManager.getEnabled() ? 'false' : 'true';
    soundManager.setEnabled(nextVal === 'true');
    soundManager.playToggleClick(nextVal === 'true');
    await api.updateSettings({ sound_enabled: nextVal });
    setSettings(prev => prev ? { ...prev, sound_enabled: nextVal } : null);
  };

  // Toggle voice
  const toggleVoice = async () => {
    const nextVal = voiceAssistant.getEnabled() ? 'false' : 'true';
    voiceAssistant.setEnabled(nextVal === 'true');
    soundManager.playToggleClick(nextVal === 'true');
    await api.updateSettings({ voice_enabled: nextVal });
    setSettings(prev => prev ? { ...prev, voice_enabled: nextVal } : null);
  };

  // Set language
  const setLanguage = async (newLang: 'hi' | 'en') => {
    soundManager.playNavTick();
    voiceAssistant.setLanguage(newLang);
    await api.updateSettings({ language: newLang });
    setSettings(prev => prev ? { ...prev, language: newLang } : null);
  };

  // Reset all demo data
  const resetAllData = async () => {
    soundManager.playAlertTone();
    try {
      await api.resetDemo();
      await refreshStatus();
      showNotification(
        'info',
        lang === 'hi' ? 'डेमो डेटा रीसेट' : 'Demo State Reset',
        lang === 'hi' ? 'सभी उपकरण, लीक्स और आंकड़े प्रारंभिक स्थिति में रीसेट हो गए।' : 'All household appliances, anomalies, and rules restored to pristine baseline.'
      );
    } catch (err) {
      showNotification('alert', 'Error', 'Failed to reset demo data');
    }
  };

  // Run demo step action
  const runDemoStepAction = async (step: number) => {
    setDemoStep(step);
    soundManager.playSimulationActivate();
    try {
      await api.runDemoStep(step);
      await refreshStatus();
    } catch (err) {
      console.error('Demo step failed', err);
    }
  };

  return (
    <EnergyContext.Provider
      value={{
        navSection,
        setNavSection,
        telemetry,
        appliances,
        leaks,
        rules,
        goals,
        insights,
        settings,
        recentActivity,
        smartSavingState,
        loading,
        error,
        notification,
        clearNotification,
        showNotification,
        refreshStatus,
        toggleAppliance,
        updateApplianceDetails,
        setApplianceSpeed,
        setApplianceBrightness,
        setApplianceTemp,
        toggleSmartSaving,
        scanDevices,
        fixLeak,
        ignoreLeak,
        applyInsightAction,
        setSimulationMode,
        toggleSound,
        toggleVoice,
        setLanguage,
        resetAllData,
        isWelcomeOpen,
        setIsWelcomeOpen,
        isDemoModalOpen,
        setIsDemoModalOpen,
        isBridgeModalOpen,
        setIsBridgeModalOpen,
        demoStep,
        runDemoStepAction,
        lang,
        integrationMode,
        setIntegrationMode,
        providerStatuses,
        refreshProviders
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
};

export const useEnergy = () => {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  return context;
};
