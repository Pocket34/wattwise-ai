import React, { useState, useEffect } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { DiscoveredDevice, CommonDevice, ProviderInfo } from '../types';
import {
  Radio,
  Search,
  RefreshCw,
  Home,
  Layers,
  Cloud,
  Cpu,
  Power,
  Sliders,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  Tv,
  Wind,
  Refrigerator,
  Flame,
  Sun,
  Shirt,
  Laptop,
  Waves,
  Plus,
  Unlink,
  Clock,
  Compass,
  AlertTriangle,
  ExternalLink,
  Check
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';
import { api } from '../services/api';
import { integrationsApi } from '../services/integrationsApi';
import { SmartSavingCard } from '../components/SmartSavingCard';
import { HomeEnergyMap } from '../components/HomeEnergyMap';
import { AIEnergyAdvisorPanel } from '../components/AIEnergyAdvisorPanel';
import { EnergyOrchestrator } from '../components/EnergyOrchestrator';
import { SmartHomeScenes } from '../components/SmartHomeScenes';
import confetti from 'canvas-confetti';

export const SmartHomeBridgeView: React.FC = () => {
  const {
    appliances,
    toggleAppliance,
    setApplianceSpeed,
    setApplianceBrightness,
    setApplianceTemp,
    setIsBridgeModalOpen,
    refreshStatus,
    refreshProviders,
    providerStatuses,
    integrationMode,
    setIntegrationMode,
    showNotification,
    telemetry,
    lang
  } = useEnergy();

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [selectedScanProvider, setSelectedScanProvider] = useState<string>('demo');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [scanStepIndex, setScanStepIndex] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<'fleet' | 'orchestrator' | 'scenes' | 'map' | 'insights'>('fleet');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [discoveredScanDevices, setDiscoveredScanDevices] = useState<CommonDevice[]>([]);
  const [selectedDiscoveredIds, setSelectedDiscoveredIds] = useState<Set<string>>(new Set());

  // Load initial protocol statuses
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await integrationsApi.getStatus();
      if (data.lastSyncTime) setLastSyncTime(data.lastSyncTime);
    } catch (e) {}
  };

  const scanSteps = [
    lang === 'hi' ? 'स्मार्ट होम नेटवर्क में उपकरण खोजे जा रहे हैं...' : 'Searching your smart home...',
    lang === 'hi' ? 'प्रोटोकॉल स्तर पर डिवाइस डिस्कवर किए जा रहे हैं...' : 'Discovering devices across protocols...',
    lang === 'hi' ? 'ऊर्जा व पावर क्षमता क्लस्टर पढ़े जा रहे हैं...' : 'Reading energy capabilities...',
    lang === 'hi' ? 'आपके घर का ऊर्जा ग्रिड मैप तैयार...' : 'Building your home energy map...'
  ];

  const handleStartScan = async (providerId = 'demo') => {
    setSelectedScanProvider(providerId);
    setIsScanning(true);
    setScanStepIndex(0);
    setDiscoveredScanDevices([]);
    soundManager.playScanPing();

    await new Promise((r) => setTimeout(r, 600));
    setScanStepIndex(1);
    soundManager.playScanPing();

    await new Promise((r) => setTimeout(r, 600));
    setScanStepIndex(2);
    soundManager.playScanPing();

    await new Promise((r) => setTimeout(r, 600));
    setScanStepIndex(3);
    soundManager.playScanCompleted();

    try {
      const res = await integrationsApi.scanDevices(providerId);
      if (res.devices && res.devices.length > 0) {
        setDiscoveredScanDevices(res.devices);
        setSelectedDiscoveredIds(new Set(res.devices.map(d => d.id)));
      } else {
        showNotification('info', 'Discovery Complete', res.message || 'No new devices discovered.');
      }
    } catch (err: any) {
      showNotification('alert', 'Scan Error', err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddDiscoveredToFleet = async () => {
    const toAdd = discoveredScanDevices.filter(d => selectedDiscoveredIds.has(d.id));
    if (toAdd.length === 0) {
      showNotification('alert', 'No Selection', 'Please select at least one device.');
      return;
    }

    soundManager.playToggleClick(true);
    try {
      await integrationsApi.addDevices(toAdd);
      soundManager.playDeviceConnected();
      showNotification(
        'success',
        lang === 'hi' ? 'उपकरण जोड़े गए' : 'Devices Added to WattWise',
        `${toAdd.length} device(s) linked to your home energy grid.`
      );
      setDiscoveredScanDevices([]);
      await refreshStatus();
      await refreshProviders();
    } catch (err: any) {
      showNotification('alert', 'Add Error', err.message);
    }
  };

  const handleSyncBridge = async () => {
    setIsSyncing(true);
    soundManager.playScanPing();

    try {
      const data = await api.syncBridge();
      soundManager.playSuccessChime();
      if (data.lastSyncTime) {
        setLastSyncTime(data.lastSyncTime);
      }
      await refreshStatus();
      await refreshProviders();

      showNotification(
        'success',
        lang === 'hi' ? 'सिंक्रोनाइज़ेशन पूर्ण' : 'Smart Home Bridge Synced',
        lang === 'hi'
          ? 'सभी कनेक्टेड प्रोटोकॉल और उपकरणों की टेलीमेट्री लाइव अपडेट हुई।'
          : 'All connected protocols synchronized with zero packet loss.'
      );
    } catch (e) {
      showNotification('alert', 'Sync Failed', 'Failed to synchronize with bridge.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async (providerId: string, providerName: string) => {
    soundManager.playAlertTone();
    try {
      if (providerId === 'google_home') {
        await integrationsApi.disconnectGoogle();
      } else {
        await api.disconnectBridgeProtocol(providerId);
      }
      await refreshStatus();
      await refreshProviders();

      showNotification(
        'info',
        lang === 'hi' ? 'सेवा डिस्कनेक्ट' : 'Service Disconnected',
        `${providerName} disconnected. Re-authenticate or pair anytime.`
      );
    } catch (e) {}
  };

  const getDeviceIcon = (id: string, type?: string) => {
    const t = String(type || '').toUpperCase();
    if (t === 'AC' || id === 'ac') return Wind;
    if (t === 'FAN' || id === 'fan') return Wind;
    if (t === 'LIGHT' || id === 'lights') return Sun;
    if (t === 'TV' || id === 'tv') return Tv;
    if (t === 'REFRIGERATOR' || id === 'fridge') return Refrigerator;
    if (t === 'WATER_HEATER' || id === 'geyser') return Flame;
    if (t === 'WASHING_MACHINE' || id === 'washer') return Shirt;
    if (t === 'SMART_PLUG' || id.includes('plug')) return Zap;
    if (id === 'laptop') return Laptop;
    if (id === 'pump') return Waves;
    return Zap;
  };

  const tariffRate = telemetry?.effectiveTariff || 8.0;

  // Provider statuses
  const googleProv = providerStatuses.find(p => p.id === 'google_home');
  const matterProv = providerStatuses.find(p => p.id === 'matter');
  const apiProv = providerStatuses.find(p => p.id === 'device_api');
  const demoProv = providerStatuses.find(p => p.id === 'demo');

  const getSourceBadge = (connectionType?: string) => {
    const type = connectionType || 'demo';
    switch (type) {
      case 'google_home':
        return { label: 'GOOGLE HOME', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'matter':
        return { label: 'MATTER', color: 'bg-lime-500/20 text-lime-bright border-lime-500/40' };
      case 'device_api':
      case 'cloud':
        return { label: 'DEVICE API', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      default:
        return { label: 'DEMO', color: 'bg-charcoal-800 text-amber-200/80 border-white/10' };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              {lang === 'hi' ? 'स्मार्ट होम कनेक्शन केंद्र' : 'Smart Home Integration Center'}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              integrationMode === 'LIVE'
                ? 'bg-lime-500/20 text-lime-bright border-lime-500/40'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              {integrationMode === 'LIVE' ? '● LIVE MODE' : '○ DEMO MODE'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-ivory tracking-tight">
            SMART HOME BRIDGE &amp; INTEGRATION
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {lang === 'hi'
              ? 'Google Home, Matter, Device API, और सिम्युलेटर का एकीकृत ऊर्जा नियंत्रण केंद्र'
              : 'Enterprise integration layer connecting Google HomeGraph, Matter, and local IoT gateways to WattWise Energy Engine'}
          </p>
        </div>

        {/* Top Action Buttons: Mode Switch, Add Device, Sync, Scan */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Toggle Mode Button */}
          <button
            onClick={() => {
              soundManager.playNavTick();
              setIntegrationMode(integrationMode === 'DEMO' ? 'LIVE' : 'DEMO');
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-mono font-bold border transition active:scale-95 flex items-center gap-1.5 ${
              integrationMode === 'LIVE'
                ? 'bg-lime-500/20 text-lime-bright border-lime-500/40 hover:bg-lime-500/30'
                : 'bg-charcoal-900 text-amber-300 border-amber-500/30 hover:border-amber-400'
            }`}
            title="Switch between DEMO MODE and LIVE INTEGRATION MODE"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Mode: {integrationMode}</span>
          </button>

          <button
            onClick={() => setIsBridgeModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-charcoal-900 hover:bg-charcoal-850 text-ivory border border-white/10 text-xs font-bold transition active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{lang === 'hi' ? 'डिवाइस जोड़ें' : 'Add Device'}</span>
          </button>

          <button
            onClick={handleSyncBridge}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-charcoal-900 hover:bg-charcoal-850 text-ivory border border-white/10 text-xs font-bold transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-lime-bright ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : (lang === 'hi' ? 'सिंक करें' : 'Sync Now')}</span>
          </button>

          <button
            onClick={() => handleStartScan('demo')}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs shadow-lg shadow-amber-500/25 border border-amber-300 transition active:scale-95 disabled:opacity-50"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 animate-spin text-charcoal-950" />
            ) : (
              <Search className="w-4 h-4 text-charcoal-950" />
            )}
            <span>{isScanning ? 'Scanning...' : (lang === 'hi' ? 'स्कैन करें' : 'Scan for Devices')}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-charcoal-900/60 border border-white/5 text-xs font-mono text-ivory-dark">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Last Synchronization:</span>
          <span className="text-amber-300 font-bold">{lastSyncTime}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-ivory-dark">Active Source:</span>
            <span className="text-amber-400 font-bold">{integrationMode}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-lime-bright animate-ping" />
            <span className="text-lime-bright font-bold">100% Protocol Fidelity</span>
          </div>
        </div>
      </div>

      {/* 4 Required Provider Cards: Google Home, Matter, Smart Device API, Demo Home */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: GOOGLE HOME */}
        <div className="p-4 rounded-3xl bg-charcoal-900/90 border border-amber-500/25 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-ivory">Google Home</span>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                googleProv?.status === 'connected'
                  ? 'bg-lime-500/20 text-lime-bright border-lime-500/40'
                  : googleProv?.status === 'ready'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-charcoal-800 text-ivory-dark border-white/10'
              }`}>
                {googleProv?.status === 'connected'
                  ? 'CONNECTED'
                  : googleProv?.status === 'ready'
                  ? 'READY'
                  : 'NOT CONFIGURED'}
              </span>
            </div>
            <p className="text-[11px] text-ivory-dark font-hindi leading-snug">
              {googleProv?.status === 'connected'
                ? 'OAuth active with Google HomeGraph'
                : googleProv?.status === 'ready'
                ? 'Credentials detected; ready for OAuth'
                : 'Requires GOOGLE_CLIENT_ID in .env'}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-amber-300">
              {appliances.filter((a) => a.connection_type === 'google_home').length} devices
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartScan('google_home')}
                className="text-ivory hover:text-amber-300 text-[10px]"
              >
                Scan
              </button>
              {googleProv?.status === 'connected' ? (
                <button
                  onClick={() => handleDisconnect('google_home', 'Google Home')}
                  className="text-rose-400 hover:text-rose-300 text-[10px] underline"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => setIsBridgeModalOpen(true)}
                  className="text-amber-400 hover:text-amber-300 text-[10px] font-bold underline"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: MATTER */}
        <div className="p-4 rounded-3xl bg-charcoal-900/90 border border-lime-500/25 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-lime-bright" />
                <span className="text-xs font-bold text-ivory">Matter</span>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                matterProv?.status === 'connected'
                  ? 'bg-lime-500/20 text-lime-bright border-lime-500/40'
                  : matterProv?.status === 'ready'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-charcoal-800 text-ivory-dark border-white/10'
              }`}>
                {matterProv?.status === 'connected'
                  ? 'CONNECTED'
                  : matterProv?.status === 'ready'
                  ? 'READY'
                  : 'NOT CONFIGURED'}
              </span>
            </div>
            <p className="text-[11px] text-ivory-dark font-hindi leading-snug">
              {matterProv?.configured
                ? 'Thread border router endpoint active'
                : 'Hardware controller required for live Matter'}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-lime-bright">
              {appliances.filter((a) => a.connection_type === 'matter').length} devices
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartScan('matter')}
                className="text-ivory hover:text-lime-bright text-[10px]"
              >
                Scan
              </button>
              <button
                onClick={() => setIsBridgeModalOpen(true)}
                className="text-amber-400 hover:text-amber-300 text-[10px] font-bold underline"
              >
                Pair
              </button>
            </div>
          </div>
        </div>

        {/* CARD 3: SMART DEVICE API */}
        <div className="p-4 rounded-3xl bg-charcoal-900/90 border border-cyan-500/25 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-ivory">Smart Device API</span>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                apiProv?.status === 'connected'
                  ? 'bg-lime-500/20 text-lime-bright border-lime-500/40'
                  : apiProv?.status === 'ready'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-charcoal-800 text-ivory-dark border-white/10'
              }`}>
                {apiProv?.status === 'connected'
                  ? 'CONNECTED'
                  : apiProv?.status === 'ready'
                  ? 'READY'
                  : 'NOT CONFIGURED'}
              </span>
            </div>
            <p className="text-[11px] text-ivory-dark font-hindi leading-snug">
              {apiProv?.configured
                ? 'Cloud REST/MQTT Gateway connected'
                : 'Requires SMART_DEVICE_API_URL in .env'}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-cyan-300">
              {appliances.filter((a) => a.connection_type === 'cloud' || a.connection_type === 'device_api').length} devices
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartScan('device_api')}
                className="text-ivory hover:text-cyan-300 text-[10px]"
              >
                Scan
              </button>
              <button
                onClick={() => setIsBridgeModalOpen(true)}
                className="text-amber-400 hover:text-amber-300 text-[10px] font-bold underline"
              >
                Config
              </button>
            </div>
          </div>
        </div>

        {/* CARD 4: DEMO HOME */}
        <div className="p-4 rounded-3xl bg-charcoal-900/90 border border-amber-500/35 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-ivory">Demo Home</span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                DEMO ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-ivory-dark font-hindi leading-snug">
              {lang === 'hi' ? '100% स्थानीय सिमुलेशन • बिना किसी बाहरी चाबी के' : '100% local deterministic telemetry simulation'}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-amber-300">
              {appliances.filter((a) => !a.connection_type || a.connection_type === 'demo').length} simulated
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartScan('demo')}
                className="text-amber-400 hover:text-amber-300 text-[10px] font-bold underline"
              >
                Scan
              </button>
              <button
                onClick={() => setIsBridgeModalOpen(true)}
                className="text-ivory-dark hover:text-ivory text-[10px]"
              >
                Add Device
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DISCOVERED DEVICES DRAWER (AFTER SCAN) */}
      {discoveredScanDevices.length > 0 && (
        <div className="p-5 rounded-3xl bg-charcoal-900 border border-amber-500/40 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-ivory">
                Discovered Smart Devices ({discoveredScanDevices.length})
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                Provider: {selectedScanProvider.toUpperCase()}
              </span>
            </div>

            <button
              onClick={handleAddDiscoveredToFleet}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-lime-electric to-lime-bright text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              Add to WattWise ({selectedDiscoveredIds.size} Selected)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {discoveredScanDevices.map((d) => {
              const isSelected = selectedDiscoveredIds.has(d.id);
              const AppIcon = getDeviceIcon(d.id, d.type);
              const badge = getSourceBadge(d.source);

              return (
                <div
                  key={d.id}
                  onClick={() => {
                    const next = new Set(selectedDiscoveredIds);
                    if (next.has(d.id)) next.delete(d.id);
                    else next.add(d.id);
                    setSelectedDiscoveredIds(next);
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-charcoal-950 border-amber-500/40 shadow-sm'
                      : 'bg-charcoal-950/40 border-white/5 opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      isSelected ? 'bg-amber-500 border-amber-400 text-charcoal-950' : 'border-white/20'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-charcoal-800 flex items-center justify-center text-amber-400 shrink-0">
                      <AppIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-ivory">{d.name}</span>
                        <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-ivory-dark">
                        {d.room} • {d.powerWatts}W • {d.online ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {d.powerWatts} W
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SCANNING RADAR OVERLAY EXPERIENCE */}
      {isScanning && (
        <div className="p-8 rounded-3xl bg-gradient-to-b from-charcoal-900 to-charcoal-950 border border-amber-500/50 shadow-2xl flex flex-col items-center justify-center text-center space-y-4 animate-fade-in relative overflow-hidden">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping opacity-75" />
            <div className="absolute inset-2 rounded-full border border-amber-500/50 animate-pulse" />
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/30">
              <Radio className="w-7 h-7 animate-spin" />
            </div>
          </div>

          <div className="space-y-1 z-10">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
              Autonomous Protocol Discovery
            </span>
            <h3 className="text-lg font-bold text-ivory">
              Scanning for smart devices...
            </h3>
            <p className="text-xs text-amber-200/80 font-mono transition-all duration-300">
              {scanSteps[scanStepIndex]}
            </p>
          </div>
        </div>
      )}

      {/* Sub Tabs: Fleet Overview, Energy Orchestrator, Smart Scenes, Home Map, AI Advisor */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('fleet')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 ${
              activeSubTab === 'fleet'
                ? 'bg-amber-500 text-charcoal-950 shadow-md shadow-amber-500/20'
                : 'bg-charcoal-900 text-ivory-dark hover:text-ivory'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Connected Fleet ({appliances.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('orchestrator')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 ${
              activeSubTab === 'orchestrator'
                ? 'bg-amber-500 text-charcoal-950 shadow-md shadow-amber-500/20'
                : 'bg-charcoal-900 text-ivory-dark hover:text-ivory'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Energy Orchestrator</span>
          </button>

          <button
            onClick={() => setActiveSubTab('scenes')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 ${
              activeSubTab === 'scenes'
                ? 'bg-amber-500 text-charcoal-950 shadow-md shadow-amber-500/20'
                : 'bg-charcoal-900 text-ivory-dark hover:text-ivory'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Smart Home Scenes</span>
          </button>

          <button
            onClick={() => setActiveSubTab('map')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 ${
              activeSubTab === 'map'
                ? 'bg-amber-500 text-charcoal-950 shadow-md shadow-amber-500/20'
                : 'bg-charcoal-900 text-ivory-dark hover:text-ivory'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Home Energy Map</span>
          </button>

          <button
            onClick={() => setActiveSubTab('insights')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 ${
              activeSubTab === 'insights'
                ? 'bg-amber-500 text-charcoal-950 shadow-md shadow-amber-500/20'
                : 'bg-charcoal-900 text-ivory-dark hover:text-ivory'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Energy Advisor</span>
          </button>
        </div>

        {/* TAB 1: FLEET OVERVIEW WITH SOURCE BADGES & FUNCTIONAL CONTROLS */}
        {activeSubTab === 'fleet' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
            {appliances.map((app) => {
              const AppIcon = getDeviceIcon(app.id, app.category);
              const badge = getSourceBadge(app.connection_type);

              const dailyKwh = ((app.is_on ? app.power_watts * app.daily_hours : 0) / 1000).toFixed(2);
              const dailyCost = Math.round(parseFloat(dailyKwh) * tariffRate);

              return (
                <div
                  key={app.id}
                  className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                    app.is_on
                      ? 'bg-charcoal-900/90 border-amber-500/30 hover:border-amber-400 shadow-lg shadow-amber-500/5'
                      : 'bg-charcoal-950/80 border-white/5 opacity-70 hover:opacity-95'
                  }`}
                >
                  <div>
                    {/* Card Top: Source Badge + Main Power Toggle Button */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>

                      {/* Main Power Toggle Button */}
                      <button
                        onClick={() => toggleAppliance(app.id)}
                        className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${
                          app.is_on ? 'bg-amber-500' : 'bg-charcoal-800'
                        }`}
                        title="Toggle Power"
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-charcoal-950 shadow transform transition-transform duration-200 ${
                            app.is_on ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Device Name & Room */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          app.is_on
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-charcoal-800 text-ivory-dark'
                        }`}
                      >
                        <AppIcon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-ivory truncate">
                          {lang === 'hi' ? app.name_hi : app.name}
                        </h3>
                        <p className="text-[11px] text-ivory-dark font-mono">
                          {app.room} • {app.efficiency_rating}
                        </p>
                      </div>
                    </div>

                    {/* Inline Quick Functional Controls */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                      {/* AC: Temperature +/- & Slider */}
                      {app.id === 'ac' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-ivory-dark">Thermostat</span>
                            <span className="text-lime-bright font-bold">{app.temp_setpoint || 24}°C</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setApplianceTemp('ac', Math.max(16, (app.temp_setpoint || 24) - 1))}
                              className="px-2.5 py-1 rounded bg-charcoal-800 text-ivory hover:bg-charcoal-700 font-mono text-xs font-bold active:scale-95"
                            >
                              -
                            </button>
                            <input
                              type="range"
                              min="16"
                              max="30"
                              step="1"
                              value={app.temp_setpoint || 24}
                              onChange={(e) => setApplianceTemp('ac', Number(e.target.value))}
                              className="w-full accent-lime-500 cursor-pointer"
                            />
                            <button
                              onClick={() => setApplianceTemp('ac', Math.min(30, (app.temp_setpoint || 24) + 1))}
                              className="px-2.5 py-1 rounded bg-charcoal-800 text-ivory hover:bg-charcoal-700 font-mono text-xs font-bold active:scale-95"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Fan: 5-Speed Selector */}
                      {app.id === 'fan' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-ivory-dark">Fan Speed</span>
                            <span className="text-amber-300 font-bold">{app.device_speed || 4} / 5</span>
                          </div>
                          <div className="grid grid-cols-5 gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                onClick={() => setApplianceSpeed('fan', s)}
                                className={`py-1 text-[11px] font-mono rounded font-bold transition active:scale-95 ${
                                  (app.device_speed || 4) === s
                                    ? 'bg-amber-500 text-charcoal-950'
                                    : 'bg-charcoal-800 text-ivory-dark hover:text-ivory'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lights: Brightness Slider */}
                      {app.id === 'lights' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-ivory-dark">Brightness</span>
                            <span className="text-amber-300 font-bold">{app.brightness || 85}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={app.brightness || 85}
                            onChange={(e) => setApplianceBrightness('lights', Number(e.target.value))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Water Heater: Temperature Slider */}
                      {app.id === 'geyser' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-ivory-dark">Water Heat</span>
                            <span className="text-rose-400 font-bold">{app.water_temp || 55}°C</span>
                          </div>
                          <input
                            type="range"
                            min="40"
                            max="75"
                            step="5"
                            value={app.water_temp || 55}
                            onChange={(e) => setApplianceTemp('geyser', Number(e.target.value))}
                            className="w-full accent-rose-500 cursor-pointer"
                          />
                        </div>
                      )}

                      {/* TV / Entertainment: Standby Kill */}
                      {app.id === 'tv' && (
                        <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                          <span className="text-ivory-dark">Standby Vampire Circuit</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            app.vampire_active ? 'bg-rose-500/20 text-rose-300' : 'bg-lime-500/20 text-lime-bright'
                          }`}>
                            {app.vampire_active ? '28W Draw' : 'Isolated'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Metrics */}
                  <div className="pt-3 mt-3 border-t border-white/5 space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-ivory-dark">Current Power:</span>
                      <span className="font-bold text-amber-300">
                        {app.is_on ? `${app.power_watts} W` : (app.vampire_active ? `${app.standby_watts || 5}W (Standby)` : '0 W')}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-ivory-dark">Daily Est. Cost:</span>
                      <span className="font-bold text-ivory">₹{dailyCost}</span>
                    </div>

                    <div className="flex justify-between text-[10px] text-ivory-dark">
                      <span>{app.daily_hours} hrs/day</span>
                      <span className={app.is_on ? 'text-lime-bright' : 'text-ivory-dark'}>
                        {app.is_on ? 'ACTIVE DRAW' : 'IDLE'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: ENERGY ORCHESTRATOR */}
        {activeSubTab === 'orchestrator' && <EnergyOrchestrator />}

        {/* TAB 3: SMART HOME SCENES */}
        {activeSubTab === 'scenes' && <SmartHomeScenes />}

        {/* TAB 4: VIRTUAL HOME ENERGY FLOOR PLAN */}
        {activeSubTab === 'map' && <HomeEnergyMap />}

        {/* TAB 5: AI ENERGY ADVISOR PANEL */}
        {activeSubTab === 'insights' && <AIEnergyAdvisorPanel />}
      </div>
    </div>
  );
};
