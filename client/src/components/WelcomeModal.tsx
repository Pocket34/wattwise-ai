import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { Zap, Volume2, Sparkles, Check, ArrowRight } from 'lucide-react';
import { voiceAssistant } from '../utils/VoiceAssistant';
import { soundManager } from '../utils/SoundManager';
import { api } from '../services/api';

export const WelcomeModal: React.FC = () => {
  const { isWelcomeOpen, setIsWelcomeOpen, lang, setLanguage } = useEnergy();
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isWelcomeOpen) return null;

  const handleStart = async () => {
    soundManager.playSuccessChime();
    voiceAssistant.stop();
    setIsSpeaking(false);
    setIsWelcomeOpen(false);
    try {
      await api.updateSettings({ has_seen_welcome: 'true' });
    } catch (e) {}
  };

  const handleListenVoice = async () => {
    if (isSpeaking) {
      voiceAssistant.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    soundManager.playToggleClick(true);
    if (lang === 'hi') {
      await voiceAssistant.speakHindiGreeting();
    } else {
      await voiceAssistant.speakEnglishGreeting();
    }
    setIsSpeaking(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-charcoal-850 via-charcoal-900 to-charcoal-950 border border-amber-500/30 shadow-2xl shadow-amber-500/15 overflow-hidden">
        {/* Ambient Warm Glow background effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-copper-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon + Language Toggle */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-copper-600 shadow-md shadow-amber-500/30 border border-amber-300/40">
              <Zap className="w-7 h-7 text-charcoal-950 fill-charcoal-950" />
            </div>
            <div>
              <h2 className="text-xl font-black text-ivory tracking-tight">
                WattWise <span className="text-amber-400">AI</span>
              </h2>
              <p className="text-xs text-amber-300/70 font-mono">
                Adaptive Energy Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center bg-charcoal-950 border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                lang === 'hi' ? 'bg-amber-500 text-charcoal-950' : 'text-ivory-dark hover:text-ivory'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                lang === 'en' ? 'bg-amber-500 text-charcoal-950' : 'text-ivory-dark hover:text-ivory'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Greeting Body */}
        <div className="p-5 rounded-2xl bg-charcoal-900/80 border border-amber-500/20 mb-6 relative">
          <span className="text-2xl mb-2 inline-block">🙏</span>
          {lang === 'hi' ? (
            <div className="space-y-3 font-hindi text-ivory">
              <h3 className="text-lg font-bold text-amber-300">
                नमस्ते! WattWise AI में आपका स्वागत है।
              </h3>
              <p className="text-sm text-ivory/90 leading-relaxed">
                मैं आपके घर की बिजली समझने, बेकार ऊर्जा पहचानने और आपका बिजली बिल कम करने में आपकी मदद करूँगा।
              </p>
              <p className="text-xs text-amber-200/70 italic">
                "समझदार घर • कम बिल • बेहतर कल"
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-ivory">
              <h3 className="text-lg font-bold text-amber-300">
                Namaste! Welcome to WattWise AI.
              </h3>
              <p className="text-sm text-ivory/90 leading-relaxed">
                I am your adaptive smart home energy companion. Together, we observe household telemetry, detect hidden phantom waste, and optimize your monthly bill.
              </p>
              <p className="text-xs text-amber-200/70 italic">
                "Smart Home • Lower Bill • Better Tomorrow"
              </p>
            </div>
          )}
        </div>

        {/* Key Features highlights */}
        <div className="grid grid-cols-3 gap-2.5 mb-6 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-charcoal-900/60 border border-white/5">
            <span className="text-amber-400 font-bold block mb-0.5">👁️ Observe</span>
            <span className="text-[10px] text-ivory-dark">Live telemetry & pulse</span>
          </div>
          <div className="p-2.5 rounded-xl bg-charcoal-900/60 border border-white/5">
            <span className="text-amber-400 font-bold block mb-0.5">🔍 Detect</span>
            <span className="text-[10px] text-ivory-dark">Vampire leaks & spikes</span>
          </div>
          <div className="p-2.5 rounded-xl bg-charcoal-900/60 border border-white/5">
            <span className="text-lime-electric font-bold block mb-0.5">⚡ Save</span>
            <span className="text-[10px] text-ivory-dark">₹500–₹1200 / month</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Optional Voice narration button */}
          <button
            onClick={handleListenVoice}
            className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold transition ${
              isSpeaking
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                : 'bg-charcoal-850 hover:bg-charcoal-800 border-white/10 text-ivory'
            }`}
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>
              {isSpeaking
                ? (lang === 'hi' ? 'बोलना बंद करें' : 'Stop Voice')
                : (lang === 'hi' ? 'आवाज़ में सुनें' : 'Listen with AI Voice')}
            </span>
          </button>

          {/* Get Started / शुरू करें Button */}
          <button
            onClick={handleStart}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-sm shadow-lg shadow-amber-500/25 border border-amber-300/40 transition active:scale-95"
          >
            <span className="font-hindi tracking-wide">
              {lang === 'hi' ? 'शुरू करें' : 'Get Started'}
            </span>
            <ArrowRight className="w-4 h-4 text-charcoal-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
