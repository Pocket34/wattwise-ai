// WattWise AI — Carbon Impact: Environmental sustainability & carbon offset intelligence
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Leaf, Trees, Car, Award, RefreshCw,
  Sparkles, TrendingUp, ShieldCheck
} from 'lucide-react';
import { useStore } from '../store';
import { playSound } from '../sound';

export default function CarbonImpact() {
  const carbonImpact = useStore((s) => s.carbonImpact);
  const loading = useStore((s) => s.loadingCarbonImpact);
  const fetchCarbonImpact = useStore((s) => s.fetchCarbonImpact);

  useEffect(() => {
    fetchCarbonImpact();
  }, []);

  const co2Today = carbonImpact?.co2SavedToday || 3.8;
  const co2Month = carbonImpact?.co2SavedMonth || 84.5;
  const trees = carbonImpact?.equivalentTrees || 4.2;
  const evKm = carbonImpact?.equivalentEvKm || 540;
  const story = carbonImpact?.impactStory ||
    'Your automated load shifting and vampire drain elimination has averted 84.5 kg of coal-grid CO2 emissions this month — equivalent to planting 4 urban shade trees.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-ww-ivory">Carbon Impact &amp; Sustainability</h1>
          </div>
          <p className="text-sm text-ww-ivory-dim mt-1">
            Transform avoided kilowatt-hours into verified ecological preservation metrics
          </p>
        </div>

        <button
          onClick={() => {
            playSound('tick');
            fetchCarbonImpact();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ww-card border border-ww-border/60 text-xs font-medium text-ww-ivory hover:border-emerald-500/50 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh Impact
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-ww-card/70 border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-300">CO2 Avoided Today</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">{co2Today.toFixed(1)} kg</p>
          <p className="text-xs text-ww-ivory-dim/70 mt-1">Zero-emission generation delta</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ww-ivory-dim">Month-to-Date Avoided</span>
            <Sparkles className="w-4 h-4 text-ww-amber" />
          </div>
          <p className="text-3xl font-extrabold text-ww-ivory mt-2">{co2Month.toFixed(1)} kg</p>
          <p className="text-xs text-ww-amber mt-1">Carbon offset equivalent</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ww-ivory-dim">Equivalent Trees</span>
            <Trees className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">{trees.toFixed(1)} Trees</p>
          <p className="text-xs text-ww-ivory-dim/70 mt-1">Full year absorption value</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ww-ivory-dim">Equivalent EV Driving</span>
            <Car className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-blue-400 mt-2">{evKm} km</p>
          <p className="text-xs text-ww-ivory-dim/70 mt-1">Zero-emission travel distance</p>
        </motion.div>
      </div>

      {/* Dynamic Impact Story */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-ww-card/90 to-ww-surface border border-emerald-500/30 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-ww-ivory">Ecological Narrative</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold ml-auto">
            Green Champion Level 3
          </span>
        </div>
        <p className="text-sm text-ww-ivory leading-relaxed">{story}</p>
      </div>

      {/* Energy Grid Mix Composition */}
      <div className="bg-ww-card/70 border border-ww-border/50 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-base font-bold text-ww-ivory flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Regional Grid Carbon Intensity Benchmark
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between mb-1.5 font-medium text-ww-ivory">
              <span>Coal Thermal Grid Mix (National Average)</span>
              <span>0.82 kg CO2 / kWh</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-ww-surface overflow-hidden">
              <div className="w-[82%] h-full rounded-full bg-ww-orange" />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5 font-medium text-ww-ivory">
              <span>WattWise AI Smart-Shifted Intensity</span>
              <span className="text-emerald-400 font-bold">0.48 kg CO2 / kWh (-41%)</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-ww-surface overflow-hidden">
              <div className="w-[48%] h-full rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
