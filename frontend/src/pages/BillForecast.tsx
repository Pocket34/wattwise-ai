// WattWise AI — Bill Forecast: Predictive tariff modeling & slab optimization
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt, TrendingDown, AlertCircle, ArrowUpRight,
  ShieldAlert, RefreshCw, Sparkles, Layers
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { useStore } from '../store';
import { playSound } from '../sound';

export default function BillForecast() {
  const billForecast = useStore((s) => s.billForecast);
  const loading = useStore((s) => s.loadingBillForecast);
  const fetchBillForecast = useStore((s) => s.fetchBillForecast);

  useEffect(() => {
    fetchBillForecast();
  }, []);

  const projectedBill = billForecast?.projectedBill || 3280;
  const optimizedBill = billForecast?.optimizedBill || 2640;
  const savings = Math.max(0, projectedBill - optimizedBill);
  const currentUsage = billForecast?.currentUsage || 280;
  const projectedMonthly = billForecast?.projectedMonthly || 410;

  // Projection chart data
  const chartData = (billForecast?.dailyProjection || Array.from({ length: 30 }, (_, i) => Math.round(110 * (i + 1) * 1.05))).map((cost, idx) => ({
    day: `Day ${idx + 1}`,
    cost: cost,
    optimized: Math.round(cost * 0.8),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-ww-amber" />
            <h1 className="text-2xl font-bold text-ww-ivory">Bill Forecast &amp; Slab Analyzer</h1>
          </div>
          <p className="text-sm text-ww-ivory-dim mt-1">
            Predictive tariff intelligence to avoid crossing punitive electricity tier slabs
          </p>
        </div>

        <button
          onClick={() => {
            playSound('tick');
            fetchBillForecast();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ww-card border border-ww-border/60 text-xs font-medium text-ww-ivory hover:border-ww-amber/50 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-ww-amber' : ''}`} />
          Recalculate
        </button>
      </div>

      {/* Headline Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl">
          <p className="text-xs text-ww-ivory-dim">Projected Month-End</p>
          <p className="text-2xl font-bold text-ww-ivory mt-1">₹{projectedBill.toLocaleString('en-IN')}</p>
          <p className="text-xs text-ww-orange mt-1">Status Quo Projection</p>
        </div>

        <div className="p-5 rounded-2xl bg-ww-card/70 border border-ww-amber/40 backdrop-blur-xl bg-ww-amber/5">
          <p className="text-xs text-ww-amber">WattWise Optimized Bill</p>
          <p className="text-2xl font-bold text-ww-amber mt-1">₹{optimizedBill.toLocaleString('en-IN')}</p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            Save ₹{savings.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl">
          <p className="text-xs text-ww-ivory-dim">Units Projected</p>
          <p className="text-2xl font-bold text-ww-ivory mt-1">{projectedMonthly} kWh</p>
          <p className="text-xs text-ww-ivory-dim/70 mt-1">Current MTD: {currentUsage} kWh</p>
        </div>

        <div className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl">
          <p className="text-xs text-ww-ivory-dim">Active Slab Tier</p>
          <p className="text-2xl font-bold text-ww-copper mt-1">Tier 3 (₹8.00/u)</p>
          <p className="text-xs text-ww-ivory-dim/70 mt-1">30 units below Tier 4 jump</p>
        </div>
      </div>

      {/* Cumulative 30-Day Projection Chart */}
      <div className="bg-ww-card/70 border border-ww-border/50 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-ww-ivory flex items-center gap-2">
              <Receipt className="w-4 h-4 text-ww-amber" />
              Cumulative Monthly Billing Projection (₹)
            </h3>
            <p className="text-xs text-ww-ivory-dim mt-0.5">
              Comparison: Unmanaged consumption curve vs WattWise optimized trajectory
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-ww-ivory-dim">
              <span className="w-3 h-3 rounded-full bg-ww-orange inline-block" /> Unmanaged
            </span>
            <span className="flex items-center gap-1.5 text-ww-amber">
              <span className="w-3 h-3 rounded-full bg-ww-amber inline-block" /> WattWise AI
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="unmanagedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e8762d" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#e8762d" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="optimizedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4a047" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d4a047" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#666" fontSize={11} tickLine={false} />
              <YAxis stroke="#666" fontSize={11} tickLine={false} unit="₹" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1c1c1c',
                  border: '1px solid #2a2a2a',
                  borderRadius: '12px',
                  color: '#f5f0e8',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="cost"
                name="Unmanaged (₹)"
                stroke="#e8762d"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#unmanagedGrad)"
              />
              <Area
                type="monotone"
                dataKey="optimized"
                name="Optimized (₹)"
                stroke="#d4a047"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#optimizedGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tariff Slab Progression Breakdown */}
      <div className="bg-ww-card/70 border border-ww-border/50 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-base font-bold text-ww-ivory flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-ww-amber" />
          Domestic Electricity Tariff Slab Model
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-ww-surface/60 border border-emerald-500/30">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Tier 1: 0 — 100 kWh</span>
            <p className="text-lg font-bold text-ww-ivory mt-1">₹4.50 / unit</p>
            <p className="text-ww-ivory-dim mt-1">Subsidized lifeline band. 100% completed.</p>
          </div>

          <div className="p-4 rounded-xl bg-ww-surface/60 border border-ww-amber/40 bg-ww-amber/5">
            <span className="text-[10px] uppercase font-bold text-ww-amber">Tier 2: 101 — 300 kWh (Active)</span>
            <p className="text-lg font-bold text-ww-amber mt-1">₹7.00 / unit</p>
            <p className="text-ww-ivory-dim mt-1">Current active consumption bracket. 180 units logged.</p>
          </div>

          <div className="p-4 rounded-xl bg-ww-surface/60 border border-ww-orange/30">
            <span className="text-[10px] uppercase font-bold text-ww-orange">Tier 3: 301+ kWh (Penalty)</span>
            <p className="text-lg font-bold text-ww-orange mt-1">₹9.50 / unit</p>
            <p className="text-ww-ivory-dim mt-1">WattWise governors ensure home does not exceed 300 units.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
