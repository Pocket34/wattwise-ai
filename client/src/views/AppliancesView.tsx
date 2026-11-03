import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { Appliance } from '../types';
import {
  Cpu,
  Power,
  Clock,
  Sliders,
  Check,
  X,
  Sparkles,
  Shield,
  Zap,
  IndianRupee,
  Calendar,
  AlertCircle,
  Home,
  Radio,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  History
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';
import { HomeEnergyMap } from '../components/HomeEnergyMap';

export const AppliancesView: React.FC = () => {
  const {
    appliances,
    toggleAppliance,
    updateApplianceDetails,
    addAppliance,
    deleteAppliance,
    setApplianceSpeed,
    setApplianceBrightness,
    setApplianceTemp,
    setIsBridgeModalOpen,
    setNavSection,
    lang,
    telemetry
  } = useEnergy();

  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedAppliance, setSelectedAppliance] = useState<Appliance | null>(null);

  // Add Appliance state
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [newAppName, setNewAppName] = useState<string>('');
  const [newAppRoom, setNewAppRoom] = useState<string>('Living Room');
  const [newAppWatts, setNewAppWatts] = useState<number>(100);
  const [newAppHours, setNewAppHours] = useState<number>(4);
  const [newAppCategory, setNewAppCategory] = useState<string>('general');
  const [newAppEfficiency, setNewAppEfficiency] = useState<string>('5-Star BEE');

  // Form states for the detail modal
  const [editWatts, setEditWatts] = useState<number>(100);
  const [editHours, setEditHours] = useState<number>(4);
  const [editTemp, setEditTemp] = useState<number>(24);
  const [editSchedStart, setEditSchedStart] = useState<string>('00:00');
  const [editSchedEnd, setEditSchedEnd] = useState<string>('00:00');
  const [editSchedEnabled, setEditSchedEnabled] = useState<boolean>(false);
  const [editPriority, setEditPriority] = useState<boolean>(false);

  const handleCreateAppliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    await addAppliance({
      name: newAppName.trim(),
      name_hi: newAppName.trim(),
      room: newAppRoom,
      power_watts: newAppWatts,
      daily_hours: newAppHours,
      category: newAppCategory,
      efficiency_rating: newAppEfficiency
    });

    setIsAddOpen(false);
    setNewAppName('');
  };

  const openApplianceModal = (app: Appliance) => {
    setSelectedAppliance(app);
    setEditWatts(app.power_watts);
    setEditHours(app.daily_hours);
    setEditTemp(app.temp_setpoint || 24);
    setEditSchedStart(app.schedule_start || '00:00');
    setEditSchedEnd(app.schedule_end || '00:00');
    setEditSchedEnabled(app.schedule_enabled === 1);
    setEditPriority(app.is_priority === 1);
  };

  const handleSaveModal = async () => {
    if (!selectedAppliance) return;
    await updateApplianceDetails(selectedAppliance.id, {
      power_watts: editWatts,
      daily_hours: editHours,
      temp_setpoint: editTemp,
      schedule_start: editSchedStart,
      schedule_end: editSchedEnd,
      schedule_enabled: editSchedEnabled ? 1 : 0,
      is_priority: editPriority ? 1 : 0
    });
    setSelectedAppliance(null);
  };

  const tariffRate = telemetry?.effectiveTariff || 8.0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner: Smart Home Bridge Callout */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-charcoal-900 via-charcoal-900/90 to-charcoal-950 border border-amber-500/35 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-copper-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400">
                {lang === 'hi' ? 'स्मार्ट होम ब्रिज' : 'Smart Home Device Connect'}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-bright border border-lime-500/30 font-mono">
                Matter • Google Home • Local Demo
              </span>
            </div>
            <h3 className="text-sm font-bold text-ivory">
              {lang === 'hi' ? 'स्मार्ट डिवाइस कनेक्ट केंद्र एवं स्वचालित नियंत्रण' : 'Connect Smart Protocols or Test Simulated Fleet'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBridgeModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 text-ivory border border-white/10 text-xs font-semibold transition"
          >
            {lang === 'hi' ? 'प्रोटोकॉल जोड़ें' : 'Bridge Setup'}
          </button>
          <button
            onClick={() => setNavSection('bridge')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95"
          >
            <span>{lang === 'hi' ? 'स्मार्ट होम ब्रिज खोलें' : 'Open Bridge Hub'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Header & View Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              {lang === 'hi' ? 'उपकरण टेलीमेट्री केंद्र' : 'Smart Appliance Fleet'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-ivory tracking-tight">
            HOUSEHOLD APPLIANCES ({appliances.length})
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {lang === 'hi'
              ? 'प्रत्येक उपकरण का पावर, शेड्यूल और प्रायोरिटी कॉन्फ़िगर करें'
              : 'Interactive smart plugs: configure simulated wattage, schedules, and priority rules'}
          </p>
        </div>

        {/* View Switch: Grid vs Home Map */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-charcoal-900 border border-white/10 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => {
                soundManager.playNavTick();
                setViewMode('grid');
              }}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-charcoal-950 shadow-md'
                  : 'text-ivory-dark hover:text-ivory'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'ग्रिड व्यू' : 'Fleet Grid'}</span>
            </button>
            <button
              onClick={() => {
                soundManager.playNavTick();
                setViewMode('map');
              }}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                viewMode === 'map'
                  ? 'bg-amber-500 text-charcoal-950 shadow-md'
                  : 'text-ivory-dark hover:text-ivory'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'होम एनर्जी मैप' : 'Home Energy Map'}</span>
            </button>
          </div>

          <div className="text-xs font-mono text-ivory-dark px-3 py-2 rounded-xl bg-charcoal-900 border border-white/10">
            {appliances.filter((a) => a.is_on === 1).length} / {appliances.length} {lang === 'hi' ? 'सक्रिय' : 'Active'}
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-charcoal-950" />
            <span>{lang === 'hi' ? 'उपकरण जोड़ें' : 'Add Appliance'}</span>
          </button>
        </div>
      </div>

      {/* Conditionally Render Home Energy Map or Fleet Grid */}
      {viewMode === 'map' ? (
        <HomeEnergyMap />
      ) : (
        /* Grid of Appliances */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {appliances.map((app) => {
            const dailyKwh = ((app.is_on ? app.power_watts * app.daily_hours : 0) / 1000).toFixed(2);
            const dailyCost = Math.round(parseFloat(dailyKwh) * tariffRate);
            const isDemo = app.connection_type === 'demo';
            const connTypeBadge =
              app.connection_type === 'matter'
                ? 'Matter'
                : app.connection_type === 'google_home'
                ? 'Google Home'
                : app.connection_type === 'cloud'
                ? 'Cloud'
                : 'Demo Device';

            return (
              <div
                key={app.id}
                className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                  app.is_on
                    ? 'bg-charcoal-900/90 border-amber-500/30 hover:border-amber-400 shadow-lg shadow-amber-500/5'
                    : 'bg-charcoal-950/80 border-white/5 opacity-65 hover:opacity-90 hover:border-white/20'
                }`}
                onClick={() => openApplianceModal(app)}
              >
                <div>
                  {/* Card Top: Status & Toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          app.is_on
                            ? 'bg-lime-500/20 text-lime-bright border border-lime-500/30'
                            : 'bg-charcoal-800 text-ivory-dark border border-white/5'
                        }`}
                      >
                        {app.is_on ? 'ONLINE' : 'STANDBY'}
                      </span>
                      <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-charcoal-800 text-amber-300/80 border border-white/5">
                        {connTypeBadge}
                      </span>
                    </div>

                    {/* Toggle button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAppliance(app.id);
                      }}
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                        app.is_on ? 'bg-amber-500' : 'bg-charcoal-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-charcoal-950 shadow transform transition-transform duration-200 ease-in-out ${
                          app.is_on ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Appliance Name & Room */}
                  <h3 className="text-sm font-bold text-ivory group-hover:text-amber-300 transition line-clamp-1">
                    {lang === 'hi' ? app.name_hi : app.name}
                  </h3>
                  <p className="text-[11px] text-ivory-dark mt-0.5">
                    {app.room}
                  </p>

                  {/* Efficiency Badge */}
                  <div className="mt-2 text-[10px] text-amber-300/80 font-mono bg-charcoal-850 px-2 py-0.5 rounded-md inline-block border border-white/5">
                    {app.efficiency_rating}
                  </div>

                  {/* Quick Inline Controls for AC, Fan, Lights */}
                  {app.id === 'ac' && (
                    <div
                      className="mt-3 pt-2 border-t border-white/5 space-y-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-ivory-dark">Temp</span>
                        <span className="text-lime-bright font-bold">{app.temp_setpoint || 24}°C</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setApplianceTemp('ac', Math.max(18, (app.temp_setpoint || 24) - 1))}
                          className="px-2 py-0.5 rounded bg-charcoal-800 text-ivory font-mono text-xs hover:bg-charcoal-700"
                        >
                          -
                        </button>
                        <input
                          type="range"
                          min="18"
                          max="28"
                          step="1"
                          value={app.temp_setpoint || 24}
                          onChange={(e) => setApplianceTemp('ac', Number(e.target.value))}
                          className="w-full accent-lime-500 cursor-pointer h-1.5"
                        />
                        <button
                          onClick={() => setApplianceTemp('ac', Math.min(28, (app.temp_setpoint || 24) + 1))}
                          className="px-2 py-0.5 rounded bg-charcoal-800 text-ivory font-mono text-xs hover:bg-charcoal-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {app.id === 'fan' && (
                    <div
                      className="mt-3 pt-2 border-t border-white/5 space-y-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-ivory-dark">Speed</span>
                        <span className="text-amber-300 font-bold">{app.device_speed || 4}/5</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            onClick={() => setApplianceSpeed('fan', s)}
                            className={`py-0.5 text-[9px] font-mono rounded font-bold transition ${
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

                  {app.id === 'lights' && (
                    <div
                      className="mt-3 pt-2 border-t border-white/5 space-y-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between text-[10px] font-mono">
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
                        className="w-full accent-amber-500 cursor-pointer h-1.5"
                      />
                    </div>
                  )}
                </div>

                {/* Card Bottom: Metrics */}
                <div className="pt-3 mt-3 border-t border-white/5 space-y-1 text-xs">
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-ivory-dark">{lang === 'hi' ? 'पावर' : 'Power'}</span>
                    <span className="font-bold text-amber-300">
                      {app.power_watts} W
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-ivory-dark">{lang === 'hi' ? 'दैनिक खर्च' : 'Daily Est.'}</span>
                    <span className="font-bold text-ivory">
                      ₹{dailyCost}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-[10px] text-ivory-dark font-mono">
                    <span>{app.daily_hours}h / day</span>
                    {app.is_priority === 1 && (
                      <span className="text-lime-bright font-bold">Priority</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appliance Detail Modal */}
      {selectedAppliance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-charcoal-900 border border-amber-500/35 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-amber-400 font-bold">
                  {selectedAppliance.category} • {selectedAppliance.room}
                </span>
                <h2 className="text-lg font-bold text-ivory mt-0.5 font-hindi">
                  {lang === 'hi' ? selectedAppliance.name_hi : selectedAppliance.name}
                </h2>
                <p className="text-xs text-ivory-dark font-mono">
                  {selectedAppliance.efficiency_rating} • {(selectedAppliance.connection_type || 'demo').toUpperCase()}
                </p>
              </div>

              <button
                onClick={() => setSelectedAppliance(null)}
                className="p-2 rounded-xl bg-charcoal-800 text-ivory hover:bg-charcoal-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slider 1: Simulated Power Draw */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-charcoal-950/60 border border-white/5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-ivory-dark">{lang === 'hi' ? 'रेटेड पावर (Watts)' : 'Operating Power'}</span>
                <span className="text-amber-300 font-bold text-sm">{editWatts} W</span>
              </div>
              <input
                type="range"
                min="20"
                max="3000"
                step="10"
                value={editWatts}
                onChange={(e) => setEditWatts(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* If AC: Temperature Setpoint */}
            {selectedAppliance.id === 'ac' && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-charcoal-950/60 border border-white/5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-ivory-dark">{lang === 'hi' ? 'तापमान सेटिंग (°C)' : 'AC Temperature Setpoint'}</span>
                  <span className="text-lime-bright font-bold text-sm">{editTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="28"
                  step="1"
                  value={editTemp}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    setEditTemp(t);
                    const baseW = 1450;
                    const delta = 22 - t;
                    setEditWatts(Math.round(baseW * (1 + delta * 0.06)));
                  }}
                  className="w-full accent-lime-500 cursor-pointer"
                />
                <p className="text-[10px] text-amber-200/70 font-hindi">
                  {editTemp < 24
                    ? (lang === 'hi' ? 'सुझाव: 24°C सेट करने पर लगभग 12-18% ऊर्जा की सीधी बचत होगी।' : 'Recommendation: 24°C saves ~12-18% energy.')
                    : (lang === 'hi' ? 'अनुकूलित इको-मोड तापमान सक्रिय है।' : 'Optimal eco comfort setpoint active.')}
                </p>
              </div>
            )}

            {/* Slider 2: Daily Hours */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-charcoal-950/60 border border-white/5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-ivory-dark">{lang === 'hi' ? 'दैनिक उपयोग (घंटे)' : 'Daily Operating Hours'}</span>
                <span className="text-ivory font-bold text-sm">{editHours} hrs/day</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="24"
                step="0.5"
                value={editHours}
                onChange={(e) => setEditHours(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Schedule & Priority Options */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-charcoal-950/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ivory font-hindi">{lang === 'hi' ? 'स्मार्ट शेड्यूल' : 'Smart Schedule'}</span>
                  <input
                    type="checkbox"
                    checked={editSchedEnabled}
                    onChange={(e) => setEditSchedEnabled(e.target.checked)}
                    className="accent-amber-500 cursor-pointer rounded"
                  />
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <input
                    type="time"
                    value={editSchedStart}
                    disabled={!editSchedEnabled}
                    onChange={(e) => setEditSchedStart(e.target.value)}
                    className="bg-charcoal-850 border border-white/10 rounded px-1.5 py-0.5 text-ivory w-full disabled:opacity-40"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={editSchedEnd}
                    disabled={!editSchedEnabled}
                    onChange={(e) => setEditSchedEnd(e.target.value)}
                    className="bg-charcoal-850 border border-white/10 rounded px-1.5 py-0.5 text-ivory w-full disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-charcoal-950/60 border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="font-semibold text-ivory font-hindi block">{lang === 'hi' ? 'प्राथमिकता उपकरण' : 'Essential Priority'}</span>
                  <p className="text-[10px] text-ivory-dark mt-0.5 font-hindi">
                    {lang === 'hi' ? 'पीक शेडिंग में बंद न करें' : 'Never shed in rules'}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-mono text-amber-300">
                    {editPriority ? 'Protected' : 'Standard'}
                  </span>
                  <input
                    type="checkbox"
                    checked={editPriority}
                    onChange={(e) => setEditPriority(e.target.checked)}
                    className="accent-amber-500 cursor-pointer rounded"
                  />
                </div>
              </div>
            </div>

            {/* Appliance Usage History */}
            <div className="p-3.5 rounded-2xl bg-charcoal-950/70 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ivory flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>7-Day Estimated Usage History</span>
                </span>
                <span className="text-[10px] font-mono text-lime-bright">
                  ~{((selectedAppliance.power_watts * selectedAppliance.daily_hours * 7) / 1000).toFixed(1)} kWh total
                </span>
              </div>
              <div className="flex items-end gap-1.5 h-12 pt-1">
                {[65, 80, 70, 90, 85, 95, 100].map((pct, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-full rounded bg-amber-500/40 hover:bg-amber-400 transition"
                    />
                    <span className="text-[9px] text-ivory-dark font-mono">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Save & Remove Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Remove "${selectedAppliance.name}" from your smart home?`)) {
                    await deleteAppliance(selectedAppliance.id);
                    setSelectedAppliance(null);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppliance(null)}
                  className="px-4 py-2.5 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 text-xs text-ivory transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95"
                >
                  <Check className="w-4 h-4 text-charcoal-950" />
                  <span>{lang === 'hi' ? 'परिवर्तन सुरक्षित करें' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Appliance Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-charcoal-900 border border-amber-500/35 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ivory">
                    {lang === 'hi' ? 'नया स्मार्ट उपकरण जोड़ें' : 'Add New Appliance'}
                  </h3>
                  <p className="text-xs text-ivory-dark font-hindi">
                    {lang === 'hi' ? 'अपने स्मार्ट होम ग्रिड में नया डिवाइस पंजीकृत करें' : 'Register a new smart device to your home energy profile'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-xl bg-charcoal-800 text-ivory hover:bg-charcoal-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppliance} className="space-y-4 text-xs">
              <div>
                <label className="block text-ivory-dark font-semibold mb-1">Appliance Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Air Purifier, Home Server, Dishwasher"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full bg-charcoal-850 border border-white/10 rounded-xl px-3 py-2 text-ivory focus:border-amber-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ivory-dark font-semibold mb-1">Room</label>
                  <select
                    value={newAppRoom}
                    onChange={(e) => setNewAppRoom(e.target.value)}
                    className="w-full bg-charcoal-850 border border-white/10 rounded-xl px-3 py-2 text-ivory focus:border-amber-400 outline-none"
                  >
                    <option value="Living Room">Living Room</option>
                    <option value="Master Bedroom">Master Bedroom</option>
                    <option value="Modular Kitchen">Modular Kitchen</option>
                    <option value="Master Bathroom">Master Bathroom</option>
                    <option value="Home Office">Home Office</option>
                    <option value="Utility Balcony">Utility Balcony</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ivory-dark font-semibold mb-1">Category</label>
                  <select
                    value={newAppCategory}
                    onChange={(e) => setNewAppCategory(e.target.value)}
                    className="w-full bg-charcoal-850 border border-white/10 rounded-xl px-3 py-2 text-ivory focus:border-amber-400 outline-none"
                  >
                    <option value="HVAC">Climate / HVAC</option>
                    <option value="Kitchen">Kitchen Appliances</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Workstation">Workstation / Compute</option>
                    <option value="Lighting">Lighting</option>
                    <option value="general">General Smart Plug</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ivory-dark font-semibold mb-1">Power Draw (Watts)</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={newAppWatts}
                    onChange={(e) => setNewAppWatts(parseInt(e.target.value) || 0)}
                    className="w-full bg-charcoal-850 border border-white/10 rounded-xl px-3 py-2 text-ivory focus:border-amber-400 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-ivory-dark font-semibold mb-1">Daily Usage (Hours)</label>
                  <input
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={newAppHours}
                    onChange={(e) => setNewAppHours(parseFloat(e.target.value) || 1)}
                    className="w-full bg-charcoal-850 border border-white/10 rounded-xl px-3 py-2 text-ivory focus:border-amber-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ivory-dark font-semibold mb-1">Efficiency Rating</label>
                <select
                  value={newAppEfficiency}
                  onChange={(e) => setNewAppEfficiency(e.target.value)}
                  className="w-full bg-charcoal-850 border border-white/10 rounded-xl px-3 py-2 text-ivory focus:border-amber-400 outline-none"
                >
                  <option value="5-Star BEE Inverter">5-Star BEE Inverter</option>
                  <option value="4-Star BEE High Efficiency">4-Star BEE High Efficiency</option>
                  <option value="3-Star BEE Standard">3-Star BEE Standard</option>
                  <option value="BLDC High Efficiency">BLDC High Efficiency</option>
                  <option value="Energy Star Certified">Energy Star Certified</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 text-ivory text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs shadow-md shadow-amber-500/25"
                >
                  <Plus className="w-4 h-4 text-charcoal-950" />
                  <span>Register Appliance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
