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
  Info
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
    showNotification
  } = useEnergy();

  const [tariffInput, setTariffInput] = useState<string>(settings?.tariff_kwh || '8.00');
  const [speed, setSpeed] = useState<string>(settings?.simulation_speed || '1x');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const soundOn = settings?.sound_enabled !== 'false';
  const voiceOn = settings?.voice_enabled !== 'false';

  const handleSaveTariff = async () => {
    soundManager.playToggleClick(true);
    try {
      await api.updateSettings({
        tariff_kwh: tariffInput,
        simulation_speed: speed
      });
      await refreshStatus();
      showNotification('success', 'Settings Saved', 'Electricity tariff and simulation parameters saved.');
    } catch (e) {
      showNotification('alert', 'Error', 'Failed to save settings');
    }
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

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
            {lang === 'hi' ? 'सिस्टम एवं पर्यावरण विन्यास' : 'System Configuration'}
          </span>
        </div>
        <h1 className="text-2xl font-black text-ivory tracking-tight">
          SETTINGS & HARDWARE SIMULATION
        </h1>
        <p className="text-xs text-amber-200/70 font-hindi">
          {lang === 'hi'
            ? 'ऑडियो प्रतिक्रिया, एआई वॉयस, भाषा, बिजली दर और डेमो डेटा रीसेट'
            : 'Configure Web Audio synthesized tones, SpeechSynthesis assistant, regional tariff rates, and state reset'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Audio & Voice Settings Card */}
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
                    : 'bg-charcoal-800 border-white/10 text-ivory-dark'
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
                    : 'bg-charcoal-800 border-white/10 text-ivory-dark'
                }`}
              >
                {voiceOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Regional & Language Settings */}
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

        {/* Electricity Tariff & Simulation Speed */}
        <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-5">
          <h3 className="text-sm font-bold text-ivory font-hindi flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>{lang === 'hi' ? 'बिजली दर एवं सिमुलेशन गति' : 'Electricity Tariff & Clock Dynamics'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-ivory-dark mb-1 font-hindi">
                {lang === 'hi' ? 'यूटिलिटी बेस दर (₹ / kWh)' : 'Utility Base Tariff (₹ / kWh)'}
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
                {lang === 'hi' ? 'सिमुलेशन स्पीड' : 'Simulation Engine Speed'}
              </label>
              <select
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory outline-none focus:border-amber-400"
              >
                <option value="1x">1x Realtime Dynamics</option>
                <option value="2x">2x Accelerated Demo</option>
                <option value="5x">5x Fast Forward</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveTariff}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs transition"
            >
              {lang === 'hi' ? 'सेटिंग्स सुरक्षित करें' : 'Save Parameters'}
            </button>
          </div>
        </div>

        {/* Reset Demo Data (Absolute Requirement) */}
        <div className="p-6 rounded-3xl bg-charcoal-900/90 border border-rose-500/30 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 font-hindi">
                <RotateCcw className="w-4 h-4" />
                <span>{lang === 'hi' ? 'डेमो डेटा रीसेट (RESET DEMO STATE)' : 'RESET DEMO DATA STATE'}</span>
              </h3>
              <p className="text-xs text-ivory-dark mt-1 font-hindi leading-relaxed">
                {lang === 'hi'
                  ? 'सभी उपकरणों की स्थिति, सक्रिय लीक्स, ऊर्जा नियम और सिमुलेशन मेट्रिक्स को प्रारंभिक स्वच्छ स्थिति में पुनर्स्थापित करें।'
                  : 'Restores all 10 appliances, active leaks, rules, and telemetry records in the local SQLite database to pristine baseline.'}
              </p>
            </div>

            <button
              onClick={handleFullReset}
              disabled={isResetting}
              className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition active:scale-95 shrink-0 disabled:opacity-50"
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
