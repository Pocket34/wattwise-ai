import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  Sparkles,
  Zap,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  TrendingDown,
  Layers,
  ShieldCheck,
  Bot,
  Download,
  Printer,
  FileText,
  Clock,
  AlertTriangle,
  BarChart3,
  Check,
  X
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';

export const InsightsView: React.FC = () => {
  const { insights, applyInsightAction, lang, telemetry, appliances, leaks, settings } = useEnergy();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const currentWatts = telemetry?.currentWatts || 0;
  const todayKwh = telemetry?.todayKwh || 0;
  const todayCost = telemetry?.todayCost || 0;
  const tariff = telemetry?.effectiveTariff || 8.0;

  // Appliance ranking for comparisons
  const applianceRankings = appliances
    .map(a => {
      const hours = a.daily_hours ?? (a as any).daily_usage_hours ?? 4;
      const watts = Number(a.power_watts) || 0;
      const kwh = parseFloat(((watts * hours) / 1000).toFixed(2));
      return {
        name: (a.name || 'Device').split(' ')[0],
        fullName: a.name || 'Appliance',
        room: a.room || 'General',
        kwh,
        cost: Math.round(((watts * hours) / 1000) * tariff * 30),
        watts,
        status: a.is_on ? 'Active' : 'Standby'
      };
    })
    .sort((a, b) => b.kwh - a.kwh);

  // 6-Month Monthly Trends
  const monthlyTrends = [
    { month: 'May', kwh: 580, bill: 4640, waste: 45 },
    { month: 'Jun', kwh: 640, bill: 5120, waste: 58 },
    { month: 'Jul', kwh: 610, bill: 4880, waste: 50 },
    { month: 'Aug', kwh: 520, bill: 4160, waste: 38 },
    { month: 'Sep', kwh: 480, bill: 3840, waste: 30 },
    { month: 'Oct (Current)', kwh: telemetry?.projectedMonthlyKwh || 510, bill: telemetry?.projectedMonthlyBill || 4080, waste: 24 }
  ];

  // CSV Report Generator
  const handleDownloadCSV = () => {
    soundManager.playSuccessChime();

    const timestamp = new Date().toISOString().slice(0, 10);
    const headers = ['Appliance Name', 'Room', 'Rated Watts', 'Daily Hours', 'Daily kWh', 'Monthly Cost (INR)', 'Efficiency Rating', 'Current State'];
    const rows = appliances.map(a => [
      `"${a.name}"`,
      `"${a.room}"`,
      a.power_watts,
      a.daily_hours,
      ((a.power_watts * a.daily_hours) / 1000).toFixed(2),
      Math.round(((a.power_watts * a.daily_hours) / 1000) * tariff * 30),
      `"${a.efficiency_rating}"`,
      a.is_on ? 'ON' : 'OFF'
    ]);

    // Summary metadata rows
    const summaryRows = [
      ['WATTWISE AI - SMART HOME ENERGY INTELLIGENCE REPORT'],
      [`Report Generated On: ${new Date().toLocaleString()}`],
      [`Simulation Scenario: ${settings?.simulation_mode || 'Normal Day'}`],
      [`Instant Active Load: ${currentWatts} Watts`],
      [`Today Consumption: ${todayKwh} kWh (~INR ${todayCost})`],
      [`Projected Monthly Bill: INR ${telemetry?.projectedMonthlyBill || 4080}`],
      [`Energy Efficiency Score: ${telemetry?.efficiencyScore || 85}%`],
      [`Active Energy Leaks Detected: ${leaks.filter(l => l.status === 'active').length}`],
      []
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      summaryRows.map(e => e.join(',')).join('\n') +
      headers.join(',') + '\n' +
      rows.map(e => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WattWise_Energy_Report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger browser print
  const handlePrint = () => {
    soundManager.playNavTick();
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header with Export & Print Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              {lang === 'hi' ? 'वाटवाइज़ बुद्धिमत्ता व विश्लेषिकी' : 'Deterministic AI & Analytics'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-ivory tracking-tight">
            INSIGHTS & ENERGY REPORTS
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {lang === 'hi'
              ? 'घरेलू बिजली खपत पैटर्न, उपकरण तुलना, व निर्यात योग्य ऑडिट रिपोर्ट'
              : 'Statistical heuristics, appliance comparisons, waste diagnostics, and exportable reports'}
          </p>
        </div>

        {/* Action Controls: Download CSV + Print Report */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-850 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-md transition active:scale-95"
            title="Download CSV Energy Audit"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
            title="Print Executive Energy Summary"
          >
            <Printer className="w-4 h-4 text-charcoal-950" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. CONSUMPTION PATTERNS & PEAK HOURS ANALYSIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl glass-card border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <Clock className="w-4 h-4" />
            <span>PEAK USAGE WINDOW</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-ivory font-mono">18:00 – 22:00</span>
          </div>
          <p className="text-xs text-ivory-dark font-hindi">
            {lang === 'hi'
              ? 'शाम के समय एक साथ एसी, टीवी, व रोशनी चलने से बिजली खपत 62% बढ़ जाती है।'
              : 'Evening surge: Concurrent AC, entertainment, and cooking drives 62% of daily power draw.'}
          </p>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-cyan-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Zap className="w-4 h-4" />
            <span>BASE LOAD CONSUMPTION</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-300 font-mono">340 Watts</span>
            <span className="text-xs text-ivory-dark font-mono">Continuous</span>
          </div>
          <p className="text-xs text-ivory-dark font-hindi">
            {lang === 'hi'
              ? 'रात 2:00 से सुबह 6:00 बजे तक रेफ्रिजरेटर व स्टैंडबाय सर्किट का निरंतर आधारभूत लोड।'
              : 'Uninterrupted overnight draw: Refrigerator cycles, router, and TV standby vampire load.'}
          </p>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-lime-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-lime-bright">
            <TrendingDown className="w-4 h-4" />
            <span>OPTIMIZATION DIVIDEND</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-lime-bright font-mono">₹1,779</span>
            <span className="text-xs text-ivory-dark font-mono">/month</span>
          </div>
          <p className="text-xs text-ivory-dark font-hindi">
            {lang === 'hi'
              ? 'एसी 24°C सेट करने और स्टैंडबाय लोड खत्म करने पर अनुमानित मासिक बचत।'
              : 'Achievable reduction by maintaining 24°C setpoints and eliminating vampire standby.'}
          </p>
        </div>
      </div>

      {/* 3. APPLIANCE CONSUMPTION COMPARISONS & RANKING */}
      <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-ivory">
                {lang === 'hi' ? 'उपकरण-वार बिजली खपत तुलना' : 'Appliance Consumption Comparisons & Shares'}
              </h3>
            </div>
            <p className="text-xs text-amber-200/60 font-hindi">
              {lang === 'hi' ? 'कौन सा उपकरण सबसे अधिक बिजली व बिल खर्च करता है' : 'Relative daily energy demand across household equipment'}
            </p>
          </div>

          <span className="text-xs font-mono text-ivory-dark">
            Ranked by Daily kWh
          </span>
        </div>

        {/* Recharts Bar Chart of Top Appliances */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={applianceRankings.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(v) => `${v} kWh`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-charcoal-900 border border-amber-500/40 shadow-2xl text-xs font-mono">
                        <p className="text-amber-400 font-bold">{d.fullName}</p>
                        <p className="text-ivory mt-0.5">{d.watts}W Rated Power</p>
                        <p className="text-lime-bright mt-0.5">{d.kwh} kWh/day (~₹{d.cost}/mo)</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="kwh" radius={[6, 6, 0, 0]}>
                {applianceRankings.slice(0, 6).map((entry, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. MONTHLY TRENDS & ENERGY WASTE ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 6-Month Trajectory */}
        <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-ivory">6-Month Trajectory & Waste Trend</h4>
            <span className="text-[10px] font-mono text-amber-400">Monthly Billing</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-charcoal-900 border border-lime-500/40 shadow-2xl text-xs font-mono">
                          <p className="text-amber-400 font-bold">{d.month}</p>
                          <p className="text-ivory mt-0.5">Total Bill: ₹{d.bill}</p>
                          <p className="text-rose-400 mt-0.5">Estimated Waste: {d.waste} kWh</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="bill" stroke="#10b981" strokeWidth={2.5} fill="url(#trendGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Energy Waste Breakdown */}
        <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-ivory">Energy Waste Diagnostic Breakdown</h4>
            <span className="text-[10px] font-mono text-rose-400">Total Waste: ~86 kWh/mo</span>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-charcoal-900 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ivory">Standby Vampire Electronics</span>
                <span className="font-mono text-rose-400 font-semibold">28W Cont. (~₹160/mo)</span>
              </div>
              <div className="w-full bg-charcoal-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '42%' }} />
              </div>
              <p className="text-[10px] text-ivory-dark font-hindi">
                {lang === 'hi' ? 'टीवी, सेट-टॉप बॉक्स, व चार्जर बंद न करने से निरंतर बिजली खपत।' : 'TV, set-top box, and chargers left continuously plugged in.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-charcoal-900 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ivory">Sub-Optimal AC Setpoint (21°C vs 24°C)</span>
                <span className="font-mono text-amber-300 font-semibold">~₹720/mo excess</span>
              </div>
              <div className="w-full bg-charcoal-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: '68%' }} />
              </div>
              <p className="text-[10px] text-ivory-dark font-hindi">
                {lang === 'hi' ? 'तापमान को 21°C से 24°C करने पर 18% बिजली सीधे बचती है।' : 'Each degree below 24°C increases compressor power draw by ~6%.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PERSONALIZED AI RECOMMENDATIONS FEED */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-lime-bright" />
            <h3 className="text-base font-bold text-ivory">
              {lang === 'hi' ? 'एआई सिफारिशें एवं सुधारात्मक उपाय' : 'Actionable AI Recommendations Feed'}
            </h3>
          </div>
          <span className="text-xs font-mono text-lime-bright">
            {insights.length} Heuristic Recommendations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-5 rounded-3xl glass-card border border-amber-500/25 flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase text-amber-400">
                      {(insight.category || 'Efficiency').toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-bright font-semibold">
                    {insight.estimatedImpact}
                  </span>
                </div>

                <h4 className="text-base font-bold text-ivory font-hindi">
                  {lang === 'hi' ? insight.title_hi : insight.title}
                </h4>
                <p className="text-xs text-ivory/80 mt-1 font-hindi leading-relaxed">
                  {lang === 'hi' ? insight.description_hi : insight.description}
                </p>

                <div className="mt-3 p-3 rounded-xl bg-charcoal-900 border border-white/5 text-[11px] text-ivory-dark font-hindi">
                  <span className="text-amber-300 font-semibold">{lang === 'hi' ? 'कारण: ' : 'Root Cause: '}</span>
                  {insight.whyItMatters}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-ivory-dark font-mono">1-Click Tuning</span>
                <button
                  onClick={() => applyInsightAction(insight.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-charcoal-950" />
                  <span>{insight.actionLabel}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. PRINTABLE REPORT MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-charcoal-900 border border-amber-500/35 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-ivory">
                    WATTWISE <span className="text-amber-400">AI</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-bright">
                    Official Energy Audit
                  </span>
                </div>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  Residential Smart Home Energy Intelligence Summary
                </p>
              </div>

              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 rounded-xl bg-charcoal-800 text-ivory hover:bg-charcoal-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Content Summary */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-charcoal-850 border border-white/5 font-mono">
                <div>
                  <span className="text-[10px] text-ivory-dark block">LIVE POWER</span>
                  <span className="text-base font-bold text-amber-300">{currentWatts} W</span>
                </div>
                <div>
                  <span className="text-[10px] text-ivory-dark block">TODAY ENERGY</span>
                  <span className="text-base font-bold text-ivory">{todayKwh} kWh</span>
                </div>
                <div>
                  <span className="text-[10px] text-ivory-dark block">EST. MONTHLY</span>
                  <span className="text-base font-bold text-lime-bright">₹{telemetry?.projectedMonthlyBill || 4080}</span>
                </div>
                <div>
                  <span className="text-[10px] text-ivory-dark block">EFFICIENCY</span>
                  <span className="text-base font-bold text-ivory">{telemetry?.efficiencyScore || 85}%</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-ivory mb-2">Household Appliances Consumption</h5>
                <div className="divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden">
                  {appliances.slice(0, 6).map((a) => (
                    <div key={a.id} className="p-2.5 flex items-center justify-between bg-charcoal-850/50">
                      <div>
                        <span className="font-semibold text-ivory">{a.name}</span>
                        <span className="text-[10px] text-ivory-dark ml-2">({a.room})</span>
                      </div>
                      <div className="flex items-center gap-4 font-mono">
                        <span>{a.power_watts}W</span>
                        <span className="text-amber-300">~₹{Math.round(((a.power_watts * a.daily_hours) / 1000) * tariff * 30)}/mo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-bold text-ivory mb-1">Key Diagnostic Findings</h5>
                <p className="text-ivory-dark text-[11px] leading-relaxed">
                  Peak window load concentration occurs between 18:00 and 22:00. Vampire standby draw on living room circuits contributes ~₹160 monthly. Shifting washer usage to off-peak hours and adjusting AC to 24°C provides an estimated ₹1,779/month savings.
                </p>
              </div>
            </div>

            {/* Print Trigger */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 text-ivory text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs shadow-md"
              >
                <Printer className="w-4 h-4 text-charcoal-950" />
                <span>Confirm & Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
