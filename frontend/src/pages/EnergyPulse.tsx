// WattWise AI — Energy Pulse: Real-time heartbeat of home electrical telemetry
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Zap, Clock, TrendingUp, Flame, ShieldCheck,
  RefreshCw, Sliders
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { useStore } from '../store';
import EnergyPulseVisual from '../components/EnergyPulseVisual';
import { playSound } from '../sound';

const SIMULATION_MODES = [
  { id: 'Normal Day', label: 'Normal Day', desc: 'Standard weekday profile' },
  { id: 'Peak Heatwave', label: 'Heatwave', desc: 'High AC cooling load' },
  { id: 'Green Energy Day', label: 'Green Energy', desc: 'Solar-aligned usage' },
  { id: 'Vampire Hunt', label: 'Vampire Mode', desc: 'High phantom standby' },
];

export default function EnergyPulse() {
  const dashboard = useStore((s) => s.dashboard);
  const loading = useStore((s) => s.loadingDashboard);
  const fetchDashboard = useStore((s) => s.fetchDashboard);
  const appliances = useStore((s) => s.appliances);
  const fetchAppliances = useStore((s) => s.fetchAppliances);
  const setSimulationMode = useStore((s) => s.setSimulationMode);

  const [activeMode, setActiveMode] = useState('Normal Day');
  const [pulseSize, setPulseSize] = useState<'sm' | 'md' | 'lg'>('md');

  useEffect(() => {
    fetchDashboard();
    fetchAppliances();
  }, []);

  const handleModeChange = async (mode: string) => {
    playSound('click');
    setActiveMode(mode);
    await setSimulationMode(mode);
    await fetchDashboard();
  };

  const currentPower = dashboard?.currentPower || 1840;
  const efficiency = dashboard?.efficiencyScore || 78;

  // Chart data from dashboard hourly trend
  const trendData = (dashboard?.energyTrend || [1.2, 1.4, 1.1, 0.9, 0.8, 1.5, 2.2, 2.8, 2.4, 2.1, 1.9, 2.5]).map((val, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    kWh: Number(val.toFixed(2)),
  }));

  const activeAppliancesList = (appliances || []).filter((a) => a && a.is_on === 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-ww-amber animate-pulse" />
            <h1 className="text-2xl font-bold text-ww-ivory">Energy Pulse</h1>
          </div>
          <p className="text-sm text-ww-ivory-dim mt-1">
            Sub-second real-time telemetry and harmonic energy stream
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playSound('tick');
              fetchDashboard();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ww-card border border-ww-border/60 text-xs font-medium text-ww-ivory hover:border-ww-amber/50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-ww-amber' : ''}`} />
            Sync Pulse
          </button>
        </div>
      </div>

      {/* Main Pulse Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Animated Heartbeat Visual Centerpiece */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 bg-ww-card/70 border border-ww-border/50 rounded-2xl p-6 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden"
        >
          <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-medium text-ww-ivory-dim">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Telemetry Stream
          </div>

          <div className="py-6">
            <EnergyPulseVisual
              currentPower={currentPower}
              maxPower={5000}
              efficiency={efficiency}
              size={pulseSize}
            />
          </div>

          {/* Pulse scale selector */}
          <div className="flex items-center gap-2 mt-2 bg-ww-surface/80 px-3 py-1.5 rounded-full border border-ww-border/50 text-xs">
            <span className="text-ww-ivory-dim mr-1">Scale:</span>
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  playSound('tick');
                  setPulseSize(s);
                }}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                  pulseSize === s ? 'bg-ww-amber text-ww-bg font-bold' : 'text-ww-ivory-dim hover:text-ww-ivory'
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Live Metrics & Simulation Modes */}
        <div className="lg:col-span-5 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-ww-card/70 border border-ww-border/50 rounded-2xl p-5 backdrop-blur-xl"
          >
            <h3 className="text-sm font-semibold text-ww-ivory flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-ww-amber" />
              Live Electrical Metrics
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-ww-surface/60 border border-ww-border/40">
                <p className="text-xs text-ww-ivory-dim">Instant Load</p>
                <p className="text-xl font-bold text-ww-amber mt-0.5">{currentPower} W</p>
                <p className="text-[11px] text-ww-ivory-dim/70 mt-0.5">{(currentPower / 1000).toFixed(2)} kW</p>
              </div>

              <div className="p-3 rounded-xl bg-ww-surface/60 border border-ww-border/40">
                <p className="text-xs text-ww-ivory-dim">Efficiency Score</p>
                <p className="text-xl font-bold text-ww-lime mt-0.5">{efficiency}%</p>
                <p className="text-[11px] text-emerald-400 mt-0.5">High Performance</p>
              </div>

              <div className="p-3 rounded-xl bg-ww-surface/60 border border-ww-border/40">
                <p className="text-xs text-ww-ivory-dim">Today's Units</p>
                <p className="text-xl font-bold text-ww-orange mt-0.5">
                  {dashboard?.todayConsumption ? dashboard.todayConsumption.toFixed(1) : '12.4'} kWh
                </p>
                <p className="text-[11px] text-ww-ivory-dim/70 mt-0.5">Baseline: 15 kWh</p>
              </div>

              <div className="p-3 rounded-xl bg-ww-surface/60 border border-ww-border/40">
                <p className="text-xs text-ww-ivory-dim">Today's Cost</p>
                <p className="text-xl font-bold text-ww-copper mt-0.5">
                  ₹{dashboard?.todayCost ? Math.round(dashboard.todayCost) : 98}
                </p>
                <p className="text-[11px] text-ww-ivory-dim/70 mt-0.5">At ₹8.00/unit</p>
              </div>
            </div>
          </motion.div>

          {/* Simulation Mode Selector */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-ww-card/70 border border-ww-border/50 rounded-2xl p-5 backdrop-blur-xl"
          >
            <h3 className="text-sm font-semibold text-ww-ivory flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-ww-orange" />
              Scenario Simulation Mode
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {SIMULATION_MODES.map((m) => {
                const isSelected = activeMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModeChange(m.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'bg-ww-amber/15 border-ww-amber/60 text-ww-ivory'
                        : 'bg-ww-surface/50 border-ww-border/40 text-ww-ivory-dim hover:border-ww-border hover:text-ww-ivory'
                    }`}
                  >
                    <p className={`font-semibold ${isSelected ? 'text-ww-amber' : ''}`}>{m.label}</p>
                    <p className="text-[10px] text-ww-ivory-dim/70 mt-0.5 truncate">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Hourly Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-ww-card/70 border border-ww-border/50 rounded-2xl p-6 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-ww-ivory flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-ww-amber" />
              24-Hour Energy Consumption Curve
            </h3>
            <p className="text-xs text-ww-ivory-dim mt-0.5">Real-time load fluctuation by hour</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-ww-amber/10 border border-ww-amber/30 text-ww-amber font-mono font-medium">
            Hourly kWh
          </span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="pulseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4a047" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#d4a047" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" stroke="#666" fontSize={11} tickLine={false} />
              <YAxis stroke="#666" fontSize={11} tickLine={false} unit=" kWh" />
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
                dataKey="kWh"
                stroke="#d4a047"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#pulseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Active Appliances Reporting Pulse */}
      <div className="bg-ww-card/70 border border-ww-border/50 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-base font-bold text-ww-ivory flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-blue-400" />
          Active Loads Driving Current Pulse ({activeAppliancesList.length})
        </h3>

        {activeAppliancesList.length === 0 ? (
          <p className="text-xs text-ww-ivory-dim">No high-power appliances are currently active.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activeAppliancesList.map((app) => (
              <div
                key={app.id}
                className="p-3.5 rounded-xl bg-ww-surface/60 border border-ww-border/50 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-ww-ivory">{app.name}</p>
                  <p className="text-[11px] text-ww-ivory-dim capitalize">{app.category || 'General'}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-ww-amber">{app.power_watts} W</span>
                  <div className="flex items-center gap-1 justify-end text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Online
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
