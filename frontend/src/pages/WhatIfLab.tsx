// WattWise AI — What-If Lab: Interactive scenario simulation & tariff optimization
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FlaskConical, Sliders, IndianRupee, Zap, Leaf,
  CheckCircle2, RefreshCw, Sparkles, TrendingDown
} from 'lucide-react';
import { useStore } from '../store';
import { playSound } from '../sound';
import type { WhatIfParams } from '../types';

export default function WhatIfLab() {
  const whatIfResult = useStore((s) => s.whatIfResult);
  const loading = useStore((s) => s.loadingWhatIf);
  const calculateWhatIf = useStore((s) => s.calculateWhatIf);
  const applyWhatIf = useStore((s) => s.applyWhatIf);
  const showNotification = useStore((s) => s.showNotification);

  const [params, setParams] = useState<WhatIfParams>({
    ac_temp_delta: 2,
    ac_hours: 2,
    geyser_hours: 1,
    fan_hours: 2,
    light_hours: 1,
    washing_freq: 2,
    peak_usage_pct: 25,
  });

  const [applying, setApplying] = useState(false);

  // Auto-calculate when params change
  useEffect(() => {
    calculateWhatIf(params);
  }, [params]);

  const updateParam = (key: keyof WhatIfParams, val: number) => {
    playSound('tick');
    setParams((p) => ({ ...p, [key]: val }));
  };

  const handleApply = async () => {
    playSound('activate');
    setApplying(true);
    try {
      await applyWhatIf(params);
      playSound('success');
      showNotification('Simulation applied to Smart Rules & target baseline!', 'success');
    } catch (e: any) {
      playSound('warning');
      showNotification(e.message || 'Failed to apply scenario', 'error');
    } finally {
      setApplying(false);
    }
  };

  const currentBill = whatIfResult?.currentBill || 3120;
  const optimizedBill = whatIfResult?.optimizedBill || 2480;
  const savings = Math.max(0, currentBill - optimizedBill);
  const savingsPct = Math.round((savings / currentBill) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-ww-amber" />
          <h1 className="text-2xl font-bold text-ww-ivory">What-If Simulation Lab</h1>
        </div>
        <p className="text-sm text-ww-ivory-dim mt-1">
          Model behavioral shifts, thermostat adjustments, and peak-hour avoidance in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-ww-card/70 border border-ww-border/50 rounded-2xl p-6 backdrop-blur-xl space-y-5">
            <h2 className="text-base font-bold text-ww-ivory flex items-center gap-2">
              <Sliders className="w-4 h-4 text-ww-amber" />
              Scenario Parameters
            </h2>

            {/* Slider 1: AC Temp Delta */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ww-ivory">AC Setpoint Increase (e.g. 24°C &rarr; 26°C)</span>
                <span className="font-bold text-ww-amber">+{params.ac_temp_delta}°C</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={params.ac_temp_delta}
                onChange={(e) => updateParam('ac_temp_delta', Number(e.target.value))}
                className="w-full accent-ww-amber cursor-pointer h-1.5 bg-ww-surface rounded-lg"
              />
              <p className="text-[10px] text-ww-ivory-dim/70">Each +1°C saves approx. 6% of cooling power.</p>
            </div>

            {/* Slider 2: AC Hours reduction */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ww-ivory">AC Runtime Reduction</span>
                <span className="font-bold text-ww-amber">-{params.ac_hours} hrs/day</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={params.ac_hours}
                onChange={(e) => updateParam('ac_hours', Number(e.target.value))}
                className="w-full accent-ww-amber cursor-pointer h-1.5 bg-ww-surface rounded-lg"
              />
            </div>

            {/* Slider 3: Geyser runtime reduction */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ww-ivory">Geyser / Water Heater Reduction</span>
                <span className="font-bold text-ww-amber">-{params.geyser_hours} hrs/day</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="0.5"
                value={params.geyser_hours}
                onChange={(e) => updateParam('geyser_hours', Number(e.target.value))}
                className="w-full accent-ww-amber cursor-pointer h-1.5 bg-ww-surface rounded-lg"
              />
            </div>

            {/* Slider 4: Fan runtime reduction */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ww-ivory">Ceiling Fan & BLDC Runtime Reduction</span>
                <span className="font-bold text-ww-amber">-{params.fan_hours} hrs/day</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={params.fan_hours}
                onChange={(e) => updateParam('fan_hours', Number(e.target.value))}
                className="w-full accent-ww-amber cursor-pointer h-1.5 bg-ww-surface rounded-lg"
              />
            </div>

            {/* Slider 5: Lighting reduction */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ww-ivory">Ambient Lighting Hours Saved</span>
                <span className="font-bold text-ww-amber">-{params.light_hours} hrs/day</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="0.5"
                value={params.light_hours}
                onChange={(e) => updateParam('light_hours', Number(e.target.value))}
                className="w-full accent-ww-amber cursor-pointer h-1.5 bg-ww-surface rounded-lg"
              />
            </div>

            {/* Slider 6: Washing Machine Frequency */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ww-ivory">Washing Machine Schedule (Loads / Week)</span>
                <span className="font-bold text-ww-amber">{params.washing_freq} loads/wk</span>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                step="1"
                value={params.washing_freq}
                onChange={(e) => updateParam('washing_freq', Number(e.target.value))}
                className="w-full accent-ww-amber cursor-pointer h-1.5 bg-ww-surface rounded-lg"
              />
            </div>

            {/* Slider 7: Peak usage shift */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ww-ivory">Peak Tariff Load Shifted to Off-Peak</span>
                <span className="font-bold text-ww-orange">{params.peak_usage_pct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={params.peak_usage_pct}
                onChange={(e) => updateParam('peak_usage_pct', Number(e.target.value))}
                className="w-full accent-ww-orange cursor-pointer h-1.5 bg-ww-surface rounded-lg"
              />
              <p className="text-[10px] text-ww-ivory-dim/70">Runs heavy washing & pumping during low-tariff hours.</p>
            </div>
          </div>
        </div>

        {/* Impact Prediction Card */}
        <div className="lg:col-span-5 space-y-4">
          <motion.div
            layout
            className="bg-ww-card/80 border border-ww-amber/40 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-ww-amber animate-spin-slow" />
              <h3 className="text-base font-bold text-ww-ivory">Projected Outcome</h3>
            </div>

            {/* Big Savings Number */}
            <div className="p-4 rounded-xl bg-ww-amber/10 border border-ww-amber/30 text-center mb-5">
              <p className="text-xs font-semibold text-ww-amber">Projected Monthly Savings</p>
              <p className="text-3xl font-extrabold text-ww-amber mt-1">₹{savings.toLocaleString('en-IN')}</p>
              <p className="text-xs font-medium text-emerald-400 mt-1 flex items-center justify-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                {savingsPct}% Bill Reduction
              </p>
            </div>

            {/* Comparison Details */}
            <div className="space-y-3 text-xs mb-6">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-ww-surface/50 border border-ww-border/30">
                <span className="text-ww-ivory-dim">Current Baseline Bill:</span>
                <span className="font-bold text-ww-ivory">₹{currentBill.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-ww-surface/50 border border-ww-border/30">
                <span className="text-ww-ivory-dim">Simulated Bill:</span>
                <span className="font-bold text-emerald-400">₹{optimizedBill.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-ww-surface/50 border border-ww-border/30">
                <span className="text-ww-ivory-dim">Energy Reduction:</span>
                <span className="font-bold text-ww-orange">
                  {whatIfResult?.currentConsumption && whatIfResult?.optimizedConsumption
                    ? (whatIfResult.currentConsumption - whatIfResult.optimizedConsumption).toFixed(1)
                    : '64.0'} kWh/mo
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-ww-surface/50 border border-ww-border/30">
                <span className="text-ww-ivory-dim">CO2 Avoided:</span>
                <span className="font-bold text-ww-lime">
                  {whatIfResult?.currentCO2 && whatIfResult?.optimizedCO2
                    ? (whatIfResult.currentCO2 - whatIfResult.optimizedCO2).toFixed(1)
                    : '52.5'} kg/mo
                </span>
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApply}
              disabled={applying}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-ww-amber to-ww-orange text-ww-bg font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-ww-amber/20 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className={`w-4 h-4 ${applying ? 'animate-spin' : ''}`} />
              {applying ? 'Applying...' : 'Apply Scenario to Automation'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
