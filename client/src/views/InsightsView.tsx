import React from 'react';
import { useEnergy } from '../context/EnergyContext';
import {
  Sparkles,
  Zap,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  TrendingDown,
  Layers,
  ShieldCheck,
  Bot
} from 'lucide-react';

export const InsightsView: React.FC = () => {
  const { insights, applyInsightAction, lang, telemetry } = useEnergy();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              {lang === 'hi' ? 'वाटवाइज़ बुद्धिमत्ता फीड' : 'Deterministic AI Reasoning Feed'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-ivory tracking-tight">
            INTELLIGENCE INSIGHTS
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {lang === 'hi'
              ? 'सिम्युलेटेड घरेलू टेलीमेट्री से निकाले गए प्रत्यक्ष क्रियाशील सुझाव'
              : 'Statistical heuristics and energy-saving recommendations tailored to household telemetry'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-lime-bright px-3 py-1.5 rounded-xl bg-charcoal-900 border border-lime-500/30">
          <Bot className="w-4 h-4 text-lime-bright" />
          <span>WattWise Reasoning Engine v1.0</span>
        </div>
      </div>

      {/* Architecture Explainer Card */}
      <div className="p-5 rounded-3xl glass-panel border border-amber-500/20 space-y-3">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400">
          {lang === 'hi' ? 'एआई निर्णय चक्र (DECISION ARCHITECTURE)' : 'DECISION ARCHITECTURE PIPELINE'}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-ivory">
          <span className="px-2.5 py-1 rounded-lg bg-charcoal-900 border border-white/10">Telemetry Stream</span>
          <span className="text-amber-400">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-charcoal-900 border border-white/10">Anomaly Detector</span>
          <span className="text-amber-400">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-charcoal-900 border border-white/10">Reasoning Engine</span>
          <span className="text-amber-400">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-charcoal-900 border border-white/10">Recommendation</span>
          <span className="text-amber-400">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-lime-500/20 text-lime-bright border border-lime-500/40 font-bold">1-Click Action</span>
        </div>
      </div>

      {/* Insights Feed */}
      <div className="grid grid-cols-1 gap-5">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="p-6 rounded-3xl glass-card border border-amber-500/30 space-y-4 relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/40">
                  <Lightbulb className="w-6 h-6 fill-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full copper-badge">
                    {ins.type.replace('_', ' ')}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-ivory mt-1 font-hindi">
                    {lang === 'hi' ? ins.title_hi : ins.title}
                  </h3>
                </div>
              </div>

              <div className="px-3 py-1 rounded-xl bg-lime-500/15 border border-lime-500/30 text-lime-bright font-mono font-bold text-xs shrink-0">
                {ins.estimatedImpact}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-ivory/85 leading-relaxed font-hindi pl-0 sm:pl-12">
              {lang === 'hi' ? ins.description_hi : ins.description}
            </p>

            {/* Why It Matters Callout */}
            <div className="p-4 rounded-2xl bg-charcoal-900/90 border border-white/5 space-y-1 text-xs">
              <span className="text-amber-300 font-bold font-hindi block">
                {lang === 'hi' ? 'यह क्यों महत्वपूर्ण है?' : 'Why it matters:'}
              </span>
              <p className="text-ivory-dark font-hindi leading-relaxed text-[11px]">
                {ins.whyItMatters}
              </p>
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[11px] text-amber-200/70 font-mono hidden sm:inline">
                Instant telemetry recalculation
              </span>

              <button
                onClick={() => applyInsightAction(ins.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95"
              >
                <Zap className="w-4 h-4 fill-charcoal-950" />
                <span>{ins.actionLabel}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
