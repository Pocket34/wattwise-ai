import React from 'react';
import { useEnergy } from '../context/EnergyContext';
import {
  Activity,
  Zap,
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
  Flame,
  Sun,
  Moon,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export const EnergyPulseView: React.FC = () => {
  const { telemetry, appliances, settings, setSimulationMode, lang } = useEnergy();

  const currentMode = settings?.simulation_mode || 'Normal Day';
  const hourlyData = telemetry?.hourlyGraph || [];

  const maxHourWatts = Math.max(...hourlyData.map(d => d.watts), 4000);

  const modes = [
    { id: 'Normal Day', labelHi: 'सामान्य दिन', labelEn: 'Normal Day', desc: 'Standard family routine with evening peak', icon: Sun },
    { id: 'High Usage', labelHi: 'उच्च खपत (Summer)', labelEn: 'High Usage (Summer)', desc: 'Heavy AC, multiple appliances running', icon: Flame },
    { id: 'Vacation Mode', labelHi: 'अवकाश मोड', labelEn: 'Vacation Mode', desc: 'Minimal baseline (Fridge + Standby only)', icon: Moon },
    { id: 'Peak Hour', labelHi: 'पीक ऑवर (7-10 PM)', labelEn: 'Peak Hour (7–10 PM)', desc: 'High tariff window with heavy lighting & entertainment', icon: TrendingUp },
    { id: 'Optimized Home', labelHi: 'अनुकूलित घर', labelEn: 'Optimized Home', desc: 'Eco setpoints, zero vampire load, staggered loads', icon: Sparkles }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              {lang === 'hi' ? 'टेलीमेट्री प्रवाह विश्लेषण' : 'Telemetry Flow Analysis'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-ivory tracking-tight">
            ENERGY PULSE & SIMULATION LAB
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {lang === 'hi'
              ? 'आभासी घर में वास्तविक समय ऊर्जा प्रवाह और घंटे-दर-घंटे खपत'
              : 'Real-time simulated energy telemetry circulating through household circuits'}
          </p>
        </div>

        {/* Live Power Stat Pill */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-charcoal-900 border border-amber-500/20 shadow-inner">
          <div>
            <span className="text-[10px] text-ivory-dark uppercase font-mono block">
              {lang === 'hi' ? 'वर्तमान लोड' : 'Instant Load'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-amber-400">
                {telemetry ? telemetry.currentWatts.toLocaleString() : '---'}
              </span>
              <span className="text-xs font-mono text-amber-300">W</span>
            </div>
          </div>
          <span className="w-px h-8 bg-charcoal-700" />
          <div>
            <span className="text-[10px] text-ivory-dark uppercase font-mono block">
              {lang === 'hi' ? 'दक्षता' : 'Efficiency'}
            </span>
            <span className="text-2xl font-black font-mono text-lime-bright">
              {telemetry ? telemetry.efficiencyScore : '--'}%
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Mode Switcher */}
      <div className="p-5 rounded-3xl glass-card border border-amber-500/25 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ivory">
            {lang === 'hi' ? 'लाइव सिमुलेशन मोड चुनें' : 'Select Live Simulation Scenario'}
          </h3>
          <span className="text-xs font-mono text-amber-400">
            Current: {currentMode}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSimulationMode(m.id)}
                className={`p-3.5 rounded-2xl border text-left transition duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 text-ivory shadow-lg shadow-amber-500/10'
                    : 'bg-charcoal-900/80 border-white/5 text-ivory-dark hover:border-amber-500/30 hover:text-ivory'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-ivory-dark'}`} />
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-lime-bright animate-ping" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ivory font-hindi">
                    {lang === 'hi' ? m.labelHi : m.labelEn}
                  </h4>
                  <p className="text-[10px] text-amber-200/60 mt-1 line-clamp-2">
                    {m.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 24-Hour Load Profile Graph */}
      <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-ivory">
                {lang === 'hi' ? '24 घंटे का लोड प्रोफ़ाइल (घंटे-दर-घंटे)' : '24-Hour Load Profile (Hourly Simulated Watts)'}
              </h3>
            </div>
            <p className="text-xs text-amber-200/60 font-hindi">
              {lang === 'hi'
                ? 'नारंगी पट्टियां शाम के पीक आवर्स (6:00 PM – 10:00 PM) दर्शाती हैं'
                : 'Amber highlights indicate high-tariff evening peak hours (18:00 – 22:00)'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500" />
              <span className="text-ivory-dark">Peak Hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-charcoal-700 border border-amber-500/30" />
              <span className="text-ivory-dark">Base Load</span>
            </div>
          </div>
        </div>

        {/* Custom Responsive SVG / HTML Bar Chart */}
        <div className="pt-4 pb-2">
          <div className="h-56 flex items-end gap-1 sm:gap-2">
            {hourlyData.map((d) => {
              const heightPct = Math.round((d.watts / maxHourWatts) * 100);
              return (
                <div key={d.hour} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-charcoal-900 border border-amber-500/40 text-[10px] text-ivory py-1 px-2 rounded-lg shadow-xl font-mono whitespace-nowrap pointer-events-none">
                    <span className="font-bold text-amber-300">{d.hour}: {d.watts}W</span>
                    <span className="text-lime-bright">Est: ₹{d.costRate}/hr</span>
                  </div>

                  {/* The Bar */}
                  <div
                    style={{ height: `${Math.max(6, heightPct)}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      d.isCurrent
                        ? 'bg-gradient-to-t from-lime-500 to-lime-300 shadow-lg shadow-lime-500/30'
                        : d.isPeak
                        ? 'bg-gradient-to-t from-amber-600 to-amber-400 group-hover:from-amber-500 group-hover:to-amber-300'
                        : 'bg-charcoal-700/80 border border-white/5 group-hover:bg-charcoal-600'
                    }`}
                  />

                  {/* Hour Label */}
                  <span className="text-[9px] sm:text-[10px] text-ivory-dark font-mono mt-2 truncate w-full text-center">
                    {d.hourNum % 4 === 0 ? d.hour.split(':')[0] : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Virtual Home: Room-by-Room Power Flow */}
      <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-ivory">
              {lang === 'hi' ? 'कमरे के अनुसार ऊर्जा वितरण' : 'Room-by-Room Power Flow Distribution'}
            </h3>
            <p className="text-xs text-amber-200/60 font-hindi">
              {lang === 'hi' ? 'सक्रिय उपकरणों का कमरा-वार लोड विभाजन' : 'Live power drawn across household living zones'}
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full copper-badge">
            {appliances.length} Devices Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {telemetry?.roomContributions.map((room) => {
            const pct = telemetry.currentWatts > 0 ? Math.round((room.watts / telemetry.currentWatts) * 100) : 0;
            return (
              <div key={room.room} className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-ivory truncate">{room.room}</span>
                  <span className="text-xs font-mono font-bold text-amber-300">{pct}%</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-xl font-black font-mono text-ivory">{room.watts}</span>
                  <span className="text-[10px] font-mono text-ivory-dark">Watts</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-charcoal-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-copper-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
