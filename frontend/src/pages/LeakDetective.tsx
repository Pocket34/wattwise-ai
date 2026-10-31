// WattWise AI — Leak Detective: Phantom load, standby vampire loss & thermal waste detection
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, AlertTriangle, ShieldCheck, Zap,
  Wrench, CheckCircle, ArrowRight, RefreshCw, Sparkles
} from 'lucide-react';
import { useStore } from '../store';
import { playSound } from '../sound';

export default function LeakDetective() {
  const leaks = useStore((s) => s.leaks);
  const loading = useStore((s) => s.loadingLeaks);
  const fetchLeaks = useStore((s) => s.fetchLeaks);
  const fixLeak = useStore((s) => s.fixLeak);
  const showNotification = useStore((s) => s.showNotification);

  const [fixingId, setFixingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaks();
  }, []);

  const handleFix = async (id: string, name: string) => {
    playSound('activate');
    setFixingId(id);
    try {
      await fixLeak(id);
      playSound('success');
      showNotification(`Secured leak on ${name}. Standby draw neutralized.`, 'success');
      await fetchLeaks();
    } catch (err: any) {
      playSound('warning');
      showNotification(err.message || 'Failed to remediate leak', 'error');
    } finally {
      setFixingId(null);
    }
  };

  const safeLeaks = Array.isArray(leaks) ? leaks : [];
  const totalWasteKwh = safeLeaks.reduce((sum, l) => sum + (l?.waste_kwh || 0), 0);
  const totalWasteCost = safeLeaks.reduce((sum, l) => sum + (l?.waste_cost || 0), 0);
  const annualWasteCost = totalWasteCost * 365;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-ww-amber" />
            <h1 className="text-2xl font-bold text-ww-ivory">Leak Detective</h1>
          </div>
          <p className="text-sm text-ww-ivory-dim mt-1">
            Uncover silent vampire draws, mechanical friction, and thermal inefficiencies
          </p>
        </div>

        <button
          onClick={() => {
            playSound('tick');
            fetchLeaks();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ww-card border border-ww-border/60 text-xs font-medium text-ww-ivory hover:border-ww-amber/50 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-ww-amber' : ''}`} />
          Scan Leaks
        </button>
      </div>

      {/* KPI Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ww-ivory-dim">Detected Leaks</span>
            <AlertTriangle className={`w-4 h-4 ${leaks.length > 0 ? 'text-ww-orange' : 'text-emerald-400'}`} />
          </div>
          <p className="text-2xl font-bold text-ww-ivory mt-2">{leaks.length}</p>
          <p className="text-xs text-ww-ivory-dim/70 mt-1">Active phantom & standby drains</p>
        </div>

        <div className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ww-ivory-dim">Daily Wasted Cost</span>
            <Zap className="w-4 h-4 text-ww-amber" />
          </div>
          <p className="text-2xl font-bold text-ww-amber mt-2">₹{Math.round(totalWasteCost)}</p>
          <p className="text-xs text-ww-ivory-dim/70 mt-1">{totalWasteKwh.toFixed(1)} kWh bleeding daily</p>
        </div>

        <div className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ww-ivory-dim">Annualized Recovery Potential</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">
            ₹{Math.round(annualWasteCost).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-emerald-500/80 mt-1">Recoverable through automated remediation</p>
        </div>
      </div>

      {/* Leaks List */}
      {loading && leaks.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-ww-amber/30 border-t-ww-amber rounded-full animate-spin" />
        </div>
      ) : leaks.length === 0 ? (
        <div className="p-12 text-center bg-ww-card/40 border border-ww-border/40 rounded-2xl">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-ww-ivory">All Circuits Clean & Secure</h3>
          <p className="text-xs text-ww-ivory-dim mt-1 max-w-md mx-auto">
            WattWise has eliminated detected vampire drains. Real-time telemetry confirms baseline integrity.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {leaks.map((leak) => {
              const isFixing = fixingId === leak.id;
              const applianceName = leak.applianceName || leak.appliance_id || 'Smart Appliance';

              return (
                <motion.div
                  key={leak.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 hover:border-ww-amber/40 transition-all backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-ww-orange/15 border border-ww-orange/40 text-ww-orange font-semibold">
                        {leak.type || 'Vampire Drain'}
                      </span>
                      <span className="text-xs text-ww-ivory-dim font-mono">
                        {leak.confidence}% Confidence
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-ww-ivory">{applianceName}</h3>
                    <p className="text-xs text-ww-ivory-dim leading-relaxed">{leak.description}</p>
                  </div>

                  {/* Impact metrics and Fix button */}
                  <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-ww-border/30">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-ww-ivory-dim">Wasted</p>
                      <p className="text-base font-bold text-ww-amber">
                        ₹{Math.round(leak.waste_cost || 0)} / day
                      </p>
                      <p className="text-[11px] text-ww-ivory-dim/70">{(leak.waste_kwh || 0).toFixed(1)} kWh/day</p>
                    </div>

                    <button
                      onClick={() => handleFix(leak.id, applianceName)}
                      disabled={isFixing}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ww-amber text-ww-bg font-bold text-xs hover:bg-ww-amber-dim transition-all shadow-md shadow-ww-amber/15 disabled:opacity-50"
                    >
                      <Wrench className={`w-3.5 h-3.5 ${isFixing ? 'animate-spin' : ''}`} />
                      {isFixing ? 'Securing...' : 'Fix Leak'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
