import React from 'react';
import { useEnergy } from '../context/EnergyContext';
import {
  Zap,
  Activity,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Flame,
  Moon,
  Sun,
  Home
} from 'lucide-react';

export const EnergyPulseHero: React.FC = () => {
  const {
    telemetry,
    appliances,
    settings,
    setSimulationMode,
    lang
  } = useEnergy();

  const currentWatts = telemetry?.currentWatts || 0;
  const currentMode = settings?.simulation_mode || 'Normal Day';
  const activeAppliances = appliances.filter(a => a.is_on === 1);
  const activeCount = activeAppliances.length;
  const efficiency = telemetry?.efficiencyScore || 85;

  // Dynamic pulse intensity style based on live load
  let pulseSpeedClass = 'animate-heart-pulse';
  let glowColor = 'rgba(245, 158, 11, 0.35)'; // Amber
  let statusText = lang === 'hi' ? 'सामान्य ऊर्जा संतुलन' : 'Balanced Household Load';

  if (currentWatts > 3000) {
    pulseSpeedClass = 'animate-heart-pulse-fast';
    glowColor = 'rgba(239, 68, 68, 0.45)'; // High load alert glow
    statusText = lang === 'hi' ? 'उच्च पीक लोड सर्ज (>3 kW)' : 'High Load Surge Detected (>3 kW)';
  } else if (currentWatts < 1200) {
    pulseSpeedClass = 'animate-heart-pulse-calm';
    glowColor = 'rgba(132, 204, 22, 0.35)'; // Eco Lime
    statusText = lang === 'hi' ? 'अनुकूलित इको-मोड' : 'Optimized Eco Rhythm';
  }

  const modes = [
    { id: 'Normal Day', labelHi: 'सामान्य दिन', labelEn: 'Normal Day', icon: Sun },
    { id: 'High Usage', labelHi: 'उच्च खपत', labelEn: 'High Usage', icon: Flame },
    { id: 'Vacation Mode', labelHi: 'अवकाश मोड', labelEn: 'Vacation Mode', icon: Moon },
    { id: 'Peak Hour', labelHi: 'पीक ऑवर (7-10 PM)', labelEn: 'Peak Hour', icon: TrendingUp },
    { id: 'Optimized Home', labelHi: 'अनुकूलित घर', labelEn: 'Optimized Home', icon: Sparkles }
  ];

  return (
    <div className="relative rounded-3xl glass-card p-6 lg:p-8 overflow-hidden mb-8 border border-amber-500/25">
      {/* Background radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-1000"
        style={{ background: glowColor }}
      />

      {/* Header bar within the pulse card */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              {lang === 'hi' ? 'जीवंत ऊर्जा धड़कन' : 'Living Energy Heartbeat'}
            </h2>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-ivory tracking-tight">
            HOME ENERGY PULSE
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {statusText}
          </p>
        </div>

        {/* Live Simulation Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-charcoal-900/90 border border-white/10 self-stretch sm:self-auto overflow-x-auto">
          {modes.map(m => {
            const Icon = m.icon;
            const isSelected = currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSimulationMode(m.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                  isSelected
                    ? 'bg-amber-500 text-charcoal-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-ivory-dark hover:text-ivory hover:bg-charcoal-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="font-hindi">{lang === 'hi' ? m.labelHi : m.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Living Heartbeat Visualizer */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-4">
        {/* Central Pulse Sphere */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
            {/* Outer Concentric Animated Pulse Rings */}
            <div
              className={`absolute inset-0 rounded-full border border-amber-500/20 ${pulseSpeedClass}`}
              style={{ transform: 'scale(1.15)' }}
            />
            <div
              className={`absolute inset-4 rounded-full border border-copper-500/30 ${pulseSpeedClass}`}
              style={{ animationDelay: '0.4s' }}
            />
            <div
              className={`absolute inset-8 rounded-full border border-amber-400/40 ${pulseSpeedClass}`}
              style={{ animationDelay: '0.8s' }}
            />

            {/* Inner Core Glass Orb */}
            <div className="relative flex flex-col items-center justify-center w-48 h-48 rounded-full bg-gradient-to-br from-charcoal-850 via-charcoal-900 to-charcoal-950 border-2 border-amber-400/60 shadow-2xl shadow-amber-500/30 p-4 text-center">
              <Zap className="w-6 h-6 text-amber-400 mb-1 fill-amber-400" />
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-ivory">
                {currentWatts.toLocaleString()}
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                WATTS
              </span>
              <div className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold copper-badge">
                {activeCount} {lang === 'hi' ? 'सक्रिय उपकरण' : 'Active Devices'}
              </div>
            </div>

            {/* Orbiting Appliance Satellites */}
            {activeAppliances.slice(0, 4).map((app, idx) => {
              const angles = [0, 90, 180, 270];
              const angle = (angles[idx] * Math.PI) / 180;
              const radius = 120;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <div
                  key={app.id}
                  className="absolute hidden sm:flex flex-col items-center justify-center px-2 py-1 rounded-lg bg-charcoal-900/90 border border-amber-500/40 text-[10px] text-ivory shadow-lg font-mono pointer-events-none transition-all duration-700"
                  style={{
                    transform: `translate(${x}px, ${y}px)`
                  }}
                >
                  <span className="text-amber-300 font-bold truncate max-w-[80px]">
                    {(app.name || 'Device').split(' ')[0]}
                  </span>
                  <span className="text-lime-bright text-[9px] font-bold">
                    {app.power_watts || 0}W
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Telemetry Statistics Grid */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Today's Consumption */}
          <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-amber-500/15">
            <span className="text-xs text-ivory-dark block font-hindi">
              {lang === 'hi' ? 'आज की कुल खपत' : "Today's Consumption"}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-ivory font-mono">
                {telemetry ? telemetry.todayKwh : '--'}
              </span>
              <span className="text-xs font-mono text-amber-300">kWh</span>
            </div>
            <p className="text-[10px] text-amber-200/60 mt-1 font-mono">
              ~{(telemetry ? telemetry.todayKwh * 30 : 0).toFixed(0)} kWh {lang === 'hi' ? 'मासिक अनुमान' : 'projected/mo'}
            </p>
          </div>

          {/* Card 2: Today's Estimated Cost */}
          <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-amber-500/15">
            <span className="text-xs text-ivory-dark block font-hindi">
              {lang === 'hi' ? 'आज का अनुमानित खर्च' : "Today's Est. Cost"}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-amber-400 font-mono">
                ₹{telemetry ? telemetry.todayCost : '--'}
              </span>
            </div>
            <p className="text-[10px] text-amber-200/60 mt-1 font-mono">
              @ ₹{telemetry?.effectiveTariff} / unit {telemetry ? '(Slab)' : ''}
            </p>
          </div>

          {/* Card 3: Efficiency Score */}
          <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-amber-500/15">
            <span className="text-xs text-ivory-dark block font-hindi">
              {lang === 'hi' ? 'घर की दक्षता स्कोर' : 'Efficiency Score'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black font-mono ${efficiency >= 85 ? 'text-lime-electric' : 'text-amber-400'}`}>
                {efficiency}%
              </span>
            </div>
            <p className="text-[10px] text-amber-200/60 mt-1 font-hindi">
              {efficiency >= 85 ? (lang === 'hi' ? 'उत्कृष्ट श्रेणी' : 'Optimal range') : (lang === 'hi' ? 'सुधार संभव' : 'Potential waste detected')}
            </p>
          </div>

          {/* Card 4: Potential Savings Today */}
          <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-amber-500/15">
            <span className="text-xs text-ivory-dark block font-hindi">
              {lang === 'hi' ? 'आज की बचत क्षमता' : 'Potential Savings Today'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-lime-bright font-mono">
                ₹{telemetry ? telemetry.potentialSavingsTodayCost : '--'}
              </span>
              <span className="text-xs font-mono text-lime-400">/day</span>
            </div>
            <p className="text-[10px] text-lime-400/80 mt-1 font-mono">
              ~₹{telemetry ? telemetry.potentialSavingsTodayCost * 30 : 0} / month
            </p>
          </div>

          {/* Card 5: Standby Vampire Load */}
          <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-amber-500/15">
            <span className="text-xs text-ivory-dark block font-hindi">
              {lang === 'hi' ? 'वैम्पायर स्टैंडबाय लोड' : 'Vampire Standby Draw'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black font-mono ${(telemetry?.standbyVampireWatts || 0) > 15 ? 'text-rose-400' : 'text-ivory'}`}>
                {telemetry ? telemetry.standbyVampireWatts : '--'}
              </span>
              <span className="text-xs font-mono text-ivory-dark">Watts</span>
            </div>
            <p className="text-[10px] text-amber-200/60 mt-1 font-hindi">
              {(telemetry?.standbyVampireWatts || 0) > 15
                ? (lang === 'hi' ? 'फैंटम लीक्स सक्रिय' : 'Phantom leaks active')
                : (lang === 'hi' ? 'न्यूनतम स्टैंडबाय' : 'Standby isolated')}
            </p>
          </div>

          {/* Card 6: Carbon Footprint Today */}
          <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-amber-500/15">
            <span className="text-xs text-ivory-dark block font-hindi">
              {lang === 'hi' ? 'कार्बन पदचिह्न (CO₂)' : 'Carbon Footprint'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-ivory font-mono">
                {telemetry ? telemetry.co2TodayKg : '--'}
              </span>
              <span className="text-xs font-mono text-amber-300">kg</span>
            </div>
            <p className="text-[10px] text-amber-200/60 mt-1 font-mono">
              BEE grid factor 0.82
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
