import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { api } from '../services/api';
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Globe,
  RotateCcw,
  IndianRupee,
  Sliders,
  CheckCircle,
  HelpCircle,
  Shield,
  Zap,
  Info,
  Home,
  Bell,
  Palette,
  Radio,
  Download,
  Trash2,
  Plus,
  Check,
  Layers
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';
import { voiceAssistant } from '../utils/VoiceAssistant';

export const SettingsView: React.FC = () => {
  const {
    settings,
    toggleSound,
    toggleVoice,
    setLanguage,
    lang,
    resetAllData,
    refreshStatus,
    showNotification,
    appliances,
    telemetry
  } = useEnergy();

  // Settings State
  const [tariffInput, setTariffInput] = useState<string>(settings?.tariff_kwh || '8.00');
  const [speed, setSpeed] = useState<string>(settings?.simulation_speed || '1x');
  const [tariffModel, setTariffModel] = useState<'slab' | 'flat'>((settings?.tariff_model as 'slab' | 'flat') || 'slab');
  const [fixedCharges, setFixedCharges] = useState<number>(120);

  // Home Config State
  const [homeType, setHomeType] = useState<string>('3 BHK Smart Eco-Apartment');
  const [floorArea, setFloorArea] = useState<number>(1850);
  const [sanctionedLoad, setSanctionedLoad] = useState<number>(7.0);

  // Notifications State
  const [notifyPeakSurge, setNotifyPeakSurge] = useState<boolean>(true);
  const [notifyVampireLeak, setNotifyVampireLeak] = useState<boolean>(true);
  const [notifyBillGoal, setNotifyBillGoal] = useState<boolean>(true);
  const [notifySound, setNotifySound] = useState<boolean>(true);

  // Theme State
  const [activeTheme, setActiveTheme] = useState<string>('futuristic-dark');

  // Rooms List
  const [rooms, setRooms] = useState<string[]>([
    'Living Room',
    'Master Bedroom',
    'Modular Kitchen',
    'Master Bathroom',
    'Home Office',
    'Utility Balcony'
  ]);
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const soundOn = settings?.sound_enabled !== 'false';
  const voiceOn = settings?.voice_enabled !== 'false';

  const handleSavePreferences = async () => {
    soundManager.playToggleClick(true);
    try {
      await api.updateSettings({
        tariff_kwh: tariffInput,
        simulation_speed: speed,
        tariff_model: tariffModel
      });
      await refreshStatus();
      showNotification('success', 'Preferences Saved', 'All tariff, model, and system parameters updated.');
    } catch (e) {
      showNotification('alert', 'Error', 'Failed to update preferences');
    }
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    if (rooms.includes(newRoomName.trim())) return;
    soundManager.playToggleClick(true);
    setRooms([...rooms, newRoomName.trim()]);
    setNewRoomName('');
    showNotification('success', 'Room Added', `Room "${newRoomName.trim()}" added to home configuration.`);
  };

  const handleRemoveRoom = (roomToRemove: string) => {
    if (rooms.length <= 1) return;
    soundManager.playToggleClick(false);
    setRooms(rooms.filter(r => r !== roomToRemove));
    showNotification('info', 'Room Removed', `Room "${roomToRemove}" removed.`);
  };

  const handleTestSound = () => {
    soundManager.playSuccessChime();
  };

  const handleTestVoice = async () => {
    if (lang === 'hi') {
      await voiceAssistant.speakHindiGreeting();
    } else {
      await voiceAssistant.speakEnglishGreeting();
    }
  };

  const handleFullReset = async () => {
    if (!window.confirm(lang === 'hi' ? 'क्या आप सभी डेमो डेटा रीसेट करना चाहते हैं?' : 'Are you sure you want to reset all demo appliances, leaks, and goals to baseline?')) {
      return;
    }
    setIsResetting(true);
    await resetAllData();
    setIsResetting(false);
  };

  const handleExportJSON = () => {
    soundManager.playSuccessChime();
    const backupData = {
      exportedAt: new Date().toISOString(),
      platform: 'WattWise AI',
      version: '1.0.0',
      homeConfig: {
        type: homeType,
        floorAreaSqFt: floorArea,
        sanctionedLoadKw: sanctionedLoad,
        rooms
      },
      tariffConfig: {
        ratePerKwh: tariffInput,
        model: tariffModel,
        fixedCharges
      },
      telemetrySnapshot: telemetry,
      appliances
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WattWise_Home_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Export Complete', 'Full JSON smart home configuration downloaded.');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* 1. Header */}
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
            {lang === 'hi' ? 'सिस्टम एवं पर्यावरण विन्यास' : 'System Configuration'}
          </span>
        </div>
        <h1 className="text-2xl font-black text-ivory tracking-tight">
          SETTINGS & HOME PROFILE
        </h1>
        <p className="text-xs text-amber-200/70 font-hindi">
          {lang === 'hi'
            ? 'ऑडियो प्रतिक्रिया, एआई वॉयस, भाषा, बिजली दर, कमरा प्रबंधन और डेटा नियंत्रण'
            : 'Configure Web Audio synthesized tones, SpeechSynthesis assistant, regional tariff rates, rooms, and state controls'}
        </p>
      </div>

      <div className="space-y-6">
        {/* 2. Audio & Voice Settings Card */}
        <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-5">
          <h3 className="text-sm font-bold text-ivory font-hindi flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>{lang === 'hi' ? 'ऑडियो एवं वॉयस सहायक (Web Audio API)' : 'Audio & Synthesized Voice Experience'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sound FX Toggle */}
            <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-ivory block font-hindi">
                  {lang === 'hi' ? 'सूक्ष्म स्पर्श साउंड इफेक्ट्स' : 'Micro-Tactile Sound Effects'}
                </span>
                <span className="text-[10px] text-ivory-dark">
                  Browser-safe Web Audio synthesizer
                </span>
                <div className="mt-2">
                  <button
                    onClick={handleTestSound}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-mono font-semibold underline"
                  >
                    Test Tone Chime ♪
                  </button>
                </div>
              </div>

              <button
                onClick={toggleSound}
                className={`p-2.5 rounded-xl border transition ${
                  soundOn
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-charcoal-850 border-white/10 text-ivory-dark'
                }`}
              >
                {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>

            {/* Voice Assistant Toggle */}
            <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-ivory block font-hindi">
                  {lang === 'hi' ? 'एआई वॉयस असिस्टेंट' : 'SpeechSynthesis Voice'}
                </span>
                <span className="text-[10px] text-ivory-dark font-hindi">
                  {lang === 'hi' ? 'हिन्दी और अंग्रेजी आवाज' : 'Native Hindi & English narration'}
                </span>
                <div className="mt-2">
                  <button
                    onClick={handleTestVoice}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-mono font-semibold underline"
                  >
                    Audition Voice 🎙️
                  </button>
                </div>
              </div>

              <button
                onClick={toggleVoice}
                className={`p-2.5 rounded-xl border transition ${
                  voiceOn
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-charcoal-850 border-white/10 text-ivory-dark'
                }`}
              >
                {voiceOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 3. Regional & Language Settings */}
        <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-5">
          <h3 className="text-sm font-bold text-ivory font-hindi flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>{lang === 'hi' ? 'भाषा एवं क्षेत्रीय प्राथमिकताएं' : 'Language & Regional Localization'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Language Selection */}
            <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/5">
              <label className="block text-ivory-dark mb-2 font-hindi">
                {lang === 'hi' ? 'प्राथमिक भाषा' : 'Interface Language'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLanguage('hi')}
                  className={`py-2 px-3 rounded-xl font-bold font-hindi text-xs transition ${
                    lang === 'hi'
                      ? 'bg-amber-500 text-charcoal-950 shadow-md'
                      : 'bg-charcoal-800 text-ivory hover:bg-charcoal-700'
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition ${
                    lang === 'en'
                      ? 'bg-amber-500 text-charcoal-950 shadow-md'
                      : 'bg-charcoal-800 text-ivory hover:bg-charcoal-700'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Currency Pill */}
            <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/5">
              <label className="block text-ivory-dark mb-2 font-hindi">
                {lang === 'hi' ? 'मुद्रा' : 'Currency Symbol'}
              </label>
              <div className="flex items-center gap-2 font-mono">
                <span className="py-2 px-4 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-sm">
                  ₹ INR (Indian Rupee)
                </span>
                <span className="text-[10px] text-ivory-dark">
                  Default for Indian Smart Home
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Home Configuration */}
        <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-5">
          <h3 className="text-sm font-bold text-ivory font-hindi flex items-center gap-2">
            <Home className="w-4 h-4 text-amber-400" />
            <span>Home Property Configuration</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-ivory-dark mb-1">Residence Type</label>
              <input
                type="text"
                value={homeType}
                onChange={(e) => setHomeType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-ivory-dark mb-1">Carpet Area (sq ft)</label>
              <input
                type="number"
                value={floorArea}
                onChange={(e) => setFloorArea(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory font-mono outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-ivory-dark mb-1">Sanctioned Grid Load (kW)</label>
              <input
                type="number"
                step="0.5"
                value={sanctionedLoad}
                onChange={(e) => setSanctionedLoad(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory font-mono outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* 5. Room Management */}
        <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ivory font-hindi flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Room Management ({rooms.length} Active Zones)</span>
            </h3>
          </div>

          {/* Room Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {(rooms || []).map((room) => {
              const count = (appliances || []).filter(a => ((a.room || '').toLowerCase()).includes(((room || '').toLowerCase()).split(' ')[0])).length;
              return (
                <div
                  key={room}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-charcoal-900 border border-white/10 text-xs text-ivory"
                >
                  <span className="font-semibold">{room}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-charcoal-800 text-amber-300">
                    {count} devices
                  </span>
                  <button
                    onClick={() => handleRemoveRoom(room)}
                    className="text-ivory-dark hover:text-rose-400 ml-1"
                    title="Remove room"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add New Room Form */}
          <form onSubmit={handleAddRoom} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Add new room (e.g. Balcony, Guest Room, Kids Room)"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="flex-1 p-2 rounded-xl bg-charcoal-950 border border-white/10 text-ivory text-xs outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5 text-charcoal-950" />
              <span>Add Room</span>
            </button>
          </form>
        </div>

        {/* 6. Electricity Tariff & Billing Models */}
        <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-5">
          <h3 className="text-sm font-bold text-ivory font-hindi flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-amber-400" />
            <span>Electricity Tariff Configuration</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-ivory-dark mb-1 font-hindi">
                Base Tariff (₹ / kWh)
              </label>
              <input
                type="number"
                step="0.25"
                value={tariffInput}
                onChange={(e) => setTariffInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory font-mono outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-ivory-dark mb-1 font-hindi">
                Pricing Model
              </label>
              <select
                value={tariffModel}
                onChange={(e) => setTariffModel(e.target.value as 'slab' | 'flat')}
                className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory outline-none focus:border-amber-400"
              >
                <option value="slab">Progressive Slab Tariff (BEE Indian Standard)</option>
                <option value="flat">Flat Commercial Rate</option>
              </select>
            </div>

            <div>
              <label className="block text-ivory-dark mb-1 font-hindi">
                Fixed Monthly Meter Charge (₹)
              </label>
              <input
                type="number"
                value={fixedCharges}
                onChange={(e) => setFixedCharges(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory font-mono outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSavePreferences}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs transition"
            >
              {lang === 'hi' ? 'सेटिंग्स सुरक्षित करें' : 'Save Parameters'}
            </button>
          </div>
        </div>

        {/* 7. Notification Settings */}
        <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-ivory flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Notification & Alert Thresholds</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="p-3 rounded-2xl bg-charcoal-900 border border-white/5 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-ivory block">Peak Surge Alert (&gt;3,200W)</span>
                <span className="text-[10px] text-ivory-dark">Instant popover when heavy load triggers</span>
              </div>
              <input
                type="checkbox"
                checked={notifyPeakSurge}
                onChange={(e) => setNotifyPeakSurge(e.target.checked)}
                className="accent-amber-500 cursor-pointer"
              />
            </label>

            <label className="p-3 rounded-2xl bg-charcoal-900 border border-white/5 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-ivory block">Vampire Leak Detection Alert</span>
                <span className="text-[10px] text-ivory-dark">Notify when phantom standby exceeds 20W</span>
              </div>
              <input
                type="checkbox"
                checked={notifyVampireLeak}
                onChange={(e) => setNotifyVampireLeak(e.target.checked)}
                className="accent-amber-500 cursor-pointer"
              />
            </label>

            <label className="p-3 rounded-2xl bg-charcoal-900 border border-white/5 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-ivory block">Bill Target Milestone Progress</span>
                <span className="text-[10px] text-ivory-dark">Celebration toast upon goal achievement</span>
              </div>
              <input
                type="checkbox"
                checked={notifyBillGoal}
                onChange={(e) => setNotifyBillGoal(e.target.checked)}
                className="accent-amber-500 cursor-pointer"
              />
            </label>

            <label className="p-3 rounded-2xl bg-charcoal-900 border border-white/5 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-ivory block">Audio Chimes on Actions</span>
                <span className="text-[10px] text-ivory-dark">Auditory feedback on toggles and fixes</span>
              </div>
              <input
                type="checkbox"
                checked={notifySound}
                onChange={(e) => setNotifySound(e.target.checked)}
                className="accent-amber-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* 8. Theme Settings */}
        <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-ivory flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-400" />
            <span>Futuristic Energy Theme Interface</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div
              onClick={() => setActiveTheme('futuristic-dark')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                activeTheme === 'futuristic-dark'
                  ? 'bg-amber-500/15 border-amber-400 text-ivory shadow-lg shadow-amber-500/10'
                  : 'bg-charcoal-900 border-white/5 text-ivory-dark'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-ivory">Futuristic Dark Tech</span>
                {activeTheme === 'futuristic-dark' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div className="flex gap-1.5 h-3 mt-1">
                <span className="w-4 rounded-full bg-charcoal-950" />
                <span className="w-4 rounded-full bg-amber-500" />
                <span className="w-4 rounded-full bg-lime-500" />
              </div>
            </div>

            <div
              onClick={() => setActiveTheme('deep-cyber')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                activeTheme === 'deep-cyber'
                  ? 'bg-amber-500/15 border-amber-400 text-ivory'
                  : 'bg-charcoal-900 border-white/5 text-ivory-dark'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-ivory">Deep Cyber Emerald</span>
                {activeTheme === 'deep-cyber' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div className="flex gap-1.5 h-3 mt-1">
                <span className="w-4 rounded-full bg-black" />
                <span className="w-4 rounded-full bg-emerald-500" />
                <span className="w-4 rounded-full bg-cyan-400" />
              </div>
            </div>

            <div
              onClick={() => setActiveTheme('high-contrast')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                activeTheme === 'high-contrast'
                  ? 'bg-amber-500/15 border-amber-400 text-ivory'
                  : 'bg-charcoal-900 border-white/5 text-ivory-dark'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-ivory">High Contrast Amber</span>
                {activeTheme === 'high-contrast' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div className="flex gap-1.5 h-3 mt-1">
                <span className="w-4 rounded-full bg-charcoal-900" />
                <span className="w-4 rounded-full bg-amber-400" />
                <span className="w-4 rounded-full bg-white" />
              </div>
            </div>
          </div>
        </div>

        {/* 9. Data Export & Reset Controls */}
        <div className="p-6 rounded-3xl bg-charcoal-900/90 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-ivory flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-400" />
                <span>Data Export & Full Snapshot Backup</span>
              </h3>
              <p className="text-xs text-ivory-dark mt-1">
                Export your smart home energy configuration, appliances, and telemetry history to JSON.
              </p>
            </div>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-ivory border border-white/10 text-xs font-semibold shrink-0 transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export JSON Backup</span>
            </button>
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 font-hindi">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'डेमो डेटा रीसेट (RESET DEMO STATE)' : 'RESET DEMO DATA STATE'}</span>
              </h4>
              <p className="text-[11px] text-ivory-dark mt-0.5 font-hindi">
                {lang === 'hi'
                  ? 'सभी उपकरणों, सक्रिय लीक्स, और टेलीमेट्री को प्रारंभिक स्थिति में लाएं।'
                  : 'Restores all 10 appliances, active leaks, rules, and telemetry records in local SQLite to pristine baseline.'}
              </p>
            </div>

            <button
              onClick={handleFullReset}
              disabled={isResetting}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition active:scale-95 shrink-0 disabled:opacity-50"
            >
              {isResetting
                ? (lang === 'hi' ? 'रीसेट हो रहा है...' : 'Resetting...')
                : (lang === 'hi' ? 'सभी डेटा रीसेट करें' : 'Reset Demo Data')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
