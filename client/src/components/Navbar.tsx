import React from 'react';
import { useEnergy } from '../context/EnergyContext';
import {
  Zap,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  PlayCircle,
  Menu,
  X,
  Radio,
  RotateCcw
} from 'lucide-react';
import { voiceAssistant } from '../utils/VoiceAssistant';
import { soundManager } from '../utils/SoundManager';

interface NavbarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    settings,
    toggleSound,
    toggleVoice,
    setLanguage,
    lang,
    telemetry,
    setIsDemoModalOpen,
    resetAllData,
    integrationMode
  } = useEnergy();

  const soundOn = settings?.sound_enabled !== 'false';
  const voiceOn = settings?.voice_enabled !== 'false';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-charcoal-950/90 backdrop-blur-md px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Toggle + Logo + Tagline */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg bg-charcoal-850 border border-white/10 text-ivory hover:text-amber-400 transition"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-copper-600 shadow-lg shadow-amber-500/20 border border-amber-400/40">
              <Zap className="w-6 h-6 text-charcoal-950 fill-charcoal-950" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-electric"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-ivory">
                  WATTWISE <span className="text-amber-400 font-black">AI</span>
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                  integrationMode === 'LIVE'
                    ? 'bg-lime-500/20 text-lime-bright border-lime-500/40'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${integrationMode === 'LIVE' ? 'bg-lime-bright animate-ping' : 'bg-amber-400'}`} />
                  {integrationMode === 'LIVE' ? 'LIVE MODE' : 'DEMO MODE'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-amber-200/70 tracking-wide font-hindi truncate max-w-[220px] sm:max-w-none">
                समझदार घर • कम बिल • बेहतर कल
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Telemetry Indicator */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-charcoal-900 border border-amber-500/20 shadow-inner text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-lime-bright animate-pulse" />
            <span className="text-ivory-dark font-medium">
              {lang === 'hi' ? 'लाइव ऊर्जा:' : 'Live Load:'}
            </span>
            <span className="font-bold text-amber-300 font-mono text-sm">
              {telemetry ? `${telemetry.currentWatts.toLocaleString()} W` : '--- W'}
            </span>
          </div>
          <span className="w-1 h-3 bg-charcoal-700 rounded-full" />
          <div className="flex items-center gap-1.5 text-ivory-dark">
            <span>{lang === 'hi' ? 'दक्षता:' : 'Efficiency:'}</span>
            <span className={`font-bold font-mono ${telemetry && telemetry.efficiencyScore > 80 ? 'text-lime-electric' : 'text-amber-400'}`}>
              {telemetry ? `${telemetry.efficiencyScore}%` : '--%'}
            </span>
          </div>
        </div>

        {/* Right: Controls + Demo Launcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <div className="flex items-center bg-charcoal-900 border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                lang === 'hi'
                  ? 'bg-amber-500 text-charcoal-950 shadow-sm shadow-amber-500/30'
                  : 'text-ivory-dark hover:text-ivory'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                lang === 'en'
                  ? 'bg-amber-500 text-charcoal-950 shadow-sm shadow-amber-500/30'
                  : 'text-ivory-dark hover:text-ivory'
              }`}
            >
              EN
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Sound FX Enabled' : 'Sound FX Muted'}
            className={`p-2 rounded-lg border transition ${
              soundOn
                ? 'bg-charcoal-850 border-amber-500/30 text-amber-400 hover:border-amber-400'
                : 'bg-charcoal-900 border-white/10 text-ivory-dark hover:text-ivory'
            }`}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Voice Toggle */}
          <button
            onClick={toggleVoice}
            title={voiceOn ? 'Voice Assistant Enabled' : 'Voice Assistant Muted'}
            className={`p-2 rounded-lg border transition ${
              voiceOn
                ? 'bg-charcoal-850 border-amber-500/30 text-amber-400 hover:border-amber-400'
                : 'bg-charcoal-900 border-white/10 text-ivory-dark hover:text-ivory'
            }`}
          >
            {voiceOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Replay Welcome Voice / Greeting */}
          <button
            onClick={async () => {
              soundManager.playToggleClick(true);
              await voiceAssistant.replayWelcome(lang);
            }}
            title={lang === 'hi' ? 'स्वागत संदेश दोबारा सुनें' : 'Replay AI Welcome Greeting'}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-charcoal-900 border border-amber-500/20 text-amber-300 hover:border-amber-400 text-xs font-semibold transition"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-hindi">{lang === 'hi' ? 'स्वागत संदेश' : 'Replay Welcome'}</span>
          </button>

          {/* Quick Reset Demo Button */}
          <button
            onClick={resetAllData}
            title={lang === 'hi' ? 'डेटा रीसेट करें' : 'Reset Demo Data'}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-charcoal-900 border border-white/10 text-ivory-dark hover:text-amber-300 transition text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Start Smart Home Demo Button */}
          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 border border-amber-300/40 transition active:scale-95"
          >
            <PlayCircle className="w-4 h-4 fill-charcoal-950 text-amber-500" />
            <span className="font-hindi tracking-wide hidden sm:inline">
              {lang === 'hi' ? 'स्मार्ट डेमो' : 'Start Demo'}
            </span>
            <span className="sm:hidden font-bold">Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
