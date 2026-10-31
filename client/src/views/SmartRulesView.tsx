import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { Rule } from '../types';
import { api } from '../services/api';
import {
  Workflow,
  Plus,
  Play,
  Trash2,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';

export const SmartRulesView: React.FC = () => {
  const { rules, refreshStatus, showNotification, lang, integrationMode } = useEnergy();

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTitleHi, setNewTitleHi] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newTriggerType, setNewTriggerType] = useState<string>('power_threshold');
  const [newThreshold, setNewThreshold] = useState<number>(3500);
  const [newActionType, setNewActionType] = useState<string>('shed_heavy_load');
  const [newTargetApp, setNewTargetApp] = useState<string>('pump');

  // Toggle rule enabled/disabled
  const handleToggleRule = async (rule: Rule) => {
    const nextState = rule.is_enabled === 1 ? 0 : 1;
    soundManager.playToggleClick(nextState === 1);
    try {
      await api.updateRule(rule.id, { is_enabled: nextState });
      await refreshStatus();
      showNotification(
        'info',
        lang === 'hi' ? 'नियम अद्यतनित' : 'Rule Updated',
        lang === 'hi'
          ? `"${rule.title_hi}" को ${nextState === 1 ? 'सक्रिय' : 'निष्क्रिय'} किया गया।`
          : `"${rule.title}" has been ${nextState === 1 ? 'enabled' : 'disabled'}.`
      );
    } catch (e) {
      showNotification('alert', 'Error', 'Failed to toggle rule');
    }
  };

  // Test run a rule
  const handleTriggerTest = async (rule: Rule) => {
    // Safety check for real physical devices
    if (integrationMode === 'LIVE') {
      const confirmed = window.confirm(
        lang === 'hi'
          ? `सुरक्षा चेतावनी: आप लाइव हार्डवेयर मोड में हैं। क्या आप "${rule.title_hi}" नियम को अपने वास्तविक उपकरणों पर चलाना चाहते हैं?`
          : `Safety Confirmation: You are in LIVE HARDWARE MODE. Are you sure you want to execute "${rule.title}" on connected physical devices?`
      );
      if (!confirmed) return;
    }

    soundManager.playSimulationActivate();
    try {
      const res = await api.triggerRule(rule.id);
      await refreshStatus();
      showNotification(
        'success',
        lang === 'hi' ? 'स्मार्ट नियम निष्पादित! ⚡' : 'Rule Executed! ⚡',
        lang === 'hi' ? res.message : res.message
      );
    } catch (e) {
      showNotification('alert', 'Error', 'Failed to test rule execution');
    }
  };

  // Delete rule
  const handleDeleteRule = async (id: string) => {
    soundManager.playNavTick();
    try {
      await api.deleteRule(id);
      await refreshStatus();
      showNotification('info', 'Deleted', 'Rule removed from smart home engine');
    } catch (e) {
      showNotification('alert', 'Error', 'Failed to delete rule');
    }
  };

  // Create rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    soundManager.playSuccessChime();
    try {
      await api.createRule({
        title: newTitle,
        title_hi: newTitleHi || newTitle,
        description: newDesc || `Rule triggering when ${newTriggerType} meets ${newThreshold}`,
        description_hi: newDesc || `कस्टम ऊर्जा ऑटोमेशन नियम`,
        trigger_type: newTriggerType,
        threshold_val: newThreshold,
        action_type: newActionType,
        target_appliance_id: newTargetApp
      });
      await refreshStatus();
      setIsCreateOpen(false);
      setNewTitle('');
      setNewTitleHi('');
      setNewDesc('');
      showNotification('success', 'Created', 'New automation rule successfully activated');
    } catch (e) {
      showNotification('alert', 'Error', 'Failed to create rule');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              {lang === 'hi' ? 'स्वायत्त ऑटोमेशन इंजन' : 'Autonomous Rule Engine'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-ivory tracking-tight">
            SMART ENERGY RULES
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {lang === 'hi'
              ? 'जब कोई घर में न हो, लोड 3.5 kW पार करे या पीक ऑवर हो — स्वतः निर्णय लें'
              : 'Deterministic automation policies that continuously evaluate against simulated telemetry'}
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-charcoal-950" />
          <span>{lang === 'hi' ? 'नया नियम बनाएं' : 'Create Automation Rule'}</span>
        </button>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => {
          const isEnabled = rule.is_enabled === 1;

          return (
            <div
              key={rule.id}
              className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                isEnabled
                  ? 'bg-charcoal-900/90 border-amber-500/25 shadow-lg shadow-amber-500/5'
                  : 'bg-charcoal-950/80 border-white/5 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Zap className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="text-sm font-bold text-ivory font-hindi">
                      {lang === 'hi' ? rule.title_hi : rule.title}
                    </h3>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleRule(rule)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 ${
                      isEnabled ? 'bg-amber-500' : 'bg-charcoal-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-charcoal-950 shadow transform transition-transform duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-ivory-dark leading-relaxed font-hindi mb-4">
                  {lang === 'hi' ? rule.description_hi : rule.description}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-amber-300">
                  <span className="px-2 py-0.5 rounded-full bg-charcoal-850 border border-white/5">
                    Trigger: {rule.trigger_type}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-charcoal-850 border border-white/5">
                    Action: {rule.action_type}
                  </span>
                  <span className="px-2 py-0.5 rounded-full copper-badge">
                    Triggered {rule.trigger_count}x
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[10px] text-ivory-dark font-mono">
                  {rule.last_triggered_at ? `Last run: ${rule.last_triggered_at.split(' ')[1] || 'Today'}` : 'Idle'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    title="Delete rule"
                    className="p-1.5 rounded-lg bg-charcoal-850 hover:bg-rose-900/40 text-ivory-dark hover:text-rose-400 transition border border-white/5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleTriggerTest(rule)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 border border-amber-500/30 text-amber-300 font-semibold text-xs transition active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-amber-400" />
                    <span>{lang === 'hi' ? 'टेस्ट रन' : 'Test Run'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Rule Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
          <form
            onSubmit={handleCreateRule}
            className="relative w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-charcoal-900 border border-amber-500/40 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ivory flex items-center gap-2">
                <Workflow className="w-5 h-5 text-amber-400" />
                <span>{lang === 'hi' ? 'नया स्मार्ट नियम बनाएं' : 'Create Automation Policy'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg bg-charcoal-800 text-ivory"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-ivory-dark mb-1">Rule Title (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon Heavy Load Shedder"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-ivory-dark mb-1">शीर्षक (हिन्दी)</label>
                <input
                  type="text"
                  placeholder="उदा. दोपहर लोड शेडिंग नियम"
                  value={newTitleHi}
                  onChange={(e) => setNewTitleHi(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory focus:border-amber-400 outline-none font-hindi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ivory-dark mb-1">Trigger Condition</label>
                  <select
                    value={newTriggerType}
                    onChange={(e) => setNewTriggerType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory focus:border-amber-400 outline-none"
                  >
                    <option value="power_threshold">Instant Power Exceeds</option>
                    <option value="occupancy_empty">When Nobody is Home</option>
                    <option value="night_standby">After Midnight (Standby)</option>
                    <option value="peak_tariff">During Peak Tariff Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ivory-dark mb-1">Threshold (Watts)</label>
                  <input
                    type="number"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory focus:border-amber-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ivory-dark mb-1">Action to Execute</label>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory focus:border-amber-400 outline-none"
                  >
                    <option value="shed_heavy_load">Shed Heavy Load (Pump/Washer)</option>
                    <option value="turn_off_non_essential">Turn Off Non-Essential</option>
                    <option value="cut_standby">Cut Standby Circuits</option>
                    <option value="adjust_setpoint">Set AC to 25°C Eco</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ivory-dark mb-1">Target Appliance</label>
                  <select
                    value={newTargetApp}
                    onChange={(e) => setNewTargetApp(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory focus:border-amber-400 outline-none"
                  >
                    <option value="pump">Water Pump</option>
                    <option value="washer">Washing Machine</option>
                    <option value="ac">Master AC</option>
                    <option value="tv">Living Room TV</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-xl bg-charcoal-800 text-xs text-ivory"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs shadow-md transition"
              >
                Activate Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
