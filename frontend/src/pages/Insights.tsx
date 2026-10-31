// WattWise AI — Insights: AI-driven diagnostic recommendations & behavioral optimizations
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, Sparkles, ArrowRight, Zap,
  TrendingDown, CheckCircle, RefreshCw, Filter
} from 'lucide-react';
import { useStore } from '../store';
import { playSound } from '../sound';

export default function Insights() {
  const insights = useStore((s) => s.insights);
  const loading = useStore((s) => s.loadingInsights);
  const fetchInsights = useStore((s) => s.fetchInsights);
  const showNotification = useStore((s) => s.showNotification);

  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    fetchInsights();
  }, []);

  const categories = ['all', 'cooling', 'peak', 'standby', 'efficiency'];

  const safeInsights = Array.isArray(insights) ? insights : [];

  const filtered = safeInsights.filter((i) => {
    if (!i) return false;
    if (activeCategory === 'all') return true;
    return (
      (i.category && i.category.toLowerCase().includes(activeCategory)) ||
      (i.title && i.title.toLowerCase().includes(activeCategory)) ||
      (i.description && i.description.toLowerCase().includes(activeCategory))
    );
  });

  const handleApplyAction = (insight: any) => {
    playSound('activate');
    showNotification(`Applied recommendation: "${insight.title}"`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-ww-amber" />
            <h1 className="text-2xl font-bold text-ww-ivory">Energy Intelligence Insights</h1>
          </div>
          <p className="text-sm text-ww-ivory-dim mt-1">
            Predictive machine learning diagnostics tailored to your home's unique consumption curve
          </p>
        </div>

        <button
          onClick={() => {
            playSound('tick');
            fetchInsights();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ww-card border border-ww-border/60 text-xs font-medium text-ww-ivory hover:border-ww-amber/50 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-ww-amber' : ''}`} />
          Refresh Insights
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              playSound('tick');
              setActiveCategory(cat);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-ww-amber text-ww-bg font-bold shadow-md shadow-ww-amber/15'
                : 'bg-ww-card border border-ww-border/50 text-ww-ivory-dim hover:text-ww-ivory'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Insights List */}
      {loading && insights.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-ww-amber/30 border-t-ww-amber rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-ww-card/40 border border-ww-border/40 rounded-2xl">
          <Sparkles className="w-10 h-10 text-ww-ivory-dim mx-auto mb-2" />
          <p className="text-sm font-medium text-ww-ivory">No matching insights right now</p>
          <p className="text-xs text-ww-ivory-dim mt-1">Telemetry analysis is actively monitoring for optimization opportunities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-5 rounded-2xl bg-ww-card/80 border border-ww-border/60 hover:border-ww-amber/40 transition-all backdrop-blur-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-ww-amber/10 border border-ww-amber/30 text-ww-amber font-semibold uppercase tracking-wider">
                      {item.category || 'Optimization'}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {item.impact || 'High Savings'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-ww-ivory mt-1">{item.title}</h3>
                  <p className="text-xs text-ww-ivory-dim mt-2 leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-ww-border/30 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-ww-ivory-dim font-medium truncate">
                    Action: {item.recommended_action || 'Automated policy ready'}
                  </span>

                  <button
                    onClick={() => handleApplyAction(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ww-surface border border-ww-border/60 text-xs font-bold text-ww-amber hover:bg-ww-amber hover:text-ww-bg hover:border-transparent transition-all shrink-0"
                  >
                    <span>Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
