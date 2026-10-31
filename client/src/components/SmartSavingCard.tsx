import React from 'react';
import { useEnergy } from '../context/EnergyContext';
import {
  Zap,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Power,
  Leaf,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';

export const SmartSavingCard: React.FC = () => {
  const { smartSavingState, toggleSmartSaving, lang, telemetry } = useEnergy();

  const handleToggle = () => {
    soundManager.playToggleClick(!smartSavingState.isEnabled);
    toggleSmartSaving(!smartSavingState.isEnabled);
  };

  const beforeWatts = smartSavingState.beforeWatts || 2320;
  const afterWatts = smartSavingState.afterWatts || 1690;
  const savedWatts = smartSavingState.savedWatts || (beforeWatts - afterWatts);
  const dailyRupees = smartSavingState.dailyRupeesSaved || 34;
  const monthlyRupees = smartSavingState.monthlyRupeesSaved || 1020;
  const pctSaved = Math.round((savedWatts / beforeWatts) * 100);

  return (
    <div className="relative p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-charcoal-900 via-charcoal-900/90 to-charcoal-950 border border-amber-500/35 shadow-2xl overflow-hidden group">
      {/* Background Glow */}
      <div
        className={`absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          smartSavingState.isEnabled ? 'bg-lime-500/20 opacity-100' : 'bg-amber-500/15 opacity-60'
        }`}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
              smartSavingState.isEnabled
                ? 'bg-lime-500/20 text-lime-bright border-lime-500/40 shadow-lg shadow-lime-500/20'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                {lang === 'hi' ? 'एआई ऊर्जा संरक्षण मोड' : 'Autonomous Power Reduction'}
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  smartSavingState.isEnabled
                    ? 'bg-lime-500/20 text-lime-bright border border-lime-500/40'
                    : 'bg-charcoal-800 text-ivory-dark border border-white/10'
                }`}
              >
                {smartSavingState.isEnabled ? 'ACTIVE • OPTIMIZED' : 'STANDBY READY'}
              </span>
            </div>
            <h2 className="text-xl font-black text-ivory tracking-tight">
              {lang === 'hi' ? 'स्मार्ट सेविंग मोड (Smart Saving Mode)' : 'Smart Saving Mode'}
            </h2>
          </div>
        </div>

        {/* Big Switch Button */}
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-xs transition-all shadow-lg active:scale-95 ${
            smartSavingState.isEnabled
              ? 'bg-lime-500 hover:bg-lime-400 text-charcoal-950 shadow-lime-500/25 border border-lime-300'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 shadow-amber-500/25 border border-amber-300'
          }`}
        >
          <Power className="w-4 h-4 text-charcoal-950" />
          <span>
            {smartSavingState.isEnabled
              ? (lang === 'hi' ? 'स्मार्ट सेविंग सक्रिय (चालू)' : 'Smart Saving Active (ON)')
              : (lang === 'hi' ? 'स्मार्ट सेविंग चालू करें' : 'Engage Smart Saving')}
          </span>
        </button>
      </div>

      {/* Before / After Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {/* BEFORE CARD */}
        <div className="p-4 rounded-2xl bg-charcoal-950/80 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-ivory-dark">
            <span>{lang === 'hi' ? 'पहले का लोड (BEFORE)' : 'LOAD BEFORE'}</span>
            <span className="text-[10px] text-rose-400 font-bold">Standard</span>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-black text-rose-400/90">{beforeWatts}</span>
            <span className="text-xs text-ivory-dark font-bold">Watts</span>
          </div>
          <p className="text-[10px] text-ivory-dark font-hindi">
            {lang === 'hi' ? 'अकुशल एसी व स्टैंडबाय फैंटम लोड' : 'Uncurtailed continuous peak draw'}
          </p>
        </div>

        {/* AFTER CARD */}
        <div className="p-4 rounded-2xl bg-charcoal-950/80 border border-lime-500/30 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-lime-bright">
            <span>{lang === 'hi' ? 'अनुकूलित लोड (AFTER)' : 'OPTIMIZED LOAD'}</span>
            <span className="text-[10px] bg-lime-500/20 px-2 py-0.5 rounded font-bold">Eco Target</span>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-black text-lime-bright">{afterWatts}</span>
            <span className="text-xs text-lime-bright/70 font-bold">Watts</span>
          </div>
          <p className="text-[10px] text-lime-200/70 font-hindi">
            {lang === 'hi' ? '24°C थर्मोस्टेट + स्टैंडबाय आइसोलेशन' : 'Active dynamic load dampening'}
          </p>
        </div>

        {/* SAVINGS CARD */}
        <div className="p-4 rounded-2xl bg-charcoal-950/80 border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-amber-300">
            <span>{lang === 'hi' ? 'अनुमानित बचत (SAVINGS)' : 'NET SAVINGS'}</span>
            <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-bold">
              -{pctSaved}% Power
            </span>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-black text-amber-300">₹{dailyRupees}</span>
            <span className="text-xs text-amber-300/80 font-bold">/ day (~₹{monthlyRupees}/mo)</span>
          </div>
          <p className="text-[10px] text-amber-200/70 font-hindi">
            {lang === 'hi' ? 'वार्षिक ₹12,000+ तक की सीधी बचत' : 'Low carbon, zero comfort penalty'}
          </p>
        </div>
      </div>

      {/* Applied Automations Pill Badges */}
      <div className="p-4 rounded-2xl bg-charcoal-950/50 border border-white/5 space-y-2.5">
        <span className="text-[11px] font-mono uppercase text-ivory-dark font-bold block">
          {lang === 'hi' ? 'सुरक्षित स्वचालित समायोजन:' : 'Safe Autonomous Policy Adjustments:'}
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-charcoal-900 border border-white/5 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-lime-bright shrink-0" />
            <span className="text-ivory truncate">AC → Eco 24°C</span>
          </div>
          <div className="p-2.5 rounded-xl bg-charcoal-900 border border-white/5 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-lime-bright shrink-0" />
            <span className="text-ivory truncate">Water Heater Cutoff</span>
          </div>
          <div className="p-2.5 rounded-xl bg-charcoal-900 border border-white/5 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-lime-bright shrink-0" />
            <span className="text-ivory truncate">TV Standby Isolated</span>
          </div>
          <div className="p-2.5 rounded-xl bg-charcoal-900 border border-white/5 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-lime-bright shrink-0" />
            <span className="text-ivory truncate">Lights → 70% Ambient</span>
          </div>
        </div>

        <div className="pt-1 flex items-center gap-1.5 text-[10px] text-ivory-dark">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {lang === 'hi'
              ? 'पारदर्शी डेमो सुरक्षा: वास्तविक भौतिक उपकरण केवल अधिकृत हार्डवेयर ब्रिज जोड़े जाने पर ही नियंत्रित किए जाते हैं।'
              : 'Deterministic Demo Guarantee: Telemetry simulated safely locally. Real hardware requires explicit bridge authorization.'}
          </span>
        </div>
      </div>
    </div>
  );
};
