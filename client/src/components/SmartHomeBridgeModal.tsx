import React, { useState, useEffect } from 'react';
import { useEnergy } from '../context/EnergyContext';
import {
  X,
  Radio,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Server,
  Cloud,
  Home,
  Check,
  Zap,
  Sliders,
  ExternalLink,
  ChevronRight,
  Tv,
  Wind,
  Refrigerator,
  Sun,
  Flame,
  AlertTriangle,
  Lock,
  Plug
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';
import { integrationsApi } from '../services/integrationsApi';
import { CommonDevice, ProviderInfo } from '../types';
import confetti from 'canvas-confetti';

interface DiscoveredItem {
  id: string;
  name: string;
  nameHi: string;
  room: string;
  watts: number;
  status: 'Online' | 'Standby' | 'Offline';
  selected: boolean;
  type: string;
  source: 'demo' | 'google_home' | 'matter' | 'device_api';
}

export const SmartHomeBridgeModal: React.FC = () => {
  const {
    isBridgeModalOpen,
    setIsBridgeModalOpen,
    refreshStatus,
    refreshProviders,
    providerStatuses,
    showNotification,
    lang,
    appliances
  } = useEnergy();

  const [activeTab, setActiveTab] = useState<'google' | 'matter' | 'api' | 'demo'>('google');

  // Google Home state
  const [googleStatus, setGoogleStatus] = useState<ProviderInfo | null>(null);
  const [isStartingOAuth, setIsStartingOAuth] = useState<boolean>(false);

  // Matter state
  const [matterCode, setMatterCode] = useState<string>('3497-201-9982');
  const [matterStatus, setMatterStatus] = useState<'idle' | 'commissioning' | 'paired'>('idle');
  const [matterError, setMatterError] = useState<string | null>(null);

  // API Device state
  const [apiTesting, setApiTesting] = useState<boolean>(false);
  const [apiResult, setApiResult] = useState<{ connected?: boolean; message?: string; error?: string } | null>(null);

  // Demo scan flow
  const [demoScanState, setDemoScanState] = useState<'idle' | 'scanning' | 'discovered' | 'added'>('idle');
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredItem[]>([
    { id: 'tv', name: 'Living Room Smart TV', nameHi: 'लिविंग रूम स्मार्ट टीवी', room: 'Living Room', watts: 145, status: 'Online', selected: true, type: 'TV', source: 'demo' },
    { id: 'ac', name: 'Bedroom Smart AC', nameHi: 'बेडरूम स्मार्ट एसी', room: 'Bedroom', watts: 820, status: 'Online', selected: true, type: 'AC', source: 'demo' },
    { id: 'fridge', name: 'Kitchen Smart Refrigerator', nameHi: 'किचन स्मार्ट रेफ्रिजरेटर', room: 'Kitchen', watts: 180, status: 'Online', selected: true, type: 'REFRIGERATOR', source: 'demo' },
    { id: 'fan', name: 'Bedroom BLDC Fan', nameHi: 'बेडरूम बीएलडीसी पंखा', room: 'Bedroom', watts: 55, status: 'Online', selected: true, type: 'FAN', source: 'demo' },
    { id: 'plug-kitchen', name: 'Kitchen Smart Plug', nameHi: 'किचन स्मार्ट प्लग', room: 'Kitchen', watts: 12, status: 'Standby', selected: true, type: 'SMART_PLUG', source: 'demo' },
    { id: 'lights', name: 'Living Room Smart Light', nameHi: 'लिविंग रूम स्मार्ट लाइट', room: 'Living Room', watts: 77, status: 'Online', selected: true, type: 'LIGHT', source: 'demo' }
  ]);

  useEffect(() => {
    if (isBridgeModalOpen) {
      loadProviderDetails();
    }
  }, [isBridgeModalOpen]);

  const loadProviderDetails = async () => {
    try {
      const gStatus = await integrationsApi.getGoogleStatus();
      setGoogleStatus(gStatus);
    } catch (e) {}
  };

  if (!isBridgeModalOpen) return null;

  const handleClose = () => {
    soundManager.playNavTick();
    setIsBridgeModalOpen(false);
  };

  const handleStartGoogleOAuth = async () => {
    setIsStartingOAuth(true);
    soundManager.playNavTick();
    try {
      const res = await integrationsApi.startGoogleOAuth();
      if (res.configured && res.authorizationUrl) {
        soundManager.playSuccessChime();
        // Redirect or open OAuth window
        window.location.href = res.authorizationUrl;
      } else {
        soundManager.playAlertTone();
        showNotification(
          'alert',
          lang === 'hi' ? 'कॉन्फ़िगरेशन आवश्यक' : 'Configuration Required',
          res.message || 'Google Home integration requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
        );
      }
    } catch (err: any) {
      soundManager.playAlertTone();
      showNotification('alert', 'OAuth Error', err.message);
    } finally {
      setIsStartingOAuth(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    soundManager.playNavTick();
    try {
      await integrationsApi.disconnectGoogle();
      soundManager.playAlertTone();
      showNotification(
        'info',
        lang === 'hi' ? 'गूगल होम डिस्कनेक्ट' : 'Google Home Disconnected',
        lang === 'hi' ? 'गूगल खाता और टोकन हटा दिए गए।' : 'Google account disconnected and tokens revoked.'
      );
      await loadProviderDetails();
      await refreshStatus();
      await refreshProviders();
    } catch (err: any) {
      showNotification('alert', 'Error', err.message);
    }
  };

  const handleCommissionMatter = async () => {
    setMatterStatus('commissioning');
    setMatterError(null);
    soundManager.playScanPing();

    await new Promise((r) => setTimeout(r, 900));

    try {
      const res = await integrationsApi.commissionMatter(matterCode);
      if (res.success && res.paired) {
        soundManager.playDeviceConnected();
        setMatterStatus('paired');
        showNotification(
          'success',
          lang === 'hi' ? 'Matter डिवाइस चालू' : 'Matter Device Commissioned',
          res.message || 'Matter device commissioned successfully.'
        );
        await refreshStatus();
        await refreshProviders();
      } else {
        soundManager.playAlertTone();
        setMatterStatus('idle');
        setMatterError(res.error || 'Hardware controller required for live Matter commissioning.');
      }
    } catch (err: any) {
      soundManager.playAlertTone();
      setMatterStatus('idle');
      setMatterError(err.message);
    }
  };

  const handleTestDeviceApi = async () => {
    setApiTesting(true);
    setApiResult(null);
    soundManager.playScanPing();

    try {
      const res = await integrationsApi.testDeviceApi();
      setApiResult(res);
      if (res.success && res.connected) {
        soundManager.playSuccessChime();
        showNotification('success', 'Gateway Connected', res.message || 'Successfully reached device gateway');
        await refreshProviders();
      } else {
        soundManager.playAlertTone();
      }
    } catch (err: any) {
      setApiResult({ connected: false, error: err.message });
      soundManager.playAlertTone();
    } finally {
      setApiTesting(false);
    }
  };

  const handleStartDemoScan = async () => {
    setDemoScanState('scanning');
    soundManager.playScanPing();
    await new Promise((r) => setTimeout(r, 700));
    soundManager.playScanPing();
    await new Promise((r) => setTimeout(r, 600));
    soundManager.playScanCompleted();
    setDemoScanState('discovered');
  };

  const toggleSelectDevice = (id: string) => {
    soundManager.playNavTick();
    setDiscoveredDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d))
    );
  };

  const handleAddSelectedDevicesToWattWise = async () => {
    const selected = discoveredDevices.filter((d) => d.selected);
    if (selected.length === 0) {
      showNotification('alert', 'Selection Empty', 'Please select at least one device to add.');
      return;
    }

    soundManager.playToggleClick(true);
    try {
      const payload: CommonDevice[] = selected.map((d) => ({
        id: d.id,
        name: d.name,
        nameHi: d.nameHi,
        room: d.room,
        type: d.type,
        manufacturer: 'WattWise Local Simulator',
        online: d.status === 'Online',
        powerWatts: d.watts,
        energyTodayKwh: Number(((d.watts * 4.5) / 1000).toFixed(2)),
        state: {
          isOn: d.status === 'Online',
          tempSetpoint: d.type === 'AC' ? 24.0 : undefined,
          brightness: d.type === 'LIGHT' ? 70 : undefined,
          fanSpeed: d.type === 'FAN' ? 3 : undefined,
          vampireActive: d.status === 'Standby',
          standbyWatts: d.status === 'Standby' ? d.watts : 0
        },
        capabilities: ['power', 'switch', 'energyMonitoring'],
        source: 'demo',
        lastUpdated: new Date().toISOString()
      }));

      await integrationsApi.addDevices(payload);
      soundManager.playDeviceConnected();
      setDemoScanState('added');

      showNotification(
        'success',
        lang === 'hi' ? 'उपकरण जोड़े गए' : 'Devices Added to WattWise',
        lang === 'hi'
          ? `${selected.length} उपकरण सफलतापूर्वक आपके स्मार्ट होम ग्रिड में जुड़ गए।`
          : `${selected.length} smart device(s) successfully added to WattWise.`
      );

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      await refreshStatus();
      await refreshProviders();
    } catch (err: any) {
      showNotification('alert', 'Error', err.message);
    }
  };

  const selectedCount = discoveredDevices.filter((d) => d.selected).length;
  const isGoogleConfigured = googleStatus?.configured ?? false;
  const isGoogleConnected = googleStatus?.connected ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-charcoal-900 border border-amber-500/35 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow Accents */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-copper-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-copper-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  {lang === 'hi' ? 'स्मार्ट होम कनेक्शन ब्रिज' : 'Smart Home Integration Bridge'}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-bright border border-lime-500/30 font-mono">
                  Multi-Provider
                </span>
              </div>
              <h2 className="text-xl font-black text-ivory tracking-tight">
                {lang === 'hi' ? 'स्मार्ट होम कनेक्ट करें' : 'Connect your Smart Home'}
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-charcoal-800 text-ivory-dark hover:text-ivory hover:bg-charcoal-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Provider Tabs: [ Google Home ] [ Matter ] [ Smart Device API ] [ Demo Home ] */}
        <div className="grid grid-cols-4 p-2 bg-charcoal-950/70 border-b border-white/5 gap-1.5 text-xs font-bold">
          <button
            onClick={() => {
              soundManager.playNavTick();
              setActiveTab('google');
            }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-amber-500 text-charcoal-950 shadow-md'
                : 'text-ivory-dark hover:text-ivory hover:bg-white/5'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="truncate">Google Home</span>
          </button>

          <button
            onClick={() => {
              soundManager.playNavTick();
              setActiveTab('matter');
            }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'matter'
                ? 'bg-amber-500 text-charcoal-950 shadow-md'
                : 'text-ivory-dark hover:text-ivory hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="truncate">Matter</span>
          </button>

          <button
            onClick={() => {
              soundManager.playNavTick();
              setActiveTab('api');
            }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'api'
                ? 'bg-amber-500 text-charcoal-950 shadow-md'
                : 'text-ivory-dark hover:text-ivory hover:bg-white/5'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="truncate">Device API</span>
          </button>

          <button
            onClick={() => {
              soundManager.playNavTick();
              setActiveTab('demo');
            }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'demo'
                ? 'bg-amber-500 text-charcoal-950 shadow-md'
                : 'text-ivory-dark hover:text-ivory hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="truncate">Demo Home</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: GOOGLE HOME */}
          {activeTab === 'google' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-charcoal-950/70 border border-white/5 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-ivory">Google HomeGraph &amp; OAuth 2.0 Integration</h3>
                  <p className="text-xs text-ivory-dark font-hindi leading-relaxed">
                    {lang === 'hi'
                      ? 'अपने Google Nest, Assistant और Google Home से जुड़े स्मार्ट उपकरणों को सुरक्षित OAuth 2.0 से जोड़ें।'
                      : 'Connect your Google Assistant, Google Nest, and HomeGraph smart appliances via secure OAuth authorization.'}
                  </p>
                </div>
              </div>

              {/* Honest Configuration Check Box */}
              {!isGoogleConfigured ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wide">
                      Google Home integration requires configuration
                    </span>
                  </div>
                  <p className="text-xs text-ivory-dark leading-relaxed">
                    To link a real Google account, provide your OAuth credentials in the server environment (or <code className="text-amber-300 font-mono">.env</code> file):
                  </p>
                  <div className="p-3 rounded-xl bg-charcoal-950/90 font-mono text-[11px] text-amber-200/90 space-y-1 border border-white/5">
                    <div>GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com</div>
                    <div>GOOGLE_CLIENT_SECRET=your_client_secret</div>
                    <div>GOOGLE_REDIRECT_URI=http://localhost:3001/api/integrations/google/callback</div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        soundManager.playNavTick();
                        setActiveTab('demo');
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-charcoal-950 font-bold text-xs shadow transition active:scale-95"
                    >
                      {lang === 'hi' ? 'डेमो होम के साथ जारी रखें' : 'Continue with Demo Home'}
                    </button>
                    <span className="text-[11px] text-ivory-dark font-hindi">
                      {lang === 'hi' ? 'बिना API चाबी के तुरंत 100% स्थानीय सिमुलेशन चलाएं' : 'Runs instantly without any API keys'}
                    </span>
                  </div>
                </div>
              ) : isGoogleConnected ? (
                <div className="p-4 rounded-2xl bg-lime-500/10 border border-lime-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lime-bright">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-bold">Google Home Connected</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-bright border border-lime-500/30">
                      OAuth Active
                    </span>
                  </div>
                  <p className="text-xs text-ivory-dark">
                    Your Google Home account is authorized. Real appliances are reporting through HomeGraph.
                  </p>
                  <button
                    onClick={handleDisconnectGoogle}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold transition"
                  >
                    Disconnect Google Home
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-charcoal-950 border border-white/5 space-y-2">
                    <div className="text-xs font-mono text-lime-bright flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>OAuth Environment Credentials Detected</span>
                    </div>
                    <p className="text-xs text-ivory-dark">
                      Ready to authorize with Google accounts. Click below to initiate secure server-side OAuth flow with CSRF protection.
                    </p>
                  </div>

                  <button
                    onClick={handleStartGoogleOAuth}
                    disabled={isStartingOAuth}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-charcoal-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                  >
                    {isStartingOAuth ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-charcoal-950" />
                    ) : (
                      <ExternalLink className="w-4 h-4 text-charcoal-950" />
                    )}
                    <span>Connect Google Home via OAuth</span>
                  </button>
                </div>
              )}

              {/* Transparent Disclaimer */}
              <div className="p-3 rounded-xl bg-charcoal-950/60 border border-white/5 text-[11px] font-mono text-ivory-dark flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Notice: Demo Integration — Real Google OAuth required for live account access.</span>
              </div>
            </div>
          )}

          {/* TAB 2: MATTER PROTOCOL */}
          {activeTab === 'matter' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-charcoal-950/70 border border-white/5 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-bright shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-ivory">Matter Standard Protocol (Thread &amp; Wi-Fi)</h3>
                  <p className="text-xs text-ivory-dark font-hindi leading-relaxed">
                    {lang === 'hi'
                      ? 'Matter-सर्टिफाइड स्मार्ट एसी, इन्वर्टर, पंखे और लाइटिंग को 11-अंकीय कोड या QR कोड से पेयर करें।'
                      : 'Commission Matter-certified smart home appliances over local IPv6 Thread or Wi-Fi fabric.'}
                  </p>
                </div>
              </div>

              {/* Commissioning Notice */}
              <div className="p-4 rounded-2xl bg-charcoal-950 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-ivory">Matter Pairing Payload</span>
                  <span className="text-[10px] font-mono text-amber-300">Fabric: wattwise-fabric-01</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={matterCode}
                    onChange={(e) => setMatterCode(e.target.value)}
                    placeholder="e.g. 3497-201-9982"
                    className="flex-1 bg-charcoal-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-ivory focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleCommissionMatter}
                    disabled={matterStatus === 'commissioning'}
                    className="px-5 py-2.5 rounded-xl bg-lime-electric hover:bg-lime-bright text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    {matterStatus === 'commissioning' ? 'Pairing...' : 'Commission'}
                  </button>
                </div>

                {matterError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{matterError}</span>
                  </div>
                )}

                {matterStatus === 'paired' && (
                  <div className="p-3 rounded-xl bg-lime-500/10 border border-lime-500/30 text-lime-bright text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Matter device paired into local Thread fabric.</span>
                  </div>
                )}
              </div>

              {/* Hardware Controller Statement */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-ivory-dark space-y-1">
                <div className="font-bold text-amber-300 font-mono text-[11px] uppercase">
                  Hardware Controller Requirement
                </div>
                <p>
                  Hardware controller required for live Matter commissioning. Set <code className="text-amber-200 font-mono">MATTER_CONTROLLER_ENDPOINT</code> when connecting a physical SkyConnect, Nest Hub, or HomePod border router.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SMART DEVICE API */}
          {activeTab === 'api' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-charcoal-950/70 border border-white/5 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-ivory">Cloud &amp; REST / MQTT Device Gateway</h3>
                  <p className="text-xs text-ivory-dark font-hindi leading-relaxed">
                    {lang === 'hi'
                      ? 'Tuya, Shelly, TP-Link या होम असिस्टेंट जैसे कस्टम REST/MQTT गेटवे से लाइव ऊर्जा डेटा लें।'
                      : 'Connect custom IoT gateways, Tuya, Shelly, or Home Assistant REST/MQTT endpoints for live sub-second telemetry.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-charcoal-950 border border-white/5 space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-ivory-dark">Gateway Endpoint</label>
                  <input
                    type="text"
                    readOnly
                    value={providerStatuses.find(p => p.id === 'device_api')?.apiUrl || 'https://api.smartdevice.example.com/v1'}
                    className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-ivory-dark cursor-not-allowed"
                  />
                  <p className="text-[10px] text-ivory-dark">
                    Configured via <code className="text-amber-300 font-mono">SMART_DEVICE_API_URL</code> and <code className="text-amber-300 font-mono">SMART_DEVICE_API_KEY</code>.
                  </p>
                </div>

                <button
                  onClick={handleTestDeviceApi}
                  disabled={apiTesting}
                  className="px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-ivory border border-white/10 font-bold text-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {apiTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                  <span>Test Gateway Connection</span>
                </button>

                {apiResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      apiResult.connected
                        ? 'bg-lime-500/10 border border-lime-500/30 text-lime-bright'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {apiResult.connected ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{apiResult.message || apiResult.error}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DEMO HOME (DETERMINISTIC SIMULATOR) */}
          {activeTab === 'demo' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-charcoal-950/70 border border-white/5 flex items-start justify-between gap-3.5">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-ivory">Local Simulated Appliances Fleet</h3>
                    <p className="text-xs text-ivory-dark font-hindi leading-relaxed">
                      {lang === 'hi'
                        ? 'बिना किसी बाहरी क्रेडेंशियल के यथार्थवादी भारतीय घरेलू उपकरणों की टेलीमेट्री सिमुलेशन।'
                        : 'Deterministic simulated telemetry calibrated for authentic Indian residential energy loads.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleStartDemoScan}
                  disabled={demoScanState === 'scanning'}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95 shrink-0"
                >
                  {demoScanState === 'scanning' ? 'Scanning...' : 'Scan Devices'}
                </button>
              </div>

              {/* Scanning status banner */}
              {demoScanState === 'scanning' && (
                <div className="p-4 rounded-2xl bg-charcoal-950 border border-amber-500/40 flex items-center justify-center gap-3 text-amber-300 text-xs font-mono animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Searching your smart home &amp; discovering devices...</span>
                </div>
              )}

              {/* Discovered Devices Selection Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-ivory-dark px-1">
                  <span>Discovered Appliances ({discoveredDevices.length})</span>
                  <span className="text-amber-300 font-bold">{selectedCount} Selected</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {discoveredDevices.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => toggleSelectDevice(d.id)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        d.selected
                          ? 'bg-charcoal-950 border-amber-500/40 shadow-sm'
                          : 'bg-charcoal-950/50 border-white/5 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                            d.selected
                              ? 'bg-amber-500 border-amber-400 text-charcoal-950'
                              : 'border-white/20 bg-charcoal-800'
                          }`}
                        >
                          {d.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-ivory">
                              {lang === 'hi' ? d.nameHi : d.name}
                            </span>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-charcoal-800 text-amber-300/90 border border-white/5">
                              Demo Device
                            </span>
                          </div>
                          <p className="text-[11px] text-ivory-dark font-mono">
                            {d.room} • {d.watts}W • {d.status}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs text-amber-300 font-bold">
                        {d.watts} W
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add to WattWise Action Button */}
              <div className="pt-2 flex items-center justify-between border-t border-white/5">
                <span className="text-[11px] font-mono text-ivory-dark">
                  Source: <span className="text-amber-400 font-bold">DEMO</span>
                </span>

                <button
                  onClick={handleAddSelectedDevicesToWattWise}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-lime-electric to-lime-bright hover:from-lime-bright hover:to-lime-400 text-charcoal-950 font-bold text-xs shadow-lg shadow-lime-500/20 transition active:scale-95"
                >
                  Add to WattWise ({selectedCount} Selected)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-charcoal-950/80 border-t border-white/10 flex items-center justify-between text-xs font-mono text-ivory-dark">
          <span>WattWise Smart Home Bridge v3.0</span>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-xl bg-charcoal-800 text-ivory hover:bg-charcoal-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
