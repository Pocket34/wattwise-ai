import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { Goal } from '../types';
import { api } from '../services/api';
import {
  Target,
  Plus,
  CheckCircle,
  Award,
  Sparkles,
  TrendingDown,
  X,
  Zap,
  Check
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';
import confetti from 'canvas-confetti';

export const EnergyGoalsView: React.FC = () => {
  const { goals, refreshStatus, showNotification, lang } = useEnergy();

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTitleHi, setNewTitleHi] = useState<string>('');
  const [newMetric, setNewMetric] = useState<string>('bill_reduction_pct');
  const [newTargetVal, setNewTargetVal] = useState<number>(15);
  const [newUnit, setNewUnit] = useState<string>('%');

  const safeGoals = goals || [];
  const activeGoals = safeGoals.filter(g => g.status === 'active');
  const completedGoals = safeGoals.filter(g => g.status === 'completed');

  // Complete goal with celebration
  const handleCompleteGoal = async (goal: Goal) => {
    soundManager.playSuccessChime();
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    try {
      await api.completeGoal(goal.id);
      await refreshStatus();
      showNotification(
        'success',
        lang === 'hi' ? 'लक्ष्य पूरा हुआ! 🎉' : 'Goal Accomplished! 🎉',
        lang === 'hi' ? `बधाई! आपने "${goal.title_hi}" सफलतापूर्वक हासिल कर लिया है।` : `Congratulations! You achieved "${goal.title}".`
      );
    } catch (e) {
      showNotification('alert', 'Error', 'Failed to complete goal');
    }
  };

  // Create Goal
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    soundManager.playSuccessChime();
    try {
      await api.createGoal({
        title: newTitle,
        title_hi: newTitleHi || newTitle,
        description: `Target: ${newTargetVal} ${newUnit}`,
        target_metric: newMetric,
        target_value: newTargetVal,
        unit: newUnit
      });
      await refreshStatus();
      setIsCreateOpen(false);
      setNewTitle('');
      setNewTitleHi('');
      showNotification('success', 'Goal Added', 'New tracking target set.');
    } catch (e) {
      showNotification('alert', 'Error', 'Failed to create goal');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              {lang === 'hi' ? 'ऊर्जा बचत मील के पत्थर' : 'Efficiency Milestones'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-ivory tracking-tight">
            HOUSEHOLD ENERGY GOALS
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {lang === 'hi'
              ? 'मासिक बिल में कमी और दैनिक खपत सीमाएं निर्धारित करें एवं प्रगति ट्रैक करें'
              : 'Set personal targets to slash monthly bills, eliminate vampire draw, and track progress'}
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs shadow-md transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-charcoal-950" />
          <span>{lang === 'hi' ? 'नया लक्ष्य जोड़ें' : 'Create Energy Goal'}</span>
        </button>
      </div>

      {/* Active Goals Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-ivory font-hindi flex items-center gap-2">
          <span>{lang === 'hi' ? 'सक्रिय ऊर्जा लक्ष्य' : 'Active Energy Goals'}</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full copper-badge">
            {activeGoals.length} In Progress
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGoals.map((goal) => {
            const target = Number(goal.target_value) || 1;
            const current = Number(goal.current_value) || 0;
            const pct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));

            return (
              <div
                key={goal.id}
                className="p-5 rounded-3xl glass-card border border-amber-500/25 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-bold text-ivory font-hindi">
                      {lang === 'hi' ? goal.title_hi : goal.title}
                    </h4>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {pct}%
                    </span>
                  </div>

                  <p className="text-xs text-ivory-dark font-hindi mb-3">
                    {goal.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-charcoal-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-lime-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-ivory-dark pt-1">
                      <span>Current: {goal.current_value} {goal.unit}</span>
                      <span>Target: {goal.target_value} {goal.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Mark Complete Button */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-end">
                  <button
                    onClick={() => handleCompleteGoal(goal)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-850 hover:bg-lime-900/40 border border-lime-500/30 text-lime-bright text-xs font-semibold transition active:scale-95"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'पूरा हुआ चिह्नित करें' : 'Mark Completed'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Goals Showcase */}
      {completedGoals.length > 0 && (
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-ivory font-hindi">
              {lang === 'hi' ? 'उपलब्धियां एवं पूरे किए गए लक्ष्य' : 'Achieved Milestones & Trophies'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedGoals.map((g) => (
              <div key={g.id} className="p-3.5 rounded-2xl bg-charcoal-900/80 border border-lime-500/20 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-lime-500/20 text-lime-bright shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-ivory truncate font-hindi">
                    {lang === 'hi' ? g.title_hi : g.title}
                  </h4>
                  <span className="text-[10px] text-lime-400 font-mono">
                    100% Target Met • Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
          <form
            onSubmit={handleCreateGoal}
            className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-charcoal-900 border border-amber-500/40 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ivory flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                <span>{lang === 'hi' ? 'नया ऊर्जा लक्ष्य निर्धारित करें' : 'Set Energy Milestone'}</span>
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
                <label className="block text-ivory-dark mb-1">Goal Title (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cut AC consumption by 20%"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-ivory-dark mb-1">लक्ष्य शीर्षक (हिन्दी)</label>
                <input
                  type="text"
                  placeholder="उदा. मासिक बिल 15% घटाएं"
                  value={newTitleHi}
                  onChange={(e) => setNewTitleHi(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory outline-none focus:border-amber-400 font-hindi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ivory-dark mb-1">Metric Type</label>
                  <select
                    value={newMetric}
                    onChange={(e) => {
                      setNewMetric(e.target.value);
                      if (e.target.value === 'daily_kwh_max') setNewUnit('kWh/day');
                      else if (e.target.value === 'ac_hours_max') setNewUnit('hrs');
                      else setNewUnit('%');
                    }}
                    className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory outline-none"
                  >
                    <option value="bill_reduction_pct">Bill Reduction (%)</option>
                    <option value="daily_kwh_max">Daily Max (kWh)</option>
                    <option value="vampire_eliminated">Vampire Cutoff (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ivory-dark mb-1">Target Number</label>
                  <input
                    type="number"
                    value={newTargetVal}
                    onChange={(e) => setNewTargetVal(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-charcoal-950 border border-white/10 text-ivory outline-none font-mono"
                  />
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
                Save Target
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
