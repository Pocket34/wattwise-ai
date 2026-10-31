import React from 'react';
import { useEnergy } from '../context/EnergyContext';
import { EnergyPulseHero } from '../components/EnergyPulseHero';
import {
  Lightbulb,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingDown,
  Clock,
  Sliders,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    telemetry,
    appliances,
    leaks,
    insights,
    applyInsightAction,
    toggleAppliance,
    setNavSection,
    recentActivity,
    lang
  } = useEnergy();

  // Find active AC recommendation or primary insight
  const primaryInsight = insights.length > 0 ? insights[0] : null;
  const activeLeaks = leaks.filter(l => l.status === 'active');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Central Living Home Energy Pulse */}
      <EnergyPulseHero />

      {/* Active Anomaly Banner (if leaks exist) */}
      {activeLeaks.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-charcoal-900 to-charcoal-900 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">
                  {lang === 'hi' ? 'ऊर्जा रिसाव चेतावनी' : 'Energy Leak Detected'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                  {activeLeaks.length} {lang === 'hi' ? 'सक्रिय' : 'Active'}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-ivory mt-0.5">
                {lang === 'hi' ? activeLeaks[0].title_hi : activeLeaks[0].title}
              </h4>
              <p className="text-xs text-ivory-dark mt-0.5">
                {lang === 'hi'
                  ? `अनुमानित नुकसान: ${activeLeaks[0].waste_kwh_daily} kWh/दिन (₹${activeLeaks[0].waste_cost_daily})`
                  : `Estimated Waste: ${activeLeaks[0].waste_kwh_daily} kWh/day (~₹${activeLeaks[0].waste_cost_daily})`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setNavSection('leaks')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95 shrink-0"
          >
            <span>{lang === 'hi' ? 'लीक डिटेक्टिव खोलें' : 'Open Leak Detective'}</span>
            <ChevronRight className="w-4 h-4 text-charcoal-950" />
          </button>
        </div>
      )}

      {/* "WHAT WATTWISE AI NOTICED" Feature Card */}
      {primaryInsight && (
        <div className="p-6 rounded-3xl glass-card border border-amber-500/30 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-300">
                <Lightbulb className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  {lang === 'hi' ? 'वाटवाइज़ एआई ने क्या देखा' : 'WHAT WATTWISE AI NOTICED'}
                </span>
                <h3 className="text-lg font-bold text-ivory font-hindi">
                  {lang === 'hi' ? primaryInsight.title_hi : primaryInsight.title}
                </h3>
              </div>
            </div>

            <span className="hidden sm:inline-block text-xs px-2.5 py-1 rounded-full copper-badge font-mono font-semibold">
              {primaryInsight.estimatedImpact}
            </span>
          </div>

          <p className="text-sm text-ivory/90 leading-relaxed mb-4 font-hindi">
            {lang === 'hi' ? primaryInsight.description_hi : primaryInsight.description}
          </p>

          <div className="p-3.5 rounded-2xl bg-charcoal-900/90 border border-white/5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="text-ivory-dark font-hindi">
              <span className="text-amber-300 font-semibold">{lang === 'hi' ? 'यह क्यों महत्वपूर्ण है: ' : 'Why it matters: '}</span>
              {primaryInsight.whyItMatters}
            </div>
            <div className="text-lime-bright font-mono font-bold shrink-0">
              {primaryInsight.estimatedImpact}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5">
            <div className="text-xs text-amber-200/70 font-hindi">
              {lang === 'hi'
                ? 'सिफारिश लागू करने पर उपकरण की सेटिंग और आज का बिल तुरंत अपडेट होगा।'
                : 'Applying recommendation automatically tunes the appliance setpoint and updates live power.'}
            </div>

            <button
              onClick={() => applyInsightAction(primaryInsight.id)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 border border-amber-300/40 transition active:scale-95 shrink-0"
            >
              <Zap className="w-4 h-4 fill-charcoal-950" />
              <span>{primaryInsight.actionLabel}</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Appliance Interactive Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-ivory">
              {lang === 'hi' ? 'शीर्ष उपकरण त्वरित नियंत्रण' : 'Quick Appliance Toggles'}
            </h3>
            <p className="text-xs text-amber-200/60 font-hindi">
              {lang === 'hi' ? 'चालू/बंद करने पर घर का कुल लोड तुरंत बदलता है' : 'Instant telemetry response upon toggling'}
            </p>
          </div>
          <button
            onClick={() => setNavSection('appliances')}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
          >
            <span>{lang === 'hi' ? 'सभी 10 उपकरण देखें' : 'View all 10 appliances'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {appliances.slice(0, 5).map((app) => (
            <div
              key={app.id}
              className={`p-3.5 rounded-2xl border transition ${
                app.is_on
                  ? 'bg-charcoal-900 border-amber-500/35 shadow-sm shadow-amber-500/10'
                  : 'bg-charcoal-950 border-white/5 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ivory truncate max-w-[100px]">
                  {app.name.split(' ')[0]}
                </span>
                <button
                  onClick={() => toggleAppliance(app.id)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    app.is_on ? 'bg-amber-500' : 'bg-charcoal-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-charcoal-950 shadow transform transition-transform duration-200 ease-in-out ${
                      app.is_on ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-baseline justify-between text-xs">
                <span className="font-mono font-bold text-amber-300">
                  {app.power_watts}W
                </span>
                <span className="text-[10px] text-ivory-dark truncate max-w-[75px]">
                  {app.room.split(' ')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Household Activity & Decisions */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-ivory">
              {lang === 'hi' ? 'हाल की स्वचालित गतिविधियाँ' : 'Recent Telemetry & Automation Log'}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-ivory-dark">
            Live Database Sync
          </span>
        </div>

        <div className="divide-y divide-white/5 space-y-2">
          {recentActivity.map((log) => (
            <div key={log.id} className="pt-2 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-ivory font-hindi truncate">
                  {lang === 'hi' ? log.message_hi : log.message}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {log.cost_impact !== 0 && (
                  <span className={`font-mono font-semibold ${log.cost_impact > 0 ? 'text-lime-electric' : 'text-amber-400'}`}>
                    {log.cost_impact > 0 ? `Saved ₹${log.cost_impact}` : `+₹${Math.abs(log.cost_impact)}`}
                  </span>
                )}
                <span className="text-[10px] text-ivory-dark font-mono">
                  {log.timestamp.split(' ')[1] || 'Just now'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
