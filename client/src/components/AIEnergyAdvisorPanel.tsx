import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { Insight } from '../types';
import {
  Sparkles,
  Zap,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
  ShieldAlert,
  Flame,
  Leaf
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';

export const AIEnergyAdvisorPanel: React.FC = () => {
  const { insights, applyInsightAction, lang, telemetry } = useEnergy();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'surge'>('all');

  const visibleInsights = insights.filter((i) => !dismissedIds.includes(i.id));

  const filteredInsights = visibleInsights.filter((i) => {
    if (activeFilter === 'high') return (i.potential_monthly_savings || 0) >= 200 || i.severity === 'high';
    if (activeFilter === 'surge') return i.category === 'anomaly' || i.severity === 'high' || i.impact_level === 'high';
    return true;
  });

  const handleApply = async (id: string) => {
    soundManager.playSuccessChime();
    await applyInsightAction(id);
  };

  const handleDismiss = (id: string) => {
    soundManager.playNavTick();
    setDismissedIds((prev) => [...prev, id]);
  };

  const toggleExpand = (id: string) => {
    soundManager.playNavTick();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Header with Title & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ivory tracking-tight">
              {lang === 'hi' ? 'वाटवाइज़ एआई ऊर्जा सलाहकार' : 'WattWise AI Energy Advisor'}
            </h3>
            <p className="text-[11px] text-amber-200/70 font-hindi">
              {lang === 'hi'
                ? 'लाइव टेलीमेट्री के आधार पर सक्रिय स्मार्ट सिफारिशें'
                : 'Adaptive intelligence observations with 1-click execution'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-charcoal-900 border border-white/5 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              activeFilter === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-ivory-dark hover:text-ivory'
            }`}
          >
            {lang === 'hi' ? 'सभी' : 'All Insights'} ({visibleInsights.length})
          </button>
          <button
            onClick={() => setActiveFilter('high')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              activeFilter === 'high'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-ivory-dark hover:text-ivory'
            }`}
          >
            {lang === 'hi' ? 'उच्च बचत' : 'High Savings'}
          </button>
          <button
            onClick={() => setActiveFilter('surge')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              activeFilter === 'surge'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-ivory-dark hover:text-ivory'
            }`}
          >
            {lang === 'hi' ? 'विसंगति' : 'Anomalies'}
          </button>
        </div>
      </div>

      {/* Insights Cards List */}
      <div className="space-y-3">
        {filteredInsights.length === 0 ? (
          <div className="p-6 rounded-2xl bg-charcoal-900/60 border border-white/5 text-center text-xs text-ivory-dark">
            <CheckCircle className="w-6 h-6 text-lime-bright mx-auto mb-2 opacity-80" />
            <p className="font-hindi">
              {lang === 'hi'
                ? 'शानदार! कोई सक्रिय ऊर्जा विसंगति नहीं है। सभी उपकरण कुशल मोड में चल रहे हैं।'
                : 'All clear! No active energy waste or anomalies detected in household telemetry.'}
            </p>
          </div>
        ) : (
          filteredInsights.map((insight) => {
            const isExpanded = expandedId === insight.id;
            const isHigh = insight.severity === 'high' || insight.impact_level === 'high';
            const savings = insight.potential_monthly_savings || (isHigh ? 380 : 150);

            return (
              <div
                key={insight.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                  isHigh
                    ? 'bg-charcoal-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-charcoal-950/80 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isHigh
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-charcoal-800 text-ivory-dark'
                      }`}
                    >
                      {insight.category === 'anomaly' || isHigh ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-ivory font-hindi">
                          {lang === 'hi' ? insight.title_hi : insight.title}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                            isHigh
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                              : 'bg-charcoal-800 text-ivory-dark border border-white/5'
                          }`}
                        >
                          {(insight.impact_level || insight.severity || 'high').toUpperCase()} IMPACT
                        </span>
                      </div>

                      <p className="text-xs text-ivory-dark font-hindi leading-relaxed">
                        {lang === 'hi' ? insight.description_hi : insight.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDismiss(insight.id)}
                    className="p-1 rounded-lg text-ivory-dark hover:text-ivory hover:bg-white/5 transition"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3.5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono animate-fade-in">
                    <div className="p-2.5 rounded-xl bg-charcoal-950 border border-white/5">
                      <span className="text-ivory-dark text-[10px] block">Monthly Bill Impact:</span>
                      <span className="text-lime-bright font-bold">
                        Save ~₹{savings}/month
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-charcoal-950 border border-white/5">
                      <span className="text-ivory-dark text-[10px] block">Energy Reduction:</span>
                      <span className="text-amber-300 font-bold">
                        ~{Math.round(savings / 8)} kWh / month
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-charcoal-950 border border-white/5">
                      <span className="text-ivory-dark text-[10px] block">Environmental:</span>
                      <span className="text-lime-electric font-bold">
                        ~{Math.round((savings / 8) * 0.82)} kg CO₂ avoided
                      </span>
                    </div>
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {savings > 0 && (
                      <span className="text-xs font-mono font-bold text-lime-bright bg-lime-500/10 px-2 py-0.5 rounded-md border border-lime-500/20">
                        +₹{savings}/mo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(insight.id)}
                      className="px-3 py-1.5 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 text-[11px] text-ivory font-medium transition flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3 text-ivory-dark" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-ivory-dark" />
                      )}
                    </button>

                    <button
                      onClick={() => handleApply(insight.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 text-charcoal-950" />
                      <span>{lang === 'hi' ? 'अनुकूलन लागू करें' : 'Optimize Now'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
