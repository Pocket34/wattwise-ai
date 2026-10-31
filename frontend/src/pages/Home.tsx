// WattWise AI — Home page: Intelligent overview dashboard
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, BarChart3, IndianRupee, Gauge, Power, PiggyBank,
  AlertTriangle, ArrowRight, TrendingDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useStore } from '../store';
import EnergyPulseVisual from '../components/EnergyPulseVisual';
import { playSound } from '../sound';

const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 1 });
const fmtCurrency = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function Home() {
  const dashboard = useStore((s) => s.dashboard);
  const loading = useStore((s) => s.loadingDashboard);
  const leaks = useStore((s) => s.leaks);
  const insights = useStore((s) => s.insights);
  const fetchDashboard = useStore((s) => s.fetchDashboard);
  const fetchLeaks = useStore((s) => s.fetchLeaks);
  const fetchInsights = useStore((s) => s.fetchInsights);
  const fixLeak = useStore((s) => s.fixLeak);

  useEffect(() => {
    fetchDashboard();
    fetchLeaks();
    fetchInsights();
  }, []);

  // First significant finding
  const safeLeaks = Array.isArray(leaks) ? leaks : [];
  const safeInsights = Array.isArray(insights) ? insights : [];
  const topLeak = safeLeaks[0];
  const topInsight = safeInsights[0];

  const statCards = dashboard ? [
    { label: 'Current Power', value: `${fmt(dashboard.currentPower)} W`, icon: Zap, color: 'text-ww-amber' },
    { label: "Today's Consumption", value: `${fmt(dashboard.todayConsumption)} kWh`, icon: BarChart3, color: 'text-ww-orange' },
    { label: "Today's Cost", value: fmtCurrency(dashboard.todayCost), icon: IndianRupee, color: 'text-ww-copper' },
    { label: 'Efficiency Score', value: `${dashboard.efficiencyScore}%`, icon: Gauge, color: 'text-ww-lime' },
    { label: 'Active Appliances', value: `${dashboard.activeAppliances}`, icon: Power, color: 'text-blue-400' },
    { label: 'Potential Savings', value: fmtCurrency(dashboard.potentialSavings), icon: PiggyBank, color: 'text-emerald-400' },
  ] : [];

  // Chart data from energy trend
  const trendData = (dashboard?.energyTrend || []).map((val, i) => ({
    hour: `${i}:00`,
    kWh: val,
  }));

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-ww-amber/30 border-t-ww-amber rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ww-ivory">Dashboard</h1>
        <p className="text-sm text-ww-ivory-dim mt-1">Your home energy intelligence at a glance</p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            className="glass-card p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <p className="number-mono text-xl font-bold text-ww-ivory">{card.value}</p>
            <p className="text-xs text-ww-ivory-dim mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Energy Pulse + Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Pulse */}
        <motion.div
          className="glass-card p-6 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold text-ww-ivory-dim uppercase tracking-widest mb-6">
            Energy Pulse
          </h2>
          <EnergyPulseVisual
            currentPower={dashboard?.currentPower || 0}
            efficiency={dashboard?.efficiencyScore || 70}
            size="lg"
          />
          <p className="text-xs text-ww-ivory-dim mt-6">
            Real-time power consumption heartbeat
          </p>
        </motion.div>

        {/* What WattWise AI Noticed */}
        <motion.div
          className="glass-card p-6 flex flex-col"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-ww-amber" />
            <h2 className="text-sm font-semibold text-ww-ivory-dim uppercase tracking-widest">
              What WattWise AI Noticed
            </h2>
          </div>

          {topLeak ? (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-ww-orange/15 text-ww-orange border border-ww-orange/30">
                    {topLeak.type}
                  </span>
                  <span className="text-xs text-ww-ivory-dim">
                    {topLeak.confidence}% confidence
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-ww-ivory">
                  {topLeak.applianceName || 'Appliance'}: Energy Leak Detected
                </h3>
                <p className="text-sm text-ww-ivory-dim leading-relaxed">
                  {topLeak.description}
                </p>
                <div className="flex gap-4 text-sm">
                  <span className="text-ww-orange">
                    Wasting {fmt(topLeak.waste_kwh)} kWh/day
                  </span>
                  <span className="text-ww-copper">
                    ≈ {fmtCurrency(topLeak.waste_cost)}/month
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  playSound('activate');
                  fixLeak(topLeak.id);
                }}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl
                  bg-ww-amber/15 border border-ww-amber/30 text-ww-amber font-medium text-sm
                  hover:bg-ww-amber/25 transition-all"
              >
                <TrendingDown className="w-4 h-4" />
                Apply Recommendation
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : topInsight ? (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-ww-amber/15 text-ww-amber border border-ww-amber/30">
                  {topInsight.category}
                </span>
                <h3 className="text-lg font-semibold text-ww-ivory">{topInsight.title}</h3>
                <p className="text-sm text-ww-ivory-dim">{topInsight.description}</p>
                <p className="text-sm text-ww-lime">{topInsight.recommended_action}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-ww-ivory-dim">All clear! Your home is running efficiently. ✨</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Energy Trend Chart */}
      {trendData.length > 0 && (
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-sm font-semibold text-ww-ivory-dim uppercase tracking-widest mb-4">
            24-Hour Energy Trend
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4a047" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4a047" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="hour"
                  stroke="#4a4a4a"
                  tick={{ fill: '#b8b0a0', fontSize: 11 }}
                  axisLine={{ stroke: '#2a2a2a' }}
                />
                <YAxis
                  stroke="#4a4a4a"
                  tick={{ fill: '#b8b0a0', fontSize: 11 }}
                  axisLine={{ stroke: '#2a2a2a' }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1c1c1c',
                    border: '1px solid #2a2a2a',
                    borderRadius: '12px',
                    color: '#f5f0e8',
                    fontSize: '13px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="kWh"
                  stroke="#d4a047"
                  strokeWidth={2}
                  fill="url(#trendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}
