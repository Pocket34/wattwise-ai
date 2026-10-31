// WattWise AI — Appliances: Real-time telemetry, load control & smart schedules
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Power, Zap, Clock, Shield, Search,
  SlidersHorizontal, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useStore } from '../store';
import { playSound } from '../sound';
import type { Appliance } from '../types';

export default function Appliances() {
  const appliances = useStore((s) => s.appliances);
  const loading = useStore((s) => s.loadingAppliances);
  const fetchAppliances = useStore((s) => s.fetchAppliances);
  const toggleAppliance = useStore((s) => s.toggleAppliance);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppliances();
  }, []);

  const handleToggle = async (id: string) => {
    playSound('toggle');
    setTogglingId(id);
    try {
      await toggleAppliance(id);
    } finally {
      setTogglingId(null);
    }
  };

  const categories = ['all', 'cooling', 'heating', 'kitchen', 'entertainment', 'lighting', 'utility'];

  const safeAppliances = Array.isArray(appliances) ? appliances : [];

  const filtered = safeAppliances.filter((a) => {
    if (!a) return false;
    const matchesSearch = (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (a.category && a.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || a.category?.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeCount = safeAppliances.filter((a) => a && a.is_on === 1).length;
  const totalWatts = safeAppliances
    .filter((a) => a && a.is_on === 1)
    .reduce((sum, a) => sum + (a.power_watts || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-ww-amber" />
            <h1 className="text-2xl font-bold text-ww-ivory">Connected Appliances</h1>
          </div>
          <p className="text-sm text-ww-ivory-dim mt-1">
            Manage power states, schedules, and load telemetry across your home
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-ww-ivory-dim absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search appliances..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-ww-card border border-ww-border/60 rounded-xl text-xs text-ww-ivory placeholder-ww-ivory-dim/50 focus:outline-none focus:border-ww-amber/50"
          />
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-ww-card/70 border border-ww-border/50">
          <p className="text-xs text-ww-ivory-dim">Total Connected</p>
          <p className="text-xl font-bold text-ww-ivory mt-1">{appliances.length}</p>
          <p className="text-[10px] text-ww-ivory-dim/70 mt-0.5">Discovered Devices</p>
        </div>

        <div className="p-4 rounded-xl bg-ww-card/70 border border-ww-border/50">
          <p className="text-xs text-ww-ivory-dim">Active Now</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{activeCount}</p>
          <p className="text-[10px] text-emerald-500/80 mt-0.5">Drawing current load</p>
        </div>

        <div className="p-4 rounded-xl bg-ww-card/70 border border-ww-border/50">
          <p className="text-xs text-ww-ivory-dim">Active Load</p>
          <p className="text-xl font-bold text-ww-amber mt-1">{totalWatts.toLocaleString('en-IN')} W</p>
          <p className="text-[10px] text-ww-amber-dim mt-0.5">{(totalWatts / 1000).toFixed(2)} kW combined</p>
        </div>

        <div className="p-4 rounded-xl bg-ww-card/70 border border-ww-border/50">
          <p className="text-xs text-ww-ivory-dim">Priority Reserved</p>
          <p className="text-xl font-bold text-blue-400 mt-1">
            {appliances.filter((a) => a.priority === 'high' || a.priority === 'essential').length}
          </p>
          <p className="text-[10px] text-blue-400/80 mt-0.5">Protected from load shedding</p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              playSound('tick');
              setSelectedCategory(cat);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-ww-amber text-ww-bg font-bold shadow-md shadow-ww-amber/15'
                : 'bg-ww-card border border-ww-border/50 text-ww-ivory-dim hover:text-ww-ivory hover:border-ww-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Appliance Cards */}
      {loading && appliances.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-ww-amber/30 border-t-ww-amber rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-ww-card/40 border border-ww-border/40 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-ww-ivory-dim mx-auto mb-2" />
          <p className="text-sm font-medium text-ww-ivory">No appliances found</p>
          <p className="text-xs text-ww-ivory-dim mt-1">Try adjusting your search filter or category selection</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((app) => {
              const isOn = app.is_on === 1;
              const isToggling = togglingId === app.id;

              return (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    isOn
                      ? 'bg-ww-card/90 border-ww-amber/40 shadow-lg shadow-ww-amber/5'
                      : 'bg-ww-card/40 border-ww-border/40 hover:border-ww-border/80'
                  }`}
                >
                  {/* Top Row: Name and Power Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isOn
                            ? 'bg-ww-amber/15 text-ww-amber'
                            : 'bg-ww-surface text-ww-ivory-dim/60'
                        }`}
                      >
                        <Zap className={`w-5 h-5 ${isOn ? 'animate-pulse text-ww-amber' : ''}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-ww-ivory">{app.name}</h3>
                        <p className="text-xs text-ww-ivory-dim capitalize">{app.category || 'General'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggle(app.id)}
                      disabled={isToggling}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        isOn
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-ww-surface border border-ww-border/60 text-ww-ivory-dim hover:text-ww-ivory hover:border-ww-border'
                      }`}
                      title={isOn ? 'Turn Off' : 'Turn On'}
                    >
                      <Power className={`w-4 h-4 ${isToggling ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-ww-border/30 text-xs">
                    <div>
                      <p className="text-[10px] text-ww-ivory-dim">Power</p>
                      <p className={`font-semibold mt-0.5 ${isOn ? 'text-ww-amber' : 'text-ww-ivory-dim'}`}>
                        {app.power_watts} W
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-ww-ivory-dim">Daily Usage</p>
                      <p className="font-semibold text-ww-ivory mt-0.5">
                        {app.daily_usage_hours || 4} hrs
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-ww-ivory-dim">Priority</p>
                      <p className={`font-semibold capitalize mt-0.5 ${
                        app.priority === 'high' || app.priority === 'essential'
                          ? 'text-ww-orange'
                          : 'text-ww-ivory-dim'
                      }`}>
                        {app.priority || 'Normal'}
                      </p>
                    </div>
                  </div>

                  {/* Schedule Footer if set */}
                  {app.schedule_start && app.schedule_end && (
                    <div className="mt-3 pt-2 flex items-center gap-1.5 text-[11px] text-ww-ivory-dim border-t border-ww-border/20">
                      <Clock className="w-3 h-3 text-ww-amber" />
                      <span>Scheduled: {app.schedule_start} — {app.schedule_end}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
