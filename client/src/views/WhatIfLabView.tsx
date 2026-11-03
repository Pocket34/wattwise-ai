import React, { useState, useEffect, useCallback } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { api } from '../services/api';
import { WhatIfResult } from '../types';
import {
  FlaskConical,
  Sparkles,
  TrendingDown,
  Leaf,
  IndianRupee,
  CheckCircle,
  Zap,
  ArrowRight,
  Sliders,
  Check
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';
import confetti from 'canvas-confetti';

export const WhatIfLabView: React.FC = () => {
  const { lang, refreshStatus, showNotification, telemetry } = useEnergy();

  // Sliders state
  const [acTemp, setAcTemp] = useState<number>(24);
  const [acHours, setAcHours] = useState<number>(6);
  const [geyserMinutes, setGeyserMinutes] = useState<number>(25);
  const [fanHours, setFanHours] = useState<number>(12);
  const [bldcFanUpgrade, setBldcFanUpgrade] = useState<boolean>(true);
  const [lightingHours, setLightingHours] = useState<number>(5);
  const [washerLoadsPerWeek, setWasherLoadsPerWeek] = useState<number>(3);
  const [peakHourShiftPct, setPeakHourShiftPct] = useState<number>(30);

  const [simulationResult, setSimulationResult] = useState<WhatIfResult | null>(() => ({
    current: { monthlyKwh: 520, monthlyCost: 4160, dailyKwh: 17.3 },
    optimized: { monthlyKwh: 360, monthlyCost: 2880, dailyKwh: 12.0 },
    savings: { monthlyRupees: 1280, kwhSavedMonthly: 160, percentReduction: 31, co2AvoidedKg: 131.2, treesEquivalent: 6 }
  }));
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // Compute local deterministic fallback
  const computeFallback = (temp: number, hours: number, gMin: number, fHours: number, bldc: boolean, lHours: number, loads: number, shift: number): WhatIfResult => {
    const currentMonthlyKwh = 520;
    const currentCost = 4160;
    const acKwh = 160 * Math.max(0.65, 1 - Math.max(0, temp - 20) * 0.05) * (hours / 8);
    const geyserKwh = 120 * (gMin / 45);
    const fanKwh = 90 * (fHours / 16) * (bldc ? 0.4 : 1.0);
    const lightKwh = 40 * (lHours / 6);
    const washKwh = 30 * (loads / 4);
    const baseKwh = 80;
    const optKwh = Math.round((acKwh + geyserKwh + fanKwh + lightKwh + washKwh + baseKwh) * (1 - (shift / 100) * 0.15));
    const optCost = Math.round(optKwh * 8);
    const savedKwh = Math.max(0, currentMonthlyKwh - optKwh);
    const savedRs = Math.max(0, currentCost - optCost);
    return {
      current: { monthlyKwh: currentMonthlyKwh, monthlyCost: currentCost, dailyKwh: Math.round((currentMonthlyKwh / 30) * 10) / 10 },
      optimized: { monthlyKwh: optKwh, monthlyCost: optCost, dailyKwh: Math.round((optKwh / 30) * 10) / 10 },
      savings: {
        monthlyRupees: savedRs,
        kwhSavedMonthly: savedKwh,
        percentReduction: Math.round((savedRs / currentCost) * 100),
        co2AvoidedKg: Math.round(savedKwh * 0.82 * 10) / 10,
        treesEquivalent: Math.round((savedKwh * 0.82) / (22 / 12))
      }
    };
  };

  // Compute simulation dynamically
  const runSimulation = useCallback(async () => {
    try {
      const res = await api.runWhatIf({
        acTemp,
        acHours,
        geyserMinutes,
        fanHours,
        bldcFanUpgrade,
        lightingHours,
        washerLoadsPerWeek,
        peakHourShiftPct
      });
      if (res && res.success) {
        setSimulationResult(res);
      } else {
        setSimulationResult(computeFallback(acTemp, acHours, geyserMinutes, fanHours, bldcFanUpgrade, lightingHours, washerLoadsPerWeek, peakHourShiftPct));
      }
    } catch {
      setSimulationResult(computeFallback(acTemp, acHours, geyserMinutes, fanHours, bldcFanUpgrade, lightingHours, washerLoadsPerWeek, peakHourShiftPct));
    }
  }, [acTemp, acHours, geyserMinutes, fanHours, bldcFanUpgrade, lightingHours, washerLoadsPerWeek, peakHourShiftPct]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  const handleApplyPlan = async () => {
    setIsApplying(true);
    soundManager.playSuccessChime();
    try {
      await api.applyWhatIf({
        acTemp,
        acHours,
        geyserMinutes,
        bldcFanUpgrade
      });
      await refreshStatus();

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}

      showNotification(
        'success',
        lang === 'hi' ? 'व्हाट-इफ योजना लागू की गई! 🌟' : 'What-If Plan Applied! 🌟',
        lang === 'hi'
          ? `आपके घर का बेसलाइन अनुकूलित हो गया है। संभावित मासिक बचत: ₹${simulationResult?.savings.monthlyRupees}`
          : `Household baseline optimized. Estimated monthly saving: ₹${simulationResult?.savings.monthlyRupees}`
      );
    } catch (e) {
      showNotification('alert', 'Error', 'Failed to apply plan');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              {lang === 'hi' ? 'आदतों का सिमुलेशन लैब' : 'Behavioral Energy Simulation'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-ivory tracking-tight">
            WHAT IF I CHANGE MY HABITS?
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {lang === 'hi'
              ? 'आदतों में छोटे बदलाव करें और अपने मासिक बिजली बिल तथा कार्बन फुटप्रिंट में लाइव बचत देखें'
              : 'Interactive sliders simulating household habit tweaks and live projected monthly bill reduction'}
          </p>
        </div>

        {simulationResult && (
          <div className="flex items-center gap-2.5 p-3 px-4 rounded-2xl bg-charcoal-900 border border-lime-500/30">
            <span className="text-xs text-ivory-dark font-hindi">
              {lang === 'hi' ? 'संभावित बचत:' : 'Projected Saving:'}
            </span>
            <span className="text-2xl font-black font-mono text-lime-bright">
              ₹{simulationResult.savings.monthlyRupees}
            </span>
            <span className="text-xs font-mono text-lime-400">/mo</span>
          </div>
        )}
      </div>

      {/* Main Grid: Controls Left, Live Projection Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sliders Form (Left 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-5">
            <h3 className="text-sm font-bold text-ivory font-hindi flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>{lang === 'hi' ? 'दैनिक आदतों के पैरामीटर समायोजित करें' : 'Adjust Household Energy Habits'}</span>
            </h3>

            {/* Slider 1: AC Temperature */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-charcoal-900/80 border border-white/5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-ivory font-hindi">{lang === 'hi' ? 'एसी तापमान (°C)' : 'AC Temperature'}</span>
                <span className="text-lime-bright font-bold text-sm">{acTemp}°C</span>
              </div>
              <input
                type="range"
                min="18"
                max="28"
                step="1"
                value={acTemp}
                onChange={(e) => setAcTemp(Number(e.target.value))}
                className="w-full accent-lime-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-ivory-dark font-mono">
                <span>18°C (Heavy Draw)</span>
                <span>24°C (BEE Standard)</span>
                <span>28°C (Max Eco)</span>
              </div>
            </div>

            {/* Slider 2: AC Hours */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-charcoal-900/80 border border-white/5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-ivory font-hindi">{lang === 'hi' ? 'एसी दैनिक उपयोग (घंटे)' : 'AC Daily Runtime'}</span>
                <span className="text-amber-300 font-bold text-sm">{acHours} hrs/day</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="0.5"
                value={acHours}
                onChange={(e) => setAcHours(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Slider 3: Geyser Minutes */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-charcoal-900/80 border border-white/5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-ivory font-hindi">{lang === 'hi' ? 'गीज़र ऑन समय (मिनट/दिन)' : 'Geyser Run Time'}</span>
                <span className="text-amber-300 font-bold text-sm">{geyserMinutes} mins/day</span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={geyserMinutes}
                onChange={(e) => setGeyserMinutes(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Slider 4: Fans & BLDC Toggle */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-charcoal-900/80 border border-white/5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-ivory font-hindi">{lang === 'hi' ? 'सीलिंग पंखे उपयोग (घंटे/दिन)' : 'Ceiling Fans Runtime'}</span>
                <span className="text-amber-300 font-bold text-sm">{fanHours} hrs/day</span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                step="1"
                value={fanHours}
                onChange={(e) => setFanHours(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-ivory-dark font-hindi">{lang === 'hi' ? 'BLDC 28W ऊर्जा-कुशल पंखे अपग्रेड' : 'BLDC 28W Eco-Fan Upgrade'}</span>
                <input
                  type="checkbox"
                  checked={bldcFanUpgrade}
                  onChange={(e) => setBldcFanUpgrade(e.target.checked)}
                  className="accent-amber-500 cursor-pointer rounded"
                />
              </div>
            </div>

            {/* Slider 5: Peak-Hour Shift Percentage */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-charcoal-900/80 border border-white/5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-ivory font-hindi">
                  {lang === 'hi' ? 'पीक ऑवर (7-10 PM) लोड शिफ्टिंग' : 'Peak Hour Load Shift (to solar window)'}
                </span>
                <span className="text-lime-bright font-bold text-sm">{peakHourShiftPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={peakHourShiftPct}
                onChange={(e) => setPeakHourShiftPct(Number(e.target.value))}
                className="w-full accent-lime-500 cursor-pointer"
              />
              <p className="text-[10px] text-ivory-dark font-hindi">
                {lang === 'hi'
                  ? 'शाम 7 से 10 बजे के भारी लोड को सुबह 11 बजे शिफ्ट करने पर उच्च स्लैब सरचार्ज से बचाव होता है।'
                  : 'Staggering heavy loads outside 18:00–22:00 avoids highest slab escalation.'}
              </p>
            </div>
          </div>
        </div>

        {/* Live Comparison Delta (Right 5 cols) */}
        {simulationResult && (
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl glass-card border border-amber-500/30 space-y-6">
              <h3 className="text-base font-bold text-ivory font-hindi flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>{lang === 'hi' ? 'लाइव प्रोजेक्टेड प्रभाव' : 'Live Projected Impact'}</span>
              </h3>

              {/* Monthly Bill Comparison Bar */}
              <div className="space-y-3 p-4 rounded-2xl bg-charcoal-950/80 border border-white/5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-ivory-dark">{lang === 'hi' ? 'वर्तमान मासिक बिल' : 'Current Monthly Bill'}</span>
                  <span className="font-bold text-ivory">₹{simulationResult.current.monthlyCost}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-charcoal-800 overflow-hidden">
                  <div className="h-full bg-rose-500/70 rounded-full w-full" />
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-2">
                  <span className="text-lime-bright font-semibold">{lang === 'hi' ? 'अनुकूलित मासिक बिल' : 'Optimized Monthly Bill'}</span>
                  <span className="font-bold text-lime-bright text-base">₹{simulationResult.optimized.monthlyCost}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-charcoal-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-lime-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((simulationResult.optimized.monthlyCost / simulationResult.current.monthlyCost) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Savings Highlights */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-charcoal-900/90 border border-lime-500/20">
                  <span className="text-[10px] text-ivory-dark uppercase font-mono block">
                    {lang === 'hi' ? 'मासिक बचत' : 'Monthly Savings'}
                  </span>
                  <div className="text-2xl font-black font-mono text-lime-bright mt-0.5">
                    ₹{simulationResult.savings.monthlyRupees}
                  </div>
                  <span className="text-[10px] font-mono text-lime-400">
                    ({simulationResult.savings.percentReduction}% reduction)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-charcoal-900/90 border border-amber-500/20">
                  <span className="text-[10px] text-ivory-dark uppercase font-mono block">
                    {lang === 'hi' ? 'ऊर्जा बचत' : 'Units Saved'}
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-300 mt-0.5">
                    {simulationResult.savings.kwhSavedMonthly}
                  </div>
                  <span className="text-[10px] font-mono text-amber-200/70">
                    kWh / month
                  </span>
                </div>
              </div>

              {/* Environmental Equivalence */}
              <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-lime-bright font-semibold">
                  <Leaf className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'पर्यावरणीय योगदान' : 'Environmental Dividend'}</span>
                </div>
                <p className="text-ivory-dark font-hindi leading-relaxed text-[11px]">
                  {lang === 'hi'
                    ? `इस योजना से प्रति माह ${simulationResult.savings.co2AvoidedKg} किग्रा CO₂ का उत्सर्जन रुकेगा, जो ${simulationResult.savings.treesEquivalent} परिपक्व पेड़ लगाने के बराबर है।`
                    : `Avoids ~${simulationResult.savings.co2AvoidedKg} kg CO₂/mo, equivalent to the carbon absorbed by ${simulationResult.savings.treesEquivalent} mature trees.`}
                </p>
              </div>

              {/* "Apply this plan" Button */}
              <button
                onClick={handleApplyPlan}
                disabled={isApplying}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-charcoal-950 font-bold text-sm shadow-xl shadow-amber-500/25 border border-amber-300/40 transition active:scale-95 disabled:opacity-50"
              >
                <Check className="w-5 h-5 text-charcoal-950" />
                <span className="font-hindi tracking-wide font-black">
                  {lang === 'hi' ? 'यह योजना लागू करें (Apply This Plan)' : 'Apply This Plan'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
