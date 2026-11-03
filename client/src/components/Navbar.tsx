import React, { useState, useRef, useEffect } from 'react';
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
  RotateCcw,
  Bell,
  User,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  Settings,
  Target,
  ExternalLink,
  Layers
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
    setIsBridgeModalOpen,
    resetAllData,
    integrationMode,
    leaks,
    recentActivity,
    setNavSection,
    providerStatuses
  } = useEnergy();

  const [notificationOpen, setNotificationOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [statusOpen, setStatusOpen] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const soundOn = settings?.sound_enabled !== 'false';
  const voiceOn = settings?.voice_enabled !== 'false';

  const activeLeaks = (leaks || []).filter(l => l.status === 'active');
  const unreadCount = activeLeaks.length + Math.min(3, (recentActivity || []).length);

  const formatLogTime = (ts?: string) => {
    if (!ts) return 'Just now';
    if (ts.includes('T')) {
      try {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch {
        // Fallback below
      }
    }
    const parts = ts.split(' ');
    return parts[1] || parts[0] || 'Today';
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-charcoal-950/90 backdrop-blur-md px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Mobile Toggle + Logo + Tagline */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg bg-charcoal-850 border border-white/10 text-ivory hover:text-amber-400 transition"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => setNavSection('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 border border-amber-400/40">
              <Zap className="w-6 h-6 text-charcoal-950 fill-charcoal-950" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-electric"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-ivory">
                  WATTWISE <span className="text-amber-400 font-black">AI</span>
                </span>

                {/* Connection Status Pill with Dropdown Trigger */}
                <div className="relative" ref={statusRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusOpen(!statusOpen);
                    }}
                    className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border transition hover:opacity-90 ${
                      integrationMode === 'LIVE'
                        ? 'bg-lime-500/20 text-lime-bright border-lime-500/40'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${integrationMode === 'LIVE' ? 'bg-lime-bright animate-ping' : 'bg-amber-400'}`} />
                    <span>{integrationMode === 'LIVE' ? 'LIVE' : 'DEMO'}</span>
                    <ChevronDown className="w-2.5 h-2.5 opacity-70" />
                  </button>

                  {/* Status Dropdown Popover */}
                  {statusOpen && (
                    <div className="absolute left-0 top-full mt-2 w-64 p-3 rounded-2xl bg-charcoal-900 border border-amber-500/30 shadow-2xl z-50 animate-fade-in text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                        <span className="font-bold text-ivory">Connection Center</span>
                        <span className="font-mono text-[10px] text-amber-400">{integrationMode} MODE</span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-charcoal-850">
                          <span className="text-ivory-dark">Deterministic Engine:</span>
                          <span className="text-lime-bright font-mono font-semibold">Active (5s sync)</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-charcoal-850">
                          <span className="text-ivory-dark">Google HomeGraph:</span>
                          <span className="text-amber-300 font-mono font-semibold">Testing Mode</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-charcoal-850">
                          <span className="text-ivory-dark">Matter / MQTT:</span>
                          <span className="text-ivory-dark font-mono">Available</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setStatusOpen(false);
                          setNavSection('bridge');
                        }}
                        className="w-full mt-2 py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-center block transition text-[11px]"
                      >
                        Open Smart Home Bridge →
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[11px] font-medium text-amber-200/70 tracking-wide font-hindi truncate max-w-[190px] sm:max-w-none">
                {lang === 'hi' ? 'समझदार घर • कम बिल • बेहतर कल' : 'Smarter Home • Lower Bills • Better Planet'}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Telemetry Indicator */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full bg-charcoal-900 border border-amber-500/20 shadow-inner text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-lime-bright animate-pulse" />
            <span className="text-ivory-dark font-medium">
              {lang === 'hi' ? 'लाइव लोड:' : 'Live Load:'}
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

        {/* Right: Notification Center + Language + Sound + Profile + Demo */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Notification Center */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-2 rounded-lg bg-charcoal-900 border border-white/10 text-ivory-dark hover:text-amber-300 hover:border-amber-500/30 transition"
              title="Notification Center"
              aria-label="Notification Center"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 p-4 rounded-3xl bg-charcoal-900/95 border border-amber-500/30 backdrop-blur-xl shadow-2xl z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-xs text-ivory">Notification Center</h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                    {activeLeaks.length} Alerts
                  </span>
                </div>

                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                  {activeLeaks.length > 0 ? (
                    activeLeaks.map(leak => (
                      <div
                        key={leak.id}
                        onClick={() => {
                          setNotificationOpen(false);
                          setNavSection('leaks');
                        }}
                        className="p-2.5 rounded-xl bg-charcoal-850 border border-rose-500/20 hover:border-rose-500/50 cursor-pointer transition flex items-start gap-2.5"
                      >
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-ivory truncate">{lang === 'hi' ? leak.title_hi : leak.title}</p>
                          <p className="text-[10px] text-ivory-dark mt-0.5">
                            Waste: {leak.waste_kwh_daily} kWh/day (~₹{leak.waste_cost_daily})
                          </p>
                        </div>
                        <span className="text-[9px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                          Critical
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-ivory-dark">
                      <CheckCircle className="w-5 h-5 text-lime-bright mx-auto mb-1" />
                      All household circuits optimized!
                    </div>
                  )}

                  {recentActivity.slice(0, 3).map(act => (
                    <div
                      key={act.id}
                      className="p-2 rounded-xl bg-charcoal-850/60 border border-white/5 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-ivory-dark truncate max-w-[200px]">
                        {lang === 'hi' ? act.message_hi : act.message}
                      </span>
                      <span className="text-[9px] font-mono text-amber-400 shrink-0">
                        {formatLogTime(act.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => {
                      setNotificationOpen(false);
                      setNavSection('leaks');
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    View All Energy Leaks →
                  </button>
                  <button
                    onClick={() => setNotificationOpen(false)}
                    className="text-ivory-dark hover:text-ivory"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-charcoal-900 border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition ${
                lang === 'hi'
                  ? 'bg-amber-500 text-charcoal-950 shadow-sm shadow-amber-500/30'
                  : 'text-ivory-dark hover:text-ivory'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition ${
                lang === 'en'
                  ? 'bg-amber-500 text-charcoal-950 shadow-sm shadow-amber-500/30'
                  : 'text-ivory-dark hover:text-ivory'
              }`}
            >
              EN
            </button>
          </div>

          {/* Sound FX Toggle */}
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

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-charcoal-900 border border-white/10 hover:border-amber-500/30 transition"
              title="User Profile"
              aria-label="User Profile"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 text-charcoal-950 flex items-center justify-center font-bold text-xs shadow-sm">
                AS
              </div>
              <span className="hidden xl:inline text-xs font-semibold text-ivory">Aarav S.</span>
              <ChevronDown className="w-3 h-3 text-ivory-dark hidden sm:inline" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 p-4 rounded-3xl bg-charcoal-900/95 border border-amber-500/30 backdrop-blur-xl shadow-2xl z-50 animate-fade-in text-xs">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-charcoal-950 flex items-center justify-center font-black text-sm">
                    AS
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-ivory">Aarav Sharma</h4>
                    <p className="text-[11px] text-amber-300 font-mono">3 BHK Eco-Apartment</p>
                    <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-lime-500/20 text-lime-bright border border-lime-500/30">
                      Tier: Eco Guardian
                    </span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setNavSection('settings');
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-charcoal-850 text-ivory-dark hover:text-ivory transition"
                  >
                    <Settings className="w-4 h-4 text-amber-400" />
                    <span>Account & Preferences</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setNavSection('goals');
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-charcoal-850 text-ivory-dark hover:text-ivory transition"
                  >
                    <Target className="w-4 h-4 text-lime-bright" />
                    <span>Active Energy Goals</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setNavSection('bridge');
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-charcoal-850 text-ivory-dark hover:text-ivory transition"
                  >
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span>Smart Home Bridge</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      resetAllData();
                    }}
                    className="text-ivory-dark hover:text-rose-400 transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Home Data</span>
                  </button>
                  <span className="text-[10px] text-amber-400/60 font-mono">v1.0 Pro</span>
                </div>
              </div>
            )}
          </div>

          {/* Start Smart Home Demo Button */}
          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs shadow-md shadow-amber-500/25 border border-amber-300/40 transition active:scale-95"
          >
            <PlayCircle className="w-4 h-4 fill-charcoal-950 text-amber-500" />
            <span className="font-hindi tracking-wide hidden sm:inline">
              {lang === 'hi' ? 'डेमो शुरू' : 'Start Demo'}
            </span>
            <span className="sm:hidden font-bold">Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
