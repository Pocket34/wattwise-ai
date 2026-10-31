import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { Leak } from '../types';
import {
  SearchAlert,
  ShieldAlert,
  CheckCircle,
  XCircle,
  HelpCircle,
  Zap,
  TrendingDown,
  Radar,
  ArrowRight,
  Info,
  Check
} from 'lucide-react';

export const LeakDetectiveView: React.FC = () => {
  const { leaks, fixLeak, ignoreLeak, lang, telemetry } = useEnergy();
  const [investigatingLeak, setInvestigatingLeak] = useState<Leak | null>(null);

  const activeLeaks = leaks.filter(l => l.status === 'active');
  const resolvedLeaks = leaks.filter(l => l.status === 'fixed');

  const totalWasteKwh = activeLeaks.reduce((acc, l) => acc + l.waste_kwh_daily, 0);
  const totalWasteCost = activeLeaks.reduce((acc, l) => acc + l.waste_cost_daily, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Radar Animation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SearchAlert className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
              {lang === 'hi' ? 'एआई ऊर्जा विसंगति डिटेक्टर' : 'Autonomous Leak Surveillance'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-ivory tracking-tight">
            LEAK DETECTIVE
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {lang === 'hi'
              ? 'फैंटम वैम्पायर लोड, अनावश्यक चालू उपकरण और असामान्य बिजली खपत की पहचान'
              : 'Statistical heuristics identifying standby phantom draws, forgotten circuits, and inefficient thermal setpoints'}
          </p>
        </div>

        {/* Total Leaked Power Counter */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-charcoal-900 border border-rose-500/30">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-ivory-dark uppercase font-mono block">
              {lang === 'hi' ? 'सक्रिय लीक्स द्वारा बर्बादी' : 'Daily Preventable Waste'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono text-rose-400">
                ₹{totalWasteCost.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-ivory-dark">
                ({totalWasteKwh.toFixed(2)} kWh/day)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Anomalies List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-ivory flex items-center gap-2 font-hindi">
            <span>{lang === 'hi' ? 'पहचाने गए संभावित ऊर्जा लीक्स' : 'Detected Energy Leaks'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
              {activeLeaks.length} Active
            </span>
          </h3>
          <span className="text-xs font-mono text-amber-300">
            Real-time Sensor Inference
          </span>
        </div>

        {activeLeaks.length === 0 ? (
          <div className="p-8 rounded-3xl glass-panel text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-lime-500/20 text-lime-bright mx-auto flex items-center justify-center border border-lime-500/40">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-ivory font-hindi">
              {lang === 'hi' ? 'कोई सक्रिय ऊर्जा रिसाव नहीं मिला!' : 'Zero Active Energy Leaks!'}
            </h3>
            <p className="text-xs text-ivory-dark max-w-md mx-auto font-hindi">
              {lang === 'hi'
                ? 'आपके घर के सभी उपकरण अनुकूलित ऊर्जा स्तरों पर चल रहे हैं। कोई फैंटम वैम्पायर लोड सक्रिय नहीं है।'
                : 'All circuits and standby loads are performing within optimal baselines. Keep up the high efficiency!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeLeaks.map((leak) => (
              <div
                key={leak.id}
                className="p-5 sm:p-6 rounded-3xl glass-card border border-rose-500/30 relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/40">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {leak.leak_type.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-mono text-lime-bright font-bold">
                          {leak.confidence_pct}% AI Confidence
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-ivory mt-1 font-hindi">
                        {lang === 'hi' ? leak.title_hi : leak.title}
                      </h4>
                    </div>
                  </div>

                  {/* Waste Impact Pill */}
                  <div className="p-2.5 rounded-xl bg-charcoal-900 border border-white/10 shrink-0 text-right sm:text-right">
                    <span className="text-[10px] text-ivory-dark block font-hindi">
                      {lang === 'hi' ? 'अनुमानित बर्बादी' : 'Estimated Waste'}
                    </span>
                    <span className="text-sm font-bold font-mono text-rose-400">
                      {leak.waste_kwh_daily} kWh (~₹{leak.waste_cost_daily}/day)
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-ivory/85 leading-relaxed mb-4 font-hindi pl-0 sm:pl-12">
                  {lang === 'hi' ? leak.description_hi : leak.description}
                </p>

                {/* Recommended Action box */}
                <div className="p-3.5 rounded-2xl bg-charcoal-900/90 border border-amber-500/15 mb-5 flex items-center gap-2.5 text-xs text-amber-200">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-hindi">
                    <strong className="text-amber-300">{lang === 'hi' ? 'सुझाव: ' : 'Remedy: '}</strong>
                    {lang === 'hi' ? leak.recommended_action_hi : leak.recommended_action}
                  </span>
                </div>

                {/* 3 Signature Buttons: Investigate, Fix Now, Ignore */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-white/5">
                  <button
                    onClick={() => setInvestigatingLeak(leak)}
                    className="px-3.5 py-2 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 border border-white/10 text-xs text-ivory transition flex items-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'hi' ? 'जाँच करें (Investigate)' : 'Investigate'}</span>
                  </button>

                  <button
                    onClick={() => ignoreLeak(leak.id)}
                    className="px-3.5 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-white/5 text-xs text-ivory-dark hover:text-ivory transition"
                  >
                    <span>{lang === 'hi' ? 'नज़रअंदाज़ करें' : 'Ignore'}</span>
                  </button>

                  <button
                    onClick={() => fixLeak(leak.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95"
                  >
                    <Check className="w-4 h-4 text-charcoal-950" />
                    <span>{lang === 'hi' ? 'अभी ठीक करें (Fix Now)' : 'Fix Now'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Leaks History */}
      {resolvedLeaks.length > 0 && (
        <div className="p-5 rounded-3xl glass-panel space-y-3">
          <h4 className="text-xs font-bold font-mono uppercase text-ivory-dark tracking-wider">
            {lang === 'hi' ? 'सफलतापूर्वक हल किए गए लीक्स' : 'Resolved Anomalies History'}
          </h4>
          <div className="divide-y divide-white/5">
            {resolvedLeaks.map((l) => (
              <div key={l.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-electric shrink-0" />
                  <span className="text-ivory font-hindi line-through opacity-70">
                    {lang === 'hi' ? l.title_hi : l.title}
                  </span>
                </div>
                <span className="text-lime-bright font-mono font-bold">
                  Saved ~{l.waste_kwh_daily} kWh/day
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investigate Diagnostic Modal */}
      {investigatingLeak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-charcoal-900 border border-amber-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radar className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-ivory font-hindi">
                  {lang === 'hi' ? 'गहन विसंगति निदान' : 'Deep Anomaly Diagnosis'}
                </h3>
              </div>
              <button
                onClick={() => setInvestigatingLeak(null)}
                className="p-1.5 rounded-lg bg-charcoal-800 text-ivory hover:bg-charcoal-700"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-charcoal-950/80 border border-white/5 space-y-2 text-xs">
              <div className="text-amber-300 font-bold font-mono">
                {investigatingLeak.title}
              </div>
              <p className="text-ivory-dark leading-relaxed font-hindi">
                {lang === 'hi' ? investigatingLeak.description_hi : investigatingLeak.description}
              </p>
              <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-ivory font-mono">
                <div>Confidence: <span className="text-lime-bright font-bold">{investigatingLeak.confidence_pct}%</span></div>
                <div>Waste: <span className="text-rose-400 font-bold">₹{investigatingLeak.waste_cost_daily}/day</span></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setInvestigatingLeak(null)}
                className="px-4 py-2 rounded-xl bg-charcoal-800 text-xs text-ivory"
              >
                Close
              </button>
              <button
                onClick={() => {
                  fixLeak(investigatingLeak.id);
                  setInvestigatingLeak(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-charcoal-950 font-bold text-xs shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Fix Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
