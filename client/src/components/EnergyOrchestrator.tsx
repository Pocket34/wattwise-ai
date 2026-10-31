import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import {
  Zap,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Home,
  Cpu,
  Radio,
  CheckCircle2,
  Wind,
  ShieldCheck,
  Power
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';
import confetti from 'canvas-confetti';

export const EnergyOrchestrator: React.FC = () => {
  const { appliances, setApplianceTemp, refreshStatus, showNotification, lang, telemetry } = useEnergy();
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applied, setApplied] = useState<boolean>(false);

  const ac = appliances.find((a) => a.id === 'ac');
  const totalWatts = telemetry?.currentWatts || 1800;
  const acWatts = ac && ac.is_on ? ac.power_watts : 0;
  const acSharePct = totalWatts > 0 ? Math.round((acWatts / totalWatts) * 100) : 0;

  const currentAcTemp = ac?.temp_setpoint || 22;
  const isAcSuboptimal = currentAcTemp < 24;

  const handleApplyOptimization = async () => {
    setIsApplying(true);
    soundManager.playToggleClick(true);

    try {
      // Raise AC temperature to 24°C
      await setApplianceTemp('ac', 24);
      soundManager.playSuccessChime();
      setApplied(true);

      showNotification(
        'success',
        lang === 'hi' ? 'ऑर्केस्ट्रेटर अनुकूलन लागू' : 'Orchestrator Optimization Applied',
        lang === 'hi'
          ? 'एसी को 24°C पर सेट किया गया। लोड 230W कम हुआ (बचत ~₹18/दिन)।'
          : 'AC thermostat elevated to 24°C. Load curtailed by ~230W (~₹18/day saved).'
      );

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}

      await refreshStatus();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="relative p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-charcoal-900 via-charcoal-900/95 to-charcoal-950 border border-amber-500/35 shadow-2xl overflow-hidden group">
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -left-24 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-copper-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-copper-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                {lang === 'hi' ? 'स्वायत्त ऊर्जा प्रवाह' : 'Autonomous Flow'}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-bright border border-lime-500/30 font-mono">
                Active Balancing
              </span>
            </div>
            <h2 className="text-xl font-black text-ivory tracking-tight">
              ENERGY ORCHESTRATOR
            </h2>
          </div>
        </div>

        <div className="text-xs font-mono text-ivory-dark px-3 py-1.5 rounded-xl bg-charcoal-950 border border-white/10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-lime-bright animate-ping" />
          <span>Real-time Tri-Node Dispatch</span>
        </div>
      </div>

      {/* Tri-Node Visual Flow Diagram: HOME -> DEVICES -> ENERGY GRID */}
      <div className="p-5 rounded-2xl bg-charcoal-950/80 border border-white/5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-3">
          {/* Node 1: HOME */}
          <div className="p-4 rounded-2xl bg-charcoal-900 border border-white/10 flex flex-col items-center text-center space-y-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center mb-1">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-ivory">SMART HOME</span>
            <span className="text-[10px] font-mono text-ivory-dark">5 Active Zones</span>
            <span className="text-xs font-mono font-bold text-amber-300 mt-1">
              {totalWatts} W
            </span>
          </div>

          {/* Animated Arrow 1 */}
          <div className="hidden md:flex flex-col items-center justify-center text-amber-400/80 space-y-1">
            <div className="flex items-center gap-1 font-mono text-[10px] text-amber-300">
              <Zap className="w-3 h-3 animate-bounce" />
              <span>Telemetry</span>
            </div>
            <div className="w-full flex items-center justify-center">
              <div className="h-0.5 w-full bg-gradient-to-r from-amber-500/40 via-amber-400 to-amber-500/40 animate-pulse" />
              <ArrowRight className="w-4 h-4 text-amber-400 -ml-1" />
            </div>
          </div>

          {/* Node 2: DEVICES */}
          <div className="p-4 rounded-2xl bg-charcoal-900 border border-amber-500/30 flex flex-col items-center text-center space-y-1 shadow-lg shadow-amber-500/10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-400 flex items-center justify-center mb-1">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-ivory">CONNECTED FLEET</span>
            <span className="text-[10px] font-mono text-lime-bright">
              {appliances.filter((a) => a.is_on === 1).length} Units Active
            </span>
            <span className="text-xs font-mono font-bold text-ivory mt-1">
              Matter &amp; Google Home
            </span>
          </div>

          {/* Animated Arrow 2 */}
          <div className="hidden md:flex flex-col items-center justify-center text-amber-400/80 space-y-1">
            <div className="flex items-center gap-1 font-mono text-[10px] text-lime-bright">
              <Zap className="w-3 h-3 animate-bounce" />
              <span>Grid Balance</span>
            </div>
            <div className="w-full flex items-center justify-center">
              <div className="h-0.5 w-full bg-gradient-to-r from-amber-500/40 via-lime-400 to-lime-500/40 animate-pulse" />
              <ArrowRight className="w-4 h-4 text-lime-bright -ml-1" />
            </div>
          </div>

          {/* Node 3: ENERGY GRID */}
          <div className="p-4 rounded-2xl bg-charcoal-900 border border-white/10 flex flex-col items-center text-center space-y-1">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center mb-1">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-ivory">UTILITY GRID</span>
            <span className="text-[10px] font-mono text-ivory-dark">₹8.00 / kWh Slab</span>
            <span className="text-xs font-mono font-bold text-lime-electric mt-1">
              Co2: {telemetry?.co2TodayKg || 1.4} kg
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Observation & 1-Click Action Recommendation */}
      <div className="p-5 rounded-2xl bg-charcoal-950 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400">
              AI ORCHESTRATOR INSIGHT
            </span>
            {ac && ac.is_on && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                AC Consuming {acSharePct}% of Total Power
              </span>
            )}
          </div>

          <p className="text-xs text-ivory font-hindi leading-relaxed">
            {isAcSuboptimal
              ? (lang === 'hi'
                ? `मास्टर बेडरूम एसी वर्तमान में ${currentAcTemp}°C पर चल रहा है, जो कुल घरेलू बिजली का ${acSharePct}% उपभोग कर रहा है। तापमान को 24°C करने से बिना आराम खोए बिजली में तुरंत बचत होगी।`
                : `AC is consuming ${acSharePct}% of current household power at ${currentAcTemp}°C. Raising setpoint to 24°C provides optimal comfort while slashing draw.`)
              : (lang === 'hi'
                ? 'शानदार! एसी पहले से ही अनुकूलित 24°C इको-कम्फर्ट मोड में चल रहा है। घरेलू लोड संतुलित है।'
                : 'Excellent! AC is currently stabilized at optimal 24°C Eco Comfort setpoint. Load is balanced.')}
          </p>

          <div className="flex items-center gap-3 pt-1 text-xs font-mono">
            <span className="text-lime-bright font-bold">
              Potential Saving: ₹18 / day (~₹540 / month)
            </span>
            <span className="text-ivory-dark">• 230 Watts curtailed</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleApplyOptimization}
          disabled={isApplying || !isAcSuboptimal}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all shadow-lg active:scale-95 shrink-0 ${
            !isAcSuboptimal
              ? 'bg-charcoal-800 text-lime-bright border border-lime-500/30 cursor-default'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 shadow-amber-500/25 border border-amber-300'
          }`}
        >
          {isApplying ? (
            <Sparkles className="w-4 h-4 animate-spin text-charcoal-950" />
          ) : !isAcSuboptimal ? (
            <CheckCircle2 className="w-4 h-4 text-lime-bright" />
          ) : (
            <Zap className="w-4 h-4 text-charcoal-950" />
          )}
          <span>
            {!isAcSuboptimal
              ? (lang === 'hi' ? 'अनुकूलन सक्रिय है' : 'Optimized at 24°C')
              : (lang === 'hi' ? 'अनुकूलन लागू करें' : 'Apply Optimization')}
          </span>
        </button>
      </div>
    </div>
  );
};
