import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts';
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
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Home,
  Cpu,
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2
} from 'lucide-react';

type TimeFilter = 'hourly' | 'daily' | 'weekly' | 'monthly';

export const EnergyPulseView: React.FC = () => {
  const { telemetry, appliances, settings, setSimulationMode, lang, integrationMode } = useEnergy();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('hourly');
  const [breakdownType, setBreakdownType] = useState<'room' | 'appliance'>('room');

  const currentMode = settings?.simulation_mode || 'Normal Day';
  const defaultHourly = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    watts: i >= 18 && i <= 22 ? 2200 : i >= 9 && i <= 17 ? 1400 : 600,
    costRate: i >= 18 && i <= 22 ? 17.6 : 11.2,
    isPeak: i >= 18 && i <= 22,
    isCurrent: i === new Date().getHours()
  }));
  const hourlyData = (telemetry?.hourlyGraph && telemetry.hourlyGraph.length > 0) ? telemetry.hourlyGraph : defaultHourly;
  const currentWatts = telemetry?.currentWatts ?? 1840;
  const efficiency = telemetry?.efficiencyScore ?? 85;

  // Peak detection
  const peakWatts = Math.max(0, ...hourlyData.map(d => d.watts), currentWatts);
  const isHighPeak = peakWatts > 3200;

  // Base load monitoring (minimum load across the 24 hours, usually 280-450W from fridge & standby)
  const positiveWatts = hourlyData.map(d => d.watts).filter(w => w > 0);
  const baseWatts = positiveWatts.length > 0 ? Math.min(...positiveWatts) : 320;

  // Time filter mock datasets derived deterministically from current telemetry
  const dailyData = [
    { label: 'Mon', kwh: 18.2, cost: 145, efficiency: 86 },
    { label: 'Tue', kwh: 19.5, cost: 156, efficiency: 84 },
    { label: 'Wed', kwh: 17.8, cost: 142, efficiency: 88 },
    { label: 'Thu', kwh: 21.0, cost: 168, efficiency: 82 },
    { label: 'Fri', kwh: 23.4, cost: 187, efficiency: 79 },
    { label: 'Sat', kwh: 25.1, cost: 201, efficiency: 78 },
    { label: 'Sun (Today)', kwh: telemetry?.todayKwh || 20.5, cost: telemetry?.todayCost || 164, efficiency: efficiency }
  ];

  const weeklyData = [
    { label: 'Week 1', kwh: 128, cost: 1024, efficiency: 85 },
    { label: 'Week 2', kwh: 142, cost: 1136, efficiency: 82 },
    { label: 'Week 3', kwh: 135, cost: 1080, efficiency: 86 },
    { label: 'Week 4 (Current)', kwh: Math.round((telemetry?.todayKwh || 20) * 6.5), cost: Math.round((telemetry?.todayCost || 160) * 6.5), efficiency: efficiency }
  ];

  const monthlyData = [
    { label: 'May', kwh: 580, cost: 4640, efficiency: 76 },
    { label: 'Jun', kwh: 640, cost: 5120, efficiency: 72 },
    { label: 'Jul', kwh: 610, cost: 4880, efficiency: 75 },
    { label: 'Aug', kwh: 520, cost: 4160, efficiency: 81 },
    { label: 'Sep', kwh: 480, cost: 3840, efficiency: 84 },
    { label: 'Oct (Current)', kwh: telemetry?.projectedMonthlyKwh || 510, cost: telemetry?.projectedMonthlyBill || 4080, efficiency: efficiency }
  ];

  // Room Breakdown
  const safeApps = appliances || [];
  const roomMap: Record<string, number> = {};
  safeApps.forEach(app => {
    const r = (app.room || 'General').split(' ')[0];
    const power = app.is_on ? (Number(app.power_watts) || 0) : (Number(app.standby_watts) || 0);
    roomMap[r] = (roomMap[r] || 0) + power;
  });

  const roomChartData = Object.entries(roomMap).map(([room, watts]) => ({
    name: room,
    watts,
    pct: currentWatts > 0 ? Math.round((watts / currentWatts) * 100) : 0
  })).sort((a, b) => b.watts - a.watts);

  // Appliance Breakdown
  const applianceChartData = safeApps
    .filter(a => Boolean(a.is_on))
    .map(a => ({
      name: (a.name || 'Device').split(' ')[0],
      watts: Number(a.power_watts) || 0,
      room: (a.room || 'General').split(' ')[0]
    }))
    .sort((a, b) => b.watts - a.watts);

  const ROOM_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899'];

  const modes = [
    { id: 'Normal Day', labelHi: 'सामान्य दिन', labelEn: 'Normal Day', desc: 'Standard family routine with evening peak', icon: Sun },
    { id: 'High Usage', labelHi: 'उच्च खपत (Summer)', labelEn: 'High Usage (Summer)', desc: 'Heavy AC, multiple appliances running', icon: Flame },
    { id: 'Vacation Mode', labelHi: 'अवकाश मोड', labelEn: 'Vacation Mode', desc: 'Minimal baseline (Fridge + Standby only)', icon: Moon },
    { id: 'Peak Hour', labelHi: 'पीक ऑवर (7-10 PM)', labelEn: 'Peak Hour (7–10 PM)', desc: 'High tariff window with heavy lighting & entertainment', icon: TrendingUp },
    { id: 'Optimized Home', labelHi: 'अनुकूलित घर', labelEn: 'Optimized Home', desc: 'Eco setpoints, zero vampire load, staggered loads', icon: Sparkles }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              {lang === 'hi' ? 'टेलीमेट्री प्रवाह विश्लेषण' : 'Telemetry Flow Analysis'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono border border-amber-500/30">
              {integrationMode === 'LIVE' ? 'LIVE SYNC' : 'DEMO SIMULATION'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-ivory tracking-tight">
            ENERGY PULSE & TELEMETRY LAB
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {lang === 'hi'
              ? 'वास्तविक समय ऊर्जा प्रवाह, पीक लोड डिटेक्शन, व 24 घंटे का सिमुलेशन'
              : 'Continuous household energy telemetry, base load monitoring, and peak detection'}
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
                {currentWatts.toLocaleString()}
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
              {efficiency}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Simulation Scenario Selector */}
      <div className="p-5 rounded-3xl glass-card border border-amber-500/25 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ivory">
            {lang === 'hi' ? 'लाइव सिमुलेशन परिदृश्य' : 'Select Deterministic Simulation Scenario'}
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

      {/* 3. PEAK & BASE LOAD MONITORING CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Peak Load Monitoring */}
        <div className={`p-5 rounded-3xl border ${
          isHighPeak ? 'bg-rose-950/20 border-rose-500/40' : 'glass-card border-amber-500/25'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-5 h-5 ${isHighPeak ? 'text-rose-400' : 'text-amber-400'}`} />
              <h4 className="text-sm font-bold text-ivory">
                {lang === 'hi' ? 'पीक लोड डिटेक्शन' : 'Peak Consumption Detection'}
              </h4>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              isHighPeak ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/15 text-amber-300'
            }`}>
              {isHighPeak ? 'SURGE ALERT' : 'NORMAL RANGE'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black font-mono text-ivory">{peakWatts.toLocaleString()}</span>
            <span className="text-sm font-mono text-amber-400">Watts Max</span>
            <span className="text-xs text-ivory-dark ml-auto font-mono">Threshold: 3,500W</span>
          </div>

          <p className="text-xs text-ivory-dark font-hindi">
            {isHighPeak
              ? (lang === 'hi' ? 'चेतावनी: शाम 7-10 बजे के दौरान भारी लोड स्लैब चार्ज बढ़ा सकता है।' : 'Warning: Peak hour surge detected. Automated load-shedding recommended.')
              : (lang === 'hi' ? 'घरेलू बिजली खपत सुरक्षित व अनुशंसित सीमा के भीतर है।' : 'Power consumption is within healthy grid demand thresholds.')}
          </p>
        </div>

        {/* Base Load Monitoring */}
        <div className="p-5 rounded-3xl glass-card border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-bold text-ivory">
                {lang === 'hi' ? 'बेस लोड मॉनिटरिंग' : 'Base Load Monitoring (24/7 Floor)'}
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300">
              VAMPIRE SURVEILLANCE
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black font-mono text-cyan-300">{baseWatts}</span>
            <span className="text-sm font-mono text-cyan-400">Watts Continuous</span>
            <span className="text-xs text-ivory-dark ml-auto font-mono">₹{Math.round((baseWatts * 24 * 8 * 30) / 1000)}/month</span>
          </div>

          <p className="text-xs text-ivory-dark font-hindi">
            {lang === 'hi'
              ? 'रेफ्रिजरेटर, वाई-फाई राउटर, व स्टैंडबाय टीवी का निरंतर 24 घंटे का लोड।'
              : '24/7 uninterrupted baseline floor power drawn by refrigeration and standby electronics.'}
          </p>
        </div>
      </div>

      {/* 4. HISTORICAL CONSUMPTION GRAPH WITH TIME FILTERS */}
      <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-ivory">
                {lang === 'hi' ? 'ऐतिहासिक व लाइव बिजली खपत विश्लेषण' : 'Consumption Telemetry Trends'}
              </h3>
            </div>
            <p className="text-xs text-amber-200/60 font-hindi">
              {timeFilter === 'hourly' && '24-hour hourly profile with tariff indication'}
              {timeFilter === 'daily' && 'Daily consumption across the past 7 days'}
              {timeFilter === 'weekly' && 'Weekly totals across this billing cycle'}
              {timeFilter === 'monthly' && '6-month seasonal historical billing trend'}
            </p>
          </div>

          {/* Time Filter Pills: Hourly, Daily, Weekly, Monthly */}
          <div className="flex items-center bg-charcoal-900 border border-white/10 rounded-xl p-1 text-xs">
            {(['hourly', 'daily', 'weekly', 'monthly'] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider text-[10px] transition ${
                  timeFilter === filter
                    ? 'bg-amber-500 text-charcoal-950 shadow-sm'
                    : 'text-ivory-dark hover:text-ivory'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Chart Based on Selected Time Filter */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {timeFilter === 'hourly' ? (
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hourlyGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#71717a" fontSize={10} tickLine={false} interval={2} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}W`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-charcoal-900 border border-amber-500/40 shadow-2xl text-xs font-mono">
                          <p className="text-amber-400 font-bold">{d.hour}</p>
                          <p className="text-ivory text-sm font-black mt-0.5">{d.watts.toLocaleString()} Watts</p>
                          <p className="text-lime-bright text-[11px] mt-0.5">Est: ₹{d.costRate}/hr</p>
                          {d.isPeak && <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Peak Window</span>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="watts" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#hourlyGlow)" />
              </AreaChart>
            ) : timeFilter === 'daily' ? (
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(v) => `${v} kWh`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-charcoal-900 border border-amber-500/40 shadow-2xl text-xs font-mono">
                          <p className="text-amber-400 font-bold">{d.label}</p>
                          <p className="text-ivory text-sm font-black mt-0.5">{d.kwh} kWh (~₹{d.cost})</p>
                          <p className="text-lime-bright text-[11px] mt-0.5">Efficiency: {d.efficiency}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="kwh" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : timeFilter === 'weekly' ? (
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(v) => `${v} kWh`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-charcoal-900 border border-amber-500/40 shadow-2xl text-xs font-mono">
                          <p className="text-amber-400 font-bold">{d.label}</p>
                          <p className="text-ivory text-sm font-black mt-0.5">{d.kwh} kWh (~₹{d.cost})</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="kwh" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(v) => `${v} kWh`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-charcoal-900 border border-amber-500/40 shadow-2xl text-xs font-mono">
                          <p className="text-amber-400 font-bold">{d.label}</p>
                          <p className="text-ivory text-sm font-black mt-0.5">{d.kwh} kWh</p>
                          <p className="text-lime-bright text-[11px] mt-0.5">Total Bill: ₹{d.cost}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="kwh" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. POWER BREAKDOWN: BY ROOM & BY APPLIANCE */}
      <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-ivory">
              {breakdownType === 'room' ? 'Room-Wise Consumption Breakdown' : 'Appliance-Wise Power Draw'}
            </h3>
          </div>

          <div className="flex items-center bg-charcoal-900 border border-white/10 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setBreakdownType('room')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                breakdownType === 'room' ? 'bg-amber-500 text-charcoal-950' : 'text-ivory-dark hover:text-ivory'
              }`}
            >
              By Room
            </button>
            <button
              onClick={() => setBreakdownType('appliance')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                breakdownType === 'appliance' ? 'bg-amber-500 text-charcoal-950' : 'text-ivory-dark hover:text-ivory'
              }`}
            >
              By Appliance
            </button>
          </div>
        </div>

        {breakdownType === 'room' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {roomChartData.map((room, idx) => (
              <div key={room.name} className="p-4 rounded-2xl bg-charcoal-900 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ivory">{room.name}</span>
                  <span className="font-mono text-amber-300 font-bold">{room.watts}W</span>
                </div>
                <div className="w-full bg-charcoal-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(5, room.pct)}%`,
                      backgroundColor: ROOM_COLORS[idx % ROOM_COLORS.length]
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-ivory-dark font-mono">
                  <span>Share</span>
                  <span>{room.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {applianceChartData.map((app) => (
              <div key={app.name} className="p-3.5 rounded-2xl bg-charcoal-900 border border-amber-500/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ivory truncate">{app.name}</span>
                  <span className="font-mono text-amber-300 font-bold">{app.watts}W</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-ivory-dark font-mono">
                  <span>{app.room}</span>
                  <span className="text-lime-bright">Active</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
