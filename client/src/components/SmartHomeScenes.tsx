import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { SmartScene } from '../types';
import {
  Moon,
  Home,
  Zap,
  Sun,
  PiggyBank,
  CheckCircle,
  Play,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export const SMART_SCENES: SmartScene[] = [
  {
    id: 'sleep',
    name: 'Sleep Mode',
    nameHi: 'स्लीप मोड',
    icon: '🌙',
    description: 'TV OFF • Living room lights OFF • AC → 24°C • Sockets to standby',
    descriptionHi: 'टीवी व हॉल की लाइटें बंद • एसी 24°C • स्टैंडबाय प्लग बंद',
    estDailySaving: 28,
    actions: ['TV Power: OFF', 'Lights: Living Room OFF', 'AC Setpoint: 24°C', 'Standby Plugs: Isolated']
  },
  {
    id: 'away',
    name: 'Away Mode',
    nameHi: 'अवे मोड (घर से बाहर)',
    icon: '🏠',
    description: 'Turn off all non-essential cooling, lights & electronics • Refrigerator protected',
    descriptionHi: 'सभी गैर-ज़रूरी उपकरण तुरंत बंद • रेफ्रिजरेटर सुरक्षित',
    estDailySaving: 65,
    actions: ['AC: OFF', 'Fans & Lights: OFF', 'Water Heaters: OFF', 'Fridge: 100% Protected']
  },
  {
    id: 'peak_saver',
    name: 'Peak Saver',
    nameHi: 'पीक सेवर (शाम का लोड)',
    icon: '⚡',
    description: 'AC trimmed to 25°C • Lights dimmed to 60% • Defer geyser & water pump cycles',
    descriptionHi: 'एसी 25°C • लाइट 60% डिम • गीज़र व पानी पंप चक्र स्थगित',
    estDailySaving: 42,
    actions: ['AC Setpoint: 25°C', 'Dimmer: 60% Brightness', 'Geyser & Pump: Deferred']
  },
  {
    id: 'morning',
    name: 'Morning Routine',
    nameHi: 'मॉर्निंग रूटीन',
    icon: '☀️',
    description: 'Geyser pre-heated to 55°C • AC turned OFF • Moderate natural daylight level',
    descriptionHi: 'गीज़र 55°C पर तैयार • एसी बंद • पंखा मध्यम गति',
    estDailySaving: 15,
    actions: ['Geyser: 55°C Shower Ready', 'AC: OFF', 'Fan: Speed Level 3', 'Lighting: 75% Daylight']
  },
  {
    id: 'bill_saver',
    name: 'Bill Saver (Max Eco)',
    nameHi: 'बिल सेवर (अधिकतम बचत)',
    icon: '💰',
    description: 'Aggressive systemic eco curtailment • Minimal thermal draw • Full vampire cutoff',
    descriptionHi: 'पूरे घर में आक्रामक इको मोड • वैम्पायर बिजली पूरी तरह समाप्त',
    estDailySaving: 55,
    actions: ['AC: 25°C Max Eco', 'Fan: Level 3 Balanced', 'Lights: 65% Ambient', 'Standby: Cut 100%']
  }
];

export const SmartHomeScenes: React.FC = () => {
  const { refreshStatus, showNotification, lang, settings } = useEnergy();
  const [activeSceneId, setActiveSceneId] = useState<string>(settings?.active_scene || 'sleep');
  const [isApplying, setIsApplying] = useState<string | null>(null);

  const handleActivateScene = async (scene: SmartScene) => {
    setIsApplying(scene.id);
    soundManager.playToggleClick(true);

    try {
      await api.applyScene(scene.id);
      soundManager.playSuccessChime();
      setActiveSceneId(scene.id);

      showNotification(
        'success',
        lang === 'hi' ? `${scene.nameHi} सक्रिय` : `${scene.name} Activated`,
        lang === 'hi'
          ? `सभी जुड़े उपकरण ${scene.nameHi} के अनुसार समायोजित। अनुमानित बचत: ~₹${scene.estDailySaving}/दिन।`
          : `Household fleet configured for ${scene.name}. Projected savings: ~₹${scene.estDailySaving}/day.`
      );

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      await refreshStatus();
    } catch (e) {
      showNotification('alert', 'Scene Error', 'Failed to execute scene across devices');
    } finally {
      setIsApplying(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ivory tracking-tight">
              {lang === 'hi' ? 'स्मार्ट होम सीन्स (Smart Home Scenes)' : 'Smart Home Scenes'}
            </h3>
            <p className="text-[11px] text-amber-200/70 font-hindi">
              {lang === 'hi'
                ? 'एक क्लिक में पूरे घर के उपकरणों को समन्वित करें और बिजली बचाएं'
                : '1-click multi-device orchestration presets with guaranteed daily cost reduction'}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-ivory-dark px-3 py-1 rounded-xl bg-charcoal-900 border border-white/5">
          Active Scene:{' '}
          <span className="text-lime-bright font-bold uppercase">
            {SMART_SCENES.find((s) => s.id === activeSceneId)?.name || 'Sleep Mode'}
          </span>
        </span>
      </div>

      {/* 5 Scene Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {SMART_SCENES.map((scene) => {
          const isActive = activeSceneId === scene.id;
          const isCurrentLoading = isApplying === scene.id;

          return (
            <div
              key={scene.id}
              className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${
                isActive
                  ? 'bg-charcoal-900 border-lime-500/40 shadow-lg shadow-lime-500/10'
                  : 'bg-charcoal-950/80 border-white/10 hover:border-amber-400/30 hover:bg-charcoal-900/60'
              }`}
            >
              <div>
                {/* Card Top: Icon & Active Pill */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{scene.icon}</span>
                  {isActive && (
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-bright border border-lime-500/30">
                      CURRENTLY ACTIVE
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <h4 className="text-sm font-bold text-ivory group-hover:text-amber-300 transition">
                  {lang === 'hi' ? scene.nameHi : scene.name}
                </h4>
                <p className="text-[11px] text-ivory-dark mt-1 line-clamp-2 leading-relaxed font-hindi">
                  {lang === 'hi' ? scene.descriptionHi : scene.description}
                </p>

                {/* Actions Bullet List */}
                <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1">
                  {scene.actions.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] text-ivory-dark font-mono">
                      <span className="w-1 h-1 rounded-full bg-amber-400" />
                      <span className="truncate">{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Bottom: Savings & Activate Button */}
              <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-ivory-dark">Est. Savings:</span>
                  <span className="text-lime-bright font-bold">~₹{scene.estDailySaving}/day</span>
                </div>

                <button
                  onClick={() => handleActivateScene(scene)}
                  disabled={isCurrentLoading}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 ${
                    isActive
                      ? 'bg-lime-500/20 text-lime-bright border border-lime-500/30 hover:bg-lime-500/30'
                      : 'bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold'
                  }`}
                >
                  {isCurrentLoading ? (
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  ) : isActive ? (
                    <CheckCircle className="w-3.5 h-3.5 text-lime-bright" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>
                    {isActive
                      ? (lang === 'hi' ? 'सक्रिय है' : 'Active Scene')
                      : (lang === 'hi' ? 'सीन चालू करें' : 'Activate Scene')}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
