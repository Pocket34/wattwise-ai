// WattWise AI — Settings: Configuration, tariff schedules & simulation controls
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Volume2, VolumeX, IndianRupee,
  Gauge, Globe, RefreshCcw, Save, ShieldCheck, Sparkles
} from 'lucide-react';
import { useStore } from '../store';
import { playSound, setSoundEnabled, isSoundEnabled } from '../sound';
import type { Settings as SettingsType } from '../types';

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const loading = useStore((s) => s.loadingSettings);
  const fetchSettings = useStore((s) => s.fetchSettings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);
  const showNotification = useStore((s) => s.showNotification);

  const [formData, setFormData] = useState<SettingsType>({
    tariff: '8.00',
    peak_tariff: '11.50',
    language: 'en',
    sound: 'true',
    voice: 'true',
    simulation_speed: '1x',
    theme: 'dark',
    currency: '₹',
  });

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (key: keyof SettingsType, val: string) => {
    playSound('tick');
    if (key === 'sound') {
      setSoundEnabled(val === 'true');
    }
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('activate');
    setSaving(true);
    try {
      await updateSettings(formData);
      playSound('success');
      showNotification('Settings saved successfully!', 'success');
    } catch (err: any) {
      playSound('warning');
      showNotification(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all appliance telemetry and demo states to factory baseline?')) {
      return;
    }
    playSound('warning');
    setResetting(true);
    try {
      await resetAll();
      playSound('success');
      showNotification('Reset complete. Demo state reloaded.', 'success');
    } catch (err: any) {
      showNotification('Reset failed', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-ww-amber" />
          <h1 className="text-2xl font-bold text-ww-ivory">System Settings</h1>
        </div>
        <p className="text-sm text-ww-ivory-dim mt-1">
          Configure regional tariff tiers, telemetry cadence, and user preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tariff Configuration */}
        <div className="p-6 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl space-y-4">
          <h2 className="text-base font-bold text-ww-ivory flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-ww-amber" />
            Tariff &amp; Utility Billing Rules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-ww-ivory mb-1.5">
                Standard Tariff (₹ per kWh)
              </label>
              <input
                type="text"
                value={formData.tariff || '8.00'}
                onChange={(e) => handleChange('tariff', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ww-surface border border-ww-border/60 rounded-xl text-ww-ivory focus:outline-none focus:border-ww-amber/50 font-mono"
              />
              <p className="text-[11px] text-ww-ivory-dim/70 mt-1">Base rate for normal domestic daytime hours.</p>
            </div>

            <div>
              <label className="block font-medium text-ww-ivory mb-1.5">
                Peak Hours Tariff (₹ per kWh)
              </label>
              <input
                type="text"
                value={formData.peak_tariff || '11.50'}
                onChange={(e) => handleChange('peak_tariff', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ww-surface border border-ww-border/60 rounded-xl text-ww-ivory focus:outline-none focus:border-ww-amber/50 font-mono"
              />
              <p className="text-[11px] text-ww-ivory-dim/70 mt-1">Applied during peak evening hours (18:00 - 22:00).</p>
            </div>
          </div>
        </div>

        {/* Audio & Simulation Preferences */}
        <div className="p-6 rounded-2xl bg-ww-card/70 border border-ww-border/50 backdrop-blur-xl space-y-4">
          <h2 className="text-base font-bold text-ww-ivory flex items-center gap-2">
            <Gauge className="w-4 h-4 text-ww-orange" />
            Simulation &amp; Audio Feedback
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Simulation speed */}
            <div>
              <label className="block font-medium text-ww-ivory mb-1.5">Simulation Speed</label>
              <select
                value={formData.simulation_speed || '1x'}
                onChange={(e) => handleChange('simulation_speed', e.target.value)}
                className="w-full px-3 py-2.5 bg-ww-surface border border-ww-border/60 rounded-xl text-ww-ivory focus:outline-none focus:border-ww-amber/50"
              >
                <option value="1x">1x (Real-time speed)</option>
                <option value="2x">2x Accelerated</option>
                <option value="5x">5x Fast Demo</option>
              </select>
            </div>

            {/* Sound Toggle */}
            <div>
              <label className="block font-medium text-ww-ivory mb-1.5">Sound Effects</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('sound', 'true')}
                  className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
                    formData.sound === 'true'
                      ? 'bg-ww-amber/15 border-ww-amber/50 text-ww-amber font-bold'
                      : 'bg-ww-surface border-ww-border/40 text-ww-ivory-dim hover:text-ww-ivory'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  On
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('sound', 'false')}
                  className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
                    formData.sound === 'false'
                      ? 'bg-ww-surface border-ww-amber/50 text-ww-ivory font-bold'
                      : 'bg-ww-surface border-ww-border/40 text-ww-ivory-dim hover:text-ww-ivory'
                  }`}
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  Mute
                </button>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block font-medium text-ww-ivory mb-1.5">Interface Language</label>
              <select
                value={formData.language || 'en'}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full px-3 py-2.5 bg-ww-surface border border-ww-border/60 rounded-xl text-ww-ivory focus:outline-none focus:border-ww-amber/50"
              >
                <option value="en">English (US / IN)</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-xs font-semibold text-red-300 hover:bg-red-900/40 transition-all w-full sm:w-auto justify-center"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting...' : 'Reset Demo Baseline'}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-ww-amber text-ww-bg font-bold text-xs uppercase tracking-wider hover:bg-ww-amber-dim transition-all shadow-md shadow-ww-amber/15 w-full sm:w-auto justify-center"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
