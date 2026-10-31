// WattWise AI — Smart Rules: Autonomous energy automation engine
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Workflow, Plus, Play, Trash2, Power,
  ShieldCheck, RefreshCw, X, Zap, ArrowRight
} from 'lucide-react';
import { useStore } from '../store';
import { playSound } from '../sound';
import type { Rule } from '../types';

export default function SmartRules() {
  const rules = useStore((s) => s.rules);
  const loading = useStore((s) => s.loadingRules);
  const fetchRules = useStore((s) => s.fetchRules);
  const createRule = useStore((s) => s.createRule);
  const updateRule = useStore((s) => s.updateRule);
  const deleteRule = useStore((s) => s.deleteRule);
  const executeRule = useStore((s) => s.executeRule);
  const showNotification = useStore((s) => s.showNotification);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCondition, setNewRuleCondition] = useState('Home total load > 2500W for 10 mins');
  const [newRuleAction, setNewRuleAction] = useState('Throttle AC temp to 26°C and sleep Geyser');
  const [submitting, setSubmitting] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (rule: Rule) => {
    playSound('toggle');
    const newState = rule.is_enabled === 1 ? 0 : 1;
    await updateRule(rule.id, { is_enabled: newState });
    showNotification(`Rule "${rule.name}" ${newState ? 'enabled' : 'paused'}`, 'info');
  };

  const handleExecute = async (rule: Rule) => {
    playSound('activate');
    setExecutingId(rule.id);
    try {
      await executeRule(rule.id);
      playSound('success');
      showNotification(`Executed "${rule.name}". Conditions validated.`, 'success');
      await fetchRules();
    } catch (e: any) {
      playSound('warning');
      showNotification(e.message || 'Rule execution failed', 'error');
    } finally {
      setExecutingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    playSound('tick');
    if (confirm(`Delete rule "${name}"?`)) {
      await deleteRule(id);
      showNotification(`Rule "${name}" removed`, 'info');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    playSound('activate');
    setSubmitting(true);
    try {
      await createRule({
        name: newRuleName.trim(),
        condition: newRuleCondition.trim(),
        action: newRuleAction.trim(),
        is_enabled: 1,
      });
      playSound('success');
      showNotification('New automation rule added!', 'success');
      setNewRuleName('');
      setIsModalOpen(false);
      await fetchRules();
    } catch (err: any) {
      playSound('warning');
      showNotification(err.message || 'Failed to create rule', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const safeRules = Array.isArray(rules) ? rules : [];
  const activeCount = safeRules.filter((r) => r && r.is_enabled === 1).length;
  const totalTriggers = safeRules.reduce((sum, r) => sum + (r?.trigger_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Workflow className="w-6 h-6 text-ww-amber" />
            <h1 className="text-2xl font-bold text-ww-ivory">Smart Rules</h1>
          </div>
          <p className="text-sm text-ww-ivory-dim mt-1">
            Autonomous decision engine that enforces energy boundaries without manual intervention
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playSound('tick');
              fetchRules();
            }}
            className="p-2.5 rounded-xl bg-ww-card border border-ww-border/60 text-ww-ivory hover:border-ww-amber/50 transition-all"
            title="Refresh rules"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-ww-amber' : ''}`} />
          </button>

          <button
            onClick={() => {
              playSound('click');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ww-amber text-ww-bg font-bold text-xs hover:bg-ww-amber-dim transition-all shadow-md shadow-ww-amber/15"
          >
            <Plus className="w-4 h-4" />
            New Rule
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl">
          <p className="text-xs text-ww-ivory-dim">Active Automations</p>
          <p className="text-2xl font-bold text-ww-amber mt-1">{activeCount} / {rules.length}</p>
          <p className="text-[11px] text-emerald-400 mt-1">Guarding peak boundaries</p>
        </div>

        <div className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl">
          <p className="text-xs text-ww-ivory-dim">Autonomous Triggers</p>
          <p className="text-2xl font-bold text-ww-ivory mt-1">{totalTriggers}</p>
          <p className="text-[11px] text-ww-ivory-dim/70 mt-1">Decisions made autonomously</p>
        </div>

        <div className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl col-span-2 md:col-span-1">
          <p className="text-xs text-ww-ivory-dim">System Safety</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">Active</p>
          <p className="text-[11px] text-ww-ivory-dim/70 mt-1">Shedding non-priority loads</p>
        </div>
      </div>

      {/* Rules List */}
      {loading && rules.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-ww-amber/30 border-t-ww-amber rounded-full animate-spin" />
        </div>
      ) : rules.length === 0 ? (
        <div className="p-12 text-center bg-ww-card/40 border border-ww-border/40 rounded-2xl">
          <Workflow className="w-10 h-10 text-ww-ivory-dim mx-auto mb-2" />
          <p className="text-sm font-medium text-ww-ivory">No rules established yet</p>
          <p className="text-xs text-ww-ivory-dim mt-1">Click "New Rule" above to create an automated policy</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {rules.map((rule) => {
              const isEnabled = rule.is_enabled === 1;
              const isExecuting = executingId === rule.id;

              return (
                <motion.div
                  key={rule.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`p-5 rounded-2xl border transition-all backdrop-blur-xl ${
                    isEnabled
                      ? 'bg-ww-card/80 border-ww-border/60 hover:border-ww-amber/40'
                      : 'bg-ww-card/40 border-ww-border/30 opacity-60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-ww-ivory">{rule.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-ww-surface text-ww-ivory-dim'
                        }`}>
                          {isEnabled ? 'Active' : 'Paused'}
                        </span>
                      </div>

                      {/* Condition & Action Chain */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-ww-surface border border-ww-border/50 text-ww-ivory font-mono">
                          IF: {rule.condition}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-ww-amber" />
                        <span className="px-2.5 py-1 rounded-lg bg-ww-amber/10 border border-ww-amber/30 text-ww-amber font-mono font-medium">
                          THEN: {rule.action}
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-ww-border/30 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleExecute(rule)}
                        disabled={isExecuting}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ww-surface border border-ww-border/60 text-xs font-medium text-ww-ivory hover:text-ww-amber hover:border-ww-amber/40 transition-all"
                        title="Simulate / Run Rule Now"
                      >
                        <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin text-ww-amber' : ''}`} />
                        Run
                      </button>

                      <button
                        onClick={() => handleToggle(rule)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          isEnabled
                            ? 'bg-ww-amber/15 border-ww-amber/40 text-ww-amber hover:bg-ww-amber/25'
                            : 'bg-ww-surface border-ww-border/40 text-ww-ivory-dim hover:text-ww-ivory'
                        }`}
                      >
                        {isEnabled ? 'Pause' : 'Enable'}
                      </button>

                      <button
                        onClick={() => handleDelete(rule.id, rule.name)}
                        className="p-2 rounded-xl bg-ww-surface border border-ww-border/40 text-ww-ivory-dim hover:text-red-400 hover:border-red-400/40 transition-all"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-ww-ivory-dim/70 border-t border-ww-border/20">
                    <span>Fired {rule.trigger_count || 0} times</span>
                    <span>Last active: {rule.last_triggered ? new Date(rule.last_triggered).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Rule Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-ww-card border border-ww-border rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-ww-ivory flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-ww-amber" />
                  Create Automation Rule
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-ww-surface text-ww-ivory-dim"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-ww-ivory mb-1">Rule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Heatwave Peak Governor"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    className="w-full px-3 py-2 bg-ww-surface border border-ww-border/60 rounded-xl text-ww-ivory placeholder-ww-ivory-dim/40 focus:outline-none focus:border-ww-amber/50"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ww-ivory mb-1">Condition (IF)</label>
                  <input
                    type="text"
                    required
                    value={newRuleCondition}
                    onChange={(e) => setNewRuleCondition(e.target.value)}
                    className="w-full px-3 py-2 bg-ww-surface border border-ww-border/60 rounded-xl text-ww-ivory focus:outline-none focus:border-ww-amber/50"
                  />
                </div>

                <div>
                  <label className="block font-medium text-ww-ivory mb-1">Action (THEN)</label>
                  <input
                    type="text"
                    required
                    value={newRuleAction}
                    onChange={(e) => setNewRuleAction(e.target.value)}
                    className="w-full px-3 py-2 bg-ww-surface border border-ww-border/60 rounded-xl text-ww-ivory focus:outline-none focus:border-ww-amber/50"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-ww-surface border border-ww-border/60 text-ww-ivory-dim font-medium hover:text-ww-ivory"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-ww-amber text-ww-bg font-bold hover:bg-ww-amber-dim transition-all shadow-md shadow-ww-amber/15"
                  >
                    {submitting ? 'Saving...' : 'Create Rule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
