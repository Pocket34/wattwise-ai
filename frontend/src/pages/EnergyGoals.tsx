// WattWise AI — Energy Goals: Gamified conservation targets & progress tracking
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, CheckCircle2, Circle, Trash2,
  Trophy, RefreshCw, X, Calendar, Sparkles
} from 'lucide-react';
import { useStore } from '../store';
import { playSound } from '../sound';
import type { Goal } from '../types';

export default function EnergyGoals() {
  const goals = useStore((s) => s.goals);
  const loading = useStore((s) => s.loadingGoals);
  const fetchGoals = useStore((s) => s.fetchGoals);
  const createGoal = useStore((s) => s.createGoal);
  const updateGoal = useStore((s) => s.updateGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const showNotification = useStore((s) => s.showNotification);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState(15);
  const [unit, setUnit] = useState('kWh/day');
  const [type, setType] = useState('daily_kwh');
  const [deadline, setDeadline] = useState('End of Month');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleToggleComplete = async (goal: Goal) => {
    playSound('activate');
    const newState = goal.is_completed === 1 ? 0 : 1;
    await updateGoal(goal.id, { is_completed: newState });
    if (newState === 1) {
      playSound('success');
      showNotification(`Goal Achieved! "${goal.title}"`, 'success');
    } else {
      showNotification(`Goal "${goal.title}" set to in-progress`, 'info');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    playSound('tick');
    if (confirm(`Remove goal "${name}"?`)) {
      await deleteGoal(id);
      showNotification(`Goal removed`, 'info');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    playSound('activate');
    setSubmitting(true);
    try {
      await createGoal({
        title: title.trim(),
        target_value: Number(targetValue),
        unit,
        type,
        deadline,
      });
      playSound('success');
      showNotification('New conservation goal saved!', 'success');
      setTitle('');
      setIsModalOpen(false);
      await fetchGoals();
    } catch (err: any) {
      playSound('warning');
      showNotification(err.message || 'Failed to create goal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const safeGoals = Array.isArray(goals) ? goals : [];
  const completedCount = safeGoals.filter((g) => g && g.is_completed === 1).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-ww-amber" />
            <h1 className="text-2xl font-bold text-ww-ivory">Energy Goals</h1>
          </div>
          <p className="text-sm text-ww-ivory-dim mt-1">
            Set conservation targets and earn efficiency badges as your home optimizes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playSound('tick');
              fetchGoals();
            }}
            className="p-2.5 rounded-xl bg-ww-card border border-ww-border/60 text-ww-ivory hover:border-ww-amber/50 transition-all"
            title="Refresh Goals"
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
            Add Goal
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl">
          <p className="text-xs text-ww-ivory-dim">Active Challenges</p>
          <p className="text-2xl font-bold text-ww-ivory mt-1">{goals.length}</p>
          <p className="text-xs text-ww-ivory-dim/70 mt-1">Tracked milestones</p>
        </div>

        <div className="p-5 rounded-2xl bg-ww-card/70 border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl">
          <p className="text-xs text-emerald-300">Achieved Goals</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</p>
          <p className="text-xs text-emerald-500/80 mt-1">Verified target milestones</p>
        </div>

        <div className="p-5 rounded-2xl bg-ww-card/70 border border-ww-amber/30 backdrop-blur-xl">
          <p className="text-xs text-ww-amber">Success Ratio</p>
          <p className="text-2xl font-bold text-ww-amber mt-1">
            {goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0}%
          </p>
          <p className="text-xs text-ww-amber-dim mt-1">Overall completion rate</p>
        </div>
      </div>

      {/* Goals List */}
      {loading && goals.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-ww-amber/30 border-t-ww-amber rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="p-12 text-center bg-ww-card/40 border border-ww-border/40 rounded-2xl">
          <Trophy className="w-10 h-10 text-ww-ivory-dim mx-auto mb-2" />
          <p className="text-sm font-medium text-ww-ivory">No active energy goals</p>
          <p className="text-xs text-ww-ivory-dim mt-1">Click "Add Goal" above to create your first milestone</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {goals.map((g) => {
              const isCompleted = g.is_completed === 1;
              const current = g.current_value || 0;
              const target = g.target_value || 1;
              const pct = Math.min(100, Math.round((current / target) * 100));

              return (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`p-5 rounded-2xl border transition-all backdrop-blur-xl ${
                    isCompleted
                      ? 'bg-ww-card/90 border-emerald-500/40'
                      : 'bg-ww-card/70 border-ww-border/50 hover:border-ww-amber/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <button
                      onClick={() => handleToggleComplete(g)}
                      className="mt-0.5 text-ww-ivory-dim hover:text-emerald-400 transition-colors"
                      title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-ww-ivory-dim" />
                      )}
                    </button>

                    <div className="flex-1">
                      <h3 className={`text-sm font-bold ${isCompleted ? 'text-ww-ivory line-through opacity-70' : 'text-ww-ivory'}`}>
                        {g.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-ww-ivory-dim">
                        <Calendar className="w-3 h-3 text-ww-amber" />
                        <span>Deadline: {g.deadline || 'End of Month'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(g.id, g.title)}
                      className="p-1 rounded-lg text-ww-ivory-dim hover:text-red-400 transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-ww-border/30">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-ww-ivory-dim">Progress: {current} / {target} {g.unit}</span>
                      <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-ww-amber font-bold'}>
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-ww-surface overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-ww-amber to-ww-orange'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Goal Modal */}
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
                  <Target className="w-5 h-5 text-ww-amber" />
                  Add Conservation Target
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
                  <label className="block font-medium text-ww-ivory mb-1">Goal Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Keep daily consumption under 12 kWh"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-ww-surface border border-ww-border/60 rounded-xl text-ww-ivory placeholder-ww-ivory-dim/40 focus:outline-none focus:border-ww-amber/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-ww-ivory mb-1">Target Value</label>
                    <input
                      type="number"
                      required
                      value={targetValue}
                      onChange={(e) => setTargetValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-ww-surface border border-ww-border/60 rounded-xl text-ww-ivory focus:outline-none focus:border-ww-amber/50"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-ww-ivory mb-1">Unit</label>
                    <input
                      type="text"
                      required
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-ww-surface border border-ww-border/60 rounded-xl text-ww-ivory focus:outline-none focus:border-ww-amber/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-ww-ivory mb-1">Deadline / Target Horizon</label>
                  <input
                    type="text"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
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
                    {submitting ? 'Saving...' : 'Save Goal'}
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
