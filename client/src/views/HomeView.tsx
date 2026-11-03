import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { EnergyPulseHero } from '../components/EnergyPulseHero';
import { Appliance } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import {
  Lightbulb,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingDown,
  TrendingUp,
  Clock,
  Sliders,
  ChevronRight,
  ShieldAlert,
  IndianRupee,
  Activity,
  Layers,
  Leaf,
  Home,
  Check,
  X,
  Tv,
  Wind,
  Refrigerator,
  Flame,
  Sun,
  Shirt,
  Laptop,
  Waves,
  Cpu
} from 'lucide-react';

interface RoomDef {
  id: string;
  name: string;
  nameHi: string;
  matchPattern: string[];
  icon: string;
  color: string;
  description: string;
  descriptionHi: string;
}

const ROOM_DEFINITIONS: RoomDef[] = [
  {
    id: 'Living Room',
    name: 'Living Room',
    nameHi: 'लिविंग रूम',
    matchPattern: ['living room'],
    icon: '🛋️',
    color: '#f59e0b',
    description: 'Entertainment & ambient lighting zone',
    descriptionHi: 'मनोरंजन व परिवेशीय प्रकाश क्षेत्र'
  },
  {
    id: 'Bedroom',
    name: 'Master Bedroom',
    nameHi: 'मास्टर बेडरूम',
    matchPattern: ['bedroom', 'master bedroom', 'bedrooms'],
    icon: '🛏️',
    color: '#3b82f6',
    description: 'High thermal & continuous airflow',
    descriptionHi: 'उच्च थर्मल व निरंतर वायु प्रवाह'
  },
  {
    id: 'Kitchen',
    name: 'Modular Kitchen',
    nameHi: 'मॉड्यूलर किचन',
    matchPattern: ['kitchen'],
    icon: '🍳',
    color: '#10b981',
    description: 'Continuous baseline & induction heating',
    descriptionHi: 'निरंतर बेसलाइन व इंडक्शन हीटिंग'
  },
  {
    id: 'Bathroom',
    name: 'Bathroom',
    nameHi: 'बाथरूम',
    matchPattern: ['bathroom', 'master bathroom'],
    icon: '🚿',
    color: '#06b6d4',
    description: 'High wattage thermal water storage',
    descriptionHi: 'उच्च वाटेज थर्मल जल तापन'
  },
  {
    id: 'Office',
    name: 'Home Office',
    nameHi: 'होम ऑफिस',
    matchPattern: ['home office', 'office', 'study'],
    icon: '💼',
    color: '#8b5cf6',
    description: 'Workstation, dual displays & compute',
    descriptionHi: 'वर्कस्टेशन, ड्यूल मॉनिटर व कंप्यूट'
  }
];

export const HomeView: React.FC = () => {
  const {
    telemetry,
    appliances,
    leaks,
    insights,
    applyInsightAction,
    toggleAppliance,
    setNavSection,
    recentActivity,
    lang
  } = useEnergy();

  const [selectedRoomId, setSelectedRoomId] = useState<string>('Living Room');
  const [chartView, setChartView] = useState<'area' | 'bar'>('area');

  const currentWatts = telemetry?.currentWatts ?? 1840;
  const todayKwh = telemetry?.todayKwh ?? 14.2;
  const todayCost = telemetry?.todayCost ?? 113.6;
  const estMonthlyBill = telemetry?.projectedMonthlyBill ?? Math.round(todayCost * 30);
  const efficiencyScore = telemetry?.efficiencyScore ?? 85;
  const potentialSavingsToday = telemetry?.potentialSavingsTodayCost ?? Math.round(todayCost * 0.28);
  const carbonToday = (todayKwh * 0.82).toFixed(1);
  const activeAppliancesCount = appliances.filter(a => a.is_on === 1).length;

  const activeLeaks = (leaks || []).filter(l => l.status === 'active');

  // Hourly chart data from telemetry with reliable fallback
  const defaultHourly = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    watts: i >= 18 && i <= 22 ? 2200 : i >= 9 && i <= 17 ? 1400 : 600,
    cost: i >= 18 && i <= 22 ? 17.6 : 11.2,
    isPeak: i >= 18 && i <= 22,
    isCurrent: i === new Date().getHours()
  }));

  const chartData = (telemetry?.hourlyGraph && telemetry.hourlyGraph.length > 0)
    ? telemetry.hourlyGraph.map(h => ({
        hour: h.hour,
        watts: h.watts,
        cost: h.costRate,
        isPeak: h.isPeak,
        isCurrent: h.isCurrent
      }))
    : defaultHourly;

  // Helper to match an appliance to a room
  const getApplianceRoomDef = (app: Appliance): RoomDef => {
    const roomLower = (app.room || '').toLowerCase();
    const found = ROOM_DEFINITIONS.find(r =>
      r.matchPattern.some(pattern => roomLower.includes(pattern))
    );
    return found || ROOM_DEFINITIONS[0];
  };

  // Get appliances for a specific room definition
  const getAppliancesForRoom = (roomDef: RoomDef) => {
    return appliances.filter(app => {
      const roomLower = (app.room || '').toLowerCase();
      return roomDef.matchPattern.some(p => roomLower.includes(p));
    });
  };

  // Compute room totals
  const roomMetrics = ROOM_DEFINITIONS.map(room => {
    const roomApps = getAppliancesForRoom(room);
    const roomWatts = roomApps.reduce((acc, a) => acc + (a.is_on ? (Number(a.power_watts) || 0) : (Number(a.standby_watts) || 0)), 0);
    const activeCount = roomApps.filter(a => a.is_on).length;
    return {
      ...room,
      apps: roomApps,
      totalWatts: roomWatts,
      activeCount
    };
  });

  const selectedRoomMetrics = roomMetrics.find(r => r.id === selectedRoomId) || roomMetrics[0];

  const defaultInsight = {
    id: 'ins-default',
    title: 'Dual-Inverter AC & Vampire Load Optimization',
    title_hi: 'ड्यूल इन्वर्टर एसी व वैम्पायर लोड अनुकूलन',
    description: 'Keep your cooling appliances set at 24°C and eliminate standby vampire draw to save up to 28% on your monthly bill.',
    description_hi: 'कूलिंग उपकरणों को 24°C पर रखें और स्टैंडबाय वैम्पायर लोड रोककर मासिक बिल पर 28% तक की बचत करें।',
    whyItMatters: 'Every 1°C increase on your AC saves ~6% grid power and directly avoids thermal coal generation.',
    category: 'cooling',
    estimatedImpact: 'Save ₹34/day (~₹1,020/month)',
    estimatedImpact_hi: '₹34/दिन की बचत (~₹1,020/माह)',
    actionLabel: 'Apply 24°C Eco Setpoint',
    actionLabel_hi: '24°C इको सेटपॉइंट लागू करें',
    severity: 'medium'
  };

  const primaryInsight = insights.length > 0 ? insights[0] : defaultInsight;

  const defaultActivity = [
    { id: 'act-1', event_type: 'optimization', message: 'Optimized dual-inverter AC setpoint to 24°C', message_hi: 'एसी को 24°C पर सेट किया गया', kwh_impact: 1.8, cost_impact: 14.4, timestamp: '14:20' },
    { id: 'act-2', event_type: 'leak_detected', message: 'Standby leak in Entertainment unit suppressed', message_hi: 'एंटरटेनमेंट यूनिट का स्टैंडबाय लीकेज रोका गया', kwh_impact: 0.6, cost_impact: 4.8, timestamp: '12:05' },
    { id: 'act-3', event_type: 'routine', message: 'Living room ambient lighting scheduled off', message_hi: 'लिविंग रूम लाइट्स ऑटो ऑफ शेड्यूल', kwh_impact: 0.4, cost_impact: 3.2, timestamp: '08:00' }
  ];

  const displayActivity = recentActivity.length > 0 ? recentActivity : defaultActivity;

  const formatLogTime = (ts?: string) => {
    if (!ts) return 'Just now';
    try {
      if (ts.includes('T')) {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      const parts = ts.split(' ');
      return parts[1] || parts[0] || 'Today';
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. TOP 7 ESSENTIAL ENERGY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Metric 1: Live Load */}
        <div className="p-3.5 rounded-2xl glass-card border border-amber-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ivory-dark">
            <span className="font-mono text-[10px] uppercase">{lang === 'hi' ? 'लाइव लोड' : 'Live Load'}</span>
            <span className="w-2 h-2 rounded-full bg-lime-bright animate-ping" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
              {currentWatts.toLocaleString()}
            </span>
            <span className="text-xs text-amber-400 font-mono ml-1">W</span>
          </div>
          <span className="text-[10px] text-amber-200/60 font-hindi">
            {lang === 'hi' ? 'वास्तविक घरेलू मांग' : 'Instant active power'}
          </span>
        </div>

        {/* Metric 2: Today kWh */}
        <div className="p-3.5 rounded-2xl glass-card border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ivory-dark">
            <span className="font-mono text-[10px] uppercase">{lang === 'hi' ? 'आज की खपत' : "Today's Energy"}</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-ivory">
              {todayKwh}
            </span>
            <span className="text-xs text-ivory-dark font-mono ml-1">kWh</span>
          </div>
          <span className="text-[10px] text-ivory-dark font-hindi">
            {lang === 'hi' ? `₹${todayCost} आज तक` : `Est. ₹${todayCost} today`}
          </span>
        </div>

        {/* Metric 3: Est. Monthly Bill */}
        <div className="p-3.5 rounded-2xl glass-card border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ivory-dark">
            <span className="font-mono text-[10px] uppercase">{lang === 'hi' ? 'मासिक अनुमान' : 'Monthly Bill'}</span>
            <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1">
            <span className="text-xs text-amber-400 font-mono">₹</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-ivory">
              {estMonthlyBill.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] text-ivory-dark font-hindi">
            {lang === 'hi' ? 'प्रोग्रेसिव स्लैब टैरिफ' : 'Tiered slab tariff'}
          </span>
        </div>

        {/* Metric 4: Efficiency Score */}
        <div className="p-3.5 rounded-2xl glass-card border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ivory-dark">
            <span className="font-mono text-[10px] uppercase">{lang === 'hi' ? 'दक्षता स्कोर' : 'Efficiency'}</span>
            <Zap className="w-3.5 h-3.5 text-lime-bright" />
          </div>
          <div className="my-1 flex items-baseline">
            <span className={`text-xl sm:text-2xl font-black font-mono ${efficiencyScore > 80 ? 'text-lime-electric' : 'text-amber-400'}`}>
              {efficiencyScore}
            </span>
            <span className="text-xs text-ivory-dark font-mono ml-0.5">%</span>
          </div>
          <span className="text-[10px] text-lime-bright/80 font-hindi">
            {efficiencyScore > 80 ? 'Eco Optimum' : 'Action Needed'}
          </span>
        </div>

        {/* Metric 5: Estimated Daily Savings */}
        <div className="p-3.5 rounded-2xl glass-card border border-lime-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ivory-dark">
            <span className="font-mono text-[10px] uppercase">{lang === 'hi' ? 'दैनिक बचत' : 'Daily Savings'}</span>
            <TrendingDown className="w-3.5 h-3.5 text-lime-bright" />
          </div>
          <div className="my-1">
            <span className="text-xs text-lime-bright font-mono">₹</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-lime-bright">
              {potentialSavingsToday}
            </span>
            <span className="text-[10px] text-ivory-dark font-mono ml-1">/day</span>
          </div>
          <span className="text-[10px] text-lime-300/70 font-hindi">
            {lang === 'hi' ? 'सुझाव लागू करने पर' : 'With optimizations'}
          </span>
        </div>

        {/* Metric 6: Carbon Footprint */}
        <div className="p-3.5 rounded-2xl glass-card border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ivory-dark">
            <span className="font-mono text-[10px] uppercase">{lang === 'hi' ? 'कार्बन फुटप्रिंट' : 'CO₂ Footprint'}</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              {carbonToday}
            </span>
            <span className="text-[10px] text-ivory-dark font-mono ml-1">kg</span>
          </div>
          <span className="text-[10px] text-ivory-dark font-hindi">
            {lang === 'hi' ? '0.82 किग्रा/यूनिट' : '0.82 kg/kWh CEA'}
          </span>
        </div>

        {/* Metric 7: Active Appliances */}
        <div className="p-3.5 rounded-2xl glass-card border border-white/10 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-ivory-dark">
            <span className="font-mono text-[10px] uppercase">{lang === 'hi' ? 'सक्रिय उपकरण' : 'Active Devices'}</span>
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-ivory">
              {activeAppliancesCount}
            </span>
            <span className="text-xs text-ivory-dark font-mono ml-1">/ {appliances.length}</span>
          </div>
          <button
            onClick={() => setNavSection('appliances')}
            className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold text-left font-hindi"
          >
            {lang === 'hi' ? 'उपकरण देखें →' : 'Manage Devices →'}
          </button>
        </div>
      </div>

      {/* 2. LIVING ENERGY HEARTBEAT HERO & SIMULATION MODES */}
      <EnergyPulseHero />

      {/* 3. ACTIVE LEAK WARNING BANNER (IF DETECTED) */}
      {activeLeaks.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-charcoal-900 to-charcoal-900 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">
                  {lang === 'hi' ? 'ऊर्जा रिसाव चेतावनी' : 'Energy Leak Detected'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                  {activeLeaks.length} {lang === 'hi' ? 'सक्रिय' : 'Active'}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-ivory mt-0.5">
                {lang === 'hi' ? activeLeaks[0].title_hi : activeLeaks[0].title}
              </h4>
              <p className="text-xs text-ivory-dark mt-0.5">
                {lang === 'hi'
                  ? `अनुमानित बर्बादी: ${activeLeaks[0].waste_kwh_daily} kWh/दिन (~₹${activeLeaks[0].waste_cost_daily})`
                  : `Estimated Waste: ${activeLeaks[0].waste_kwh_daily} kWh/day (~₹${activeLeaks[0].waste_cost_daily}/day)`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setNavSection('leaks')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95 shrink-0"
          >
            <span>{lang === 'hi' ? 'लीक डिटेक्टिव खोलें' : 'Open Leak Detective'}</span>
            <ChevronRight className="w-4 h-4 text-charcoal-950" />
          </button>
        </div>
      )}

      {/* 4. REAL-TIME 24-HOUR CONSUMPTION & HOURLY USAGE VISUALIZATION */}
      <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-ivory">
                {lang === 'hi' ? 'घंटे-दर-घंटे बिजली खपत व लोड कर्व' : '24-Hour Load Curve & Hourly Telemetry'}
              </h3>
            </div>
            <p className="text-xs text-amber-200/60 font-hindi">
              {lang === 'hi'
                ? 'शाम 6:00 से 10:00 बजे का समय उच्च टैरिफ पीक विंडो है'
                : 'Interactive household telemetry with peak window detection (18:00 - 22:00)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Area vs Bar Toggle */}
            <div className="flex items-center bg-charcoal-900 border border-white/10 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setChartView('area')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  chartView === 'area' ? 'bg-amber-500 text-charcoal-950 shadow-sm' : 'text-ivory-dark hover:text-ivory'
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartView('bar')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  chartView === 'bar' ? 'bg-amber-500 text-charcoal-950 shadow-sm' : 'text-ivory-dark hover:text-ivory'
                }`}
              >
                Bars
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Interactive Telemetry Graph */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="amberGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="hour"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${val}W`}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-charcoal-900 border border-amber-500/40 shadow-2xl text-xs font-mono">
                          <p className="text-amber-400 font-bold">{data.hour}</p>
                          <p className="text-ivory text-sm font-black mt-0.5">{data.watts.toLocaleString()} Watts</p>
                          <p className="text-lime-bright text-[11px] mt-0.5">Est: ₹{data.cost}/hr</p>
                          {data.isPeak && (
                            <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              Peak Tariff Window
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="watts"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#amberGlow)"
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="hour" stroke="#71717a" fontSize={10} tickLine={false} interval={2} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(val) => `${val}W`} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-charcoal-900 border border-amber-500/40 shadow-2xl text-xs font-mono">
                          <p className="text-amber-400 font-bold">{data.hour}</p>
                          <p className="text-ivory text-sm font-black mt-0.5">{data.watts.toLocaleString()} Watts</p>
                          <p className="text-lime-bright text-[11px] mt-0.5">₹{data.cost}/hr</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="watts" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isPeak ? '#f59e0b' : '#3f3f46'}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. INTERACTIVE ROOM CARDS: Living Room, Bedroom, Kitchen, Bathroom, Office */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-ivory">
                {lang === 'hi' ? 'कमरा-वार ऊर्जा नियंत्रण एवं विश्लेषण' : 'Interactive Room-Wise Consumption Breakdown'}
              </h3>
            </div>
            <p className="text-xs text-amber-200/60 font-hindi">
              {lang === 'hi'
                ? 'कमरे पर क्लिक करके उसके उपकरण और वास्तविक समय लोड देखें'
                : 'Click any room card to display its appliances and real-time energy consumption'}
            </p>
          </div>

          <span className="text-xs font-mono text-ivory-dark">
            5 Monitored Zones
          </span>
        </div>

        {/* The 5 Room Selection Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {roomMetrics.map((room) => {
            const isSelected = selectedRoomId === room.id;
            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`p-4 rounded-3xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-charcoal-900 to-charcoal-850 border-amber-400 shadow-lg shadow-amber-500/15 scale-[1.02]'
                    : 'bg-charcoal-900/80 border-white/10 hover:border-amber-500/40 text-ivory-dark'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{room.icon}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    room.totalWatts > 1000
                      ? 'bg-rose-500/20 text-rose-300'
                      : room.totalWatts > 0
                      ? 'bg-lime-500/20 text-lime-bright'
                      : 'bg-charcoal-800 text-ivory-dark'
                  }`}>
                    {room.activeCount} ON
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-ivory font-hindi">
                    {lang === 'hi' ? room.nameHi : room.name}
                  </h4>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-black font-mono text-amber-300">
                      {room.totalWatts}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">W</span>
                  </div>
                  <p className="text-[10px] text-ivory-dark mt-1 truncate">
                    {room.apps.length} appliances
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Room Appliances Details Panel */}
        <div className="p-6 rounded-3xl glass-panel border border-amber-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedRoomMetrics.icon}</span>
              <div>
                <h4 className="text-lg font-bold text-ivory">
                  {lang === 'hi' ? selectedRoomMetrics.nameHi : selectedRoomMetrics.name}
                </h4>
                <p className="text-xs text-ivory-dark font-hindi">
                  {lang === 'hi' ? selectedRoomMetrics.descriptionHi : selectedRoomMetrics.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="p-2 rounded-xl bg-charcoal-900 border border-white/5">
                <span className="text-ivory-dark text-[10px] block uppercase">Room Load</span>
                <span className="font-bold text-amber-300 text-base">{selectedRoomMetrics.totalWatts} W</span>
              </div>
              <div className="p-2 rounded-xl bg-charcoal-900 border border-white/5">
                <span className="text-ivory-dark text-[10px] block uppercase">Est. Cost</span>
                <span className="font-bold text-lime-bright text-base">₹{Math.round((selectedRoomMetrics.totalWatts * 8 * 6) / 1000)}/day</span>
              </div>
            </div>
          </div>

          {/* Appliances Inside Selected Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {selectedRoomMetrics.apps.length > 0 ? (
              selectedRoomMetrics.apps.map((app) => (
                <div
                  key={app.id}
                  className={`p-4 rounded-2xl border transition ${
                    app.is_on
                      ? 'bg-charcoal-850 border-amber-500/40 shadow-md shadow-amber-500/5'
                      : 'bg-charcoal-900/60 border-white/5 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <h5 className="font-bold text-sm text-ivory truncate">{app.name}</h5>
                      <span className="text-[10px] text-amber-200/60 font-mono">{app.efficiency_rating}</span>
                    </div>

                    <button
                      onClick={() => toggleAppliance(app.id)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 ${
                        app.is_on ? 'bg-amber-500' : 'bg-charcoal-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-charcoal-950 shadow transform transition-transform duration-200 ease-in-out ${
                          app.is_on ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between text-xs pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[10px] text-ivory-dark block font-mono">Current Draw</span>
                      <span className="font-bold font-mono text-amber-300">{app.is_on ? app.power_watts : 0} W</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ivory-dark block font-mono text-right">Daily Usage</span>
                      <span className="font-semibold text-ivory font-mono text-right block">{app.daily_hours} hrs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ivory-dark block font-mono text-right">Est. Monthly</span>
                      <span className="font-bold text-lime-bright font-mono text-right block">
                        ₹{Math.round(((app.power_watts * app.daily_hours) / 1000) * 8 * 30)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-ivory-dark col-span-3">
                No appliances linked to this room yet. Add one in Appliances!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. WHAT WATTWISE AI NOTICED (RECOMMENDATION CARD) */}
      {primaryInsight && (
        <div className="p-6 rounded-3xl glass-card border border-amber-500/30 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-300">
                <Lightbulb className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  {lang === 'hi' ? 'वाटवाइज़ एआई ने क्या देखा' : 'WHAT WATTWISE AI NOTICED'}
                </span>
                <h3 className="text-lg font-bold text-ivory font-hindi">
                  {lang === 'hi' ? primaryInsight.title_hi : primaryInsight.title}
                </h3>
              </div>
            </div>

            <span className="hidden sm:inline-block text-xs px-2.5 py-1 rounded-full copper-badge font-mono font-semibold">
              {primaryInsight.estimatedImpact}
            </span>
          </div>

          <p className="text-sm text-ivory/90 leading-relaxed mb-4 font-hindi">
            {lang === 'hi' ? primaryInsight.description_hi : primaryInsight.description}
          </p>

          <div className="p-3.5 rounded-2xl bg-charcoal-900/90 border border-white/5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="text-ivory-dark font-hindi">
              <span className="text-amber-300 font-semibold">{lang === 'hi' ? 'यह क्यों महत्वपूर्ण है: ' : 'Why it matters: '}</span>
              {primaryInsight.whyItMatters}
            </div>
            <div className="text-lime-bright font-mono font-bold shrink-0">
              {primaryInsight.estimatedImpact}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5">
            <div className="text-xs text-amber-200/70 font-hindi">
              {lang === 'hi'
                ? 'सिफारिश लागू करने पर उपकरण की सेटिंग और आज का बिल तुरंत अपडेट होगा।'
                : 'Applying recommendation automatically tunes the appliance setpoint and updates live power.'}
            </div>

            <button
              onClick={() => applyInsightAction(primaryInsight.id)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 border border-amber-300/40 transition active:scale-95 shrink-0"
            >
              <Zap className="w-4 h-4 fill-charcoal-950" />
              <span>{primaryInsight.actionLabel}</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. RECENT HOUSEHOLD ACTIVITY & DECISIONS */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-ivory">
              {lang === 'hi' ? 'हाल की स्वचालित गतिविधियाँ' : 'Recent Telemetry & Automation Log'}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-ivory-dark">
            Live Database Sync
          </span>
        </div>

        <div className="divide-y divide-white/5 space-y-2">
          {displayActivity.map((log) => (
            <div key={log.id} className="pt-2 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-ivory font-hindi truncate">
                  {lang === 'hi' ? log.message_hi : log.message}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {Number(log.cost_impact || 0) !== 0 && (
                  <span className={`font-mono font-semibold ${Number(log.cost_impact) > 0 ? 'text-lime-electric' : 'text-amber-400'}`}>
                    {Number(log.cost_impact) > 0 ? `Saved ₹${log.cost_impact}` : `+₹${Math.abs(Number(log.cost_impact))}`}
                  </span>
                )}
                <span className="text-[10px] text-ivory-dark font-mono">
                  {formatLogTime(log.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
