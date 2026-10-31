import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import {
  Zap,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingDown,
  X,
  Play,
  RotateCcw,
  Search,
  Radio,
  Power,
  Leaf,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/SoundManager';

export const DemoGuideModal: React.FC = () => {
  const {
    isDemoModalOpen,
    setIsDemoModalOpen,
    runDemoStepAction,
    telemetry,
    lang,
    setNavSection
  } = useEnergy();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isDemoModalOpen) return null;

  const steps = [
    {
      num: 1,
      title: lang === 'hi' ? '1. डिवाइस खोजें (Discover)' : '1. Discover Smart Devices',
      desc:
        lang === 'hi'
          ? 'स्मार्ट होम ब्रिज Google Home, Matter, और स्थानीय सिम्युलेटर में 10 उपकरणों को स्वचालित रूप से खोजता है।'
          : 'Smart Home Bridge scans and discovers 10 appliances across Google Home, Matter, and local high-fidelity simulators.',
      actionText: lang === 'hi' ? 'उपकरण स्कैन करें' : 'Scan for Devices',
      badge: '10 Found',
      targetNav: 'bridge'
    },
    {
      num: 2,
      title: lang === 'hi' ? '2. उपकरण कनेक्ट करें (Connect)' : '2. Connect Household Fleet',
      desc:
        lang === 'hi'
          ? 'सभी खोजे गए उपकरण सुरक्षित मेश नेटवर्क व Google Home Graph से लिंक होते हैं।'
          : 'Establish live telemetry links with all 10 devices over Matter Thread mesh & Cloud Home Graph.',
      actionText: lang === 'hi' ? 'सभी उपकरण कनेक्ट करें' : 'Connect All Devices',
      badge: 'All Paired',
      targetNav: 'bridge'
    },
    {
      num: 3,
      title: lang === 'hi' ? '3. ऊर्जा रीडिंग शुरू (Generate Readings)' : '3. Stream Live Energy Readings',
      desc:
        lang === 'hi'
          ? 'कमरेवार बिजली लोड (लिविंग रूम, बेडरूम, किचन आदि) में वास्तविक समय टेलीमेट्री प्रवाहित होती है।'
          : 'Real-time wattage telemetry flows through all 5 rooms: Living Room, Bedroom, Kitchen, Bathroom, Utility.',
      actionText: lang === 'hi' ? 'रीडिंग शुरू करें' : 'Stream Telemetry',
      badge: 'Live 1Hz',
      targetNav: 'appliances'
    },
    {
      num: 4,
      title: lang === 'hi' ? '4. शाम का लोड सर्ज (Energy Surge Problem)' : '4. Trigger Energy Surge Problem',
      desc:
        lang === 'hi'
          ? 'समस्या सिमुलेशन: एसी 19°C पर, गीज़र और टीवी स्टैंडबाय एक साथ चालू। कुल घरेलू लोड 3,850+ वाट पार कर जाता है!'
          : 'Evening surge occurs: AC set to 19°C, geyser idling, TV phantom standby active. Load spikes past 3,850W!',
      actionText: lang === 'hi' ? 'लोड सर्ज सक्रिय करें' : 'Trigger Evening Spike',
      badge: 'Surge: 3.8kW',
      targetNav: 'pulse'
    },
    {
      num: 5,
      title: lang === 'hi' ? '5. एआई ने समस्या समझाई (AI Explains)' : '5. AI Energy Advisor Explains',
      desc:
        lang === 'hi'
          ? 'वाटवाइज़ एआई ने पहचाना: एसी 19°C पर 41% अधिक ऊर्जा खींच रहा है, और टीवी 35W फैंटम पावर बर्बाद कर रहा है।'
          : 'WattWise AI detects 42% preventable waste: sub-optimal 19°C AC setpoint and 35W phantom standby drain.',
      actionText: lang === 'hi' ? 'एआई विश्लेषण देखें' : 'Examine AI Insights',
      badge: 'Anomalies Flagged',
      targetNav: 'leaks'
    },
    {
      num: 6,
      title: lang === 'hi' ? '6. स्मार्ट सेविंग चालू (Optimize Now)' : '6. Engage Smart Saving Mode',
      desc:
        lang === 'hi'
          ? 'एक क्लिक में स्वायत्त ऊर्जा संरक्षण लागू: एसी 24°C इको-कम्फर्ट, गीज़र ऑटो-कटऑफ, और स्टैंडबाय सर्किट आइसोलेट।'
          : 'One-click autonomous curtailment: AC to 24°C, geyser auto-cutoff, TV standby cut, lights dimmed to 70%.',
      actionText: lang === 'hi' ? 'स्मार्ट सेविंग लागू करें' : 'Optimize Now (1-Click)',
      badge: 'Saving Active',
      targetNav: 'bridge'
    },
    {
      num: 7,
      title: lang === 'hi' ? '7. बिजली खपत में भारी गिरावट (Consumption Drops)' : '7. Power Consumption Drops',
      desc:
        lang === 'hi'
          ? 'घर की बिजली खपत 3,850W से सीधे गिरकर 1,690W पर आ जाती है — कुल 56% लोड में तुरंत कमी!'
          : 'Instant real-time power drop: household consumption plunges from 3,850W down to 1,690W (-2,160W).',
      actionText: lang === 'hi' ? 'कम लोड की पुष्टि करें' : 'Verify Power Drop',
      badge: 'Down to 1,690W',
      targetNav: 'pulse'
    },
    {
      num: 8,
      title: lang === 'hi' ? '8. मासिक बचत और कार्बन प्रभाव (Savings Increase)' : '8. Savings & Carbon Impact Rise',
      desc:
        lang === 'hi'
          ? 'मासिक बिजली बिल में ₹740+ की सीधी बचत और 38 किग्रा CO₂ उत्सर्जन की रोकथाम दर्ज होती है।'
          : 'Monthly bill forecast drops by ₹740+ and carbon footprint tracker registers 38 kg CO₂ prevented.',
      actionText: lang === 'hi' ? 'बचत व कार्बन देखें' : 'Review Bill Savings',
      badge: 'Save ₹740/mo',
      targetNav: 'forecast'
    },
    {
      num: 9,
      title: lang === 'hi' ? '9. स्मार्ट होम पूर्णतः अनुकूलित (Optimized State)' : '9. Smart Home Fully Optimized',
      desc:
        lang === 'hi'
          ? 'बधाई हो! घर का एनर्जी पल्स शांत हरे ताल में धड़क रहा है। समझदार घर, कम बिल, बेहतर कल!'
          : 'Living Home Energy Pulse beats in serene eco-rhythm. Samajhdaar Ghar. Kam Bill. Behtar Kal.',
      actionText: lang === 'hi' ? 'डैशबोर्ड एक्सप्लोर करें' : 'Explore Dashboard',
      badge: '100% Complete',
      targetNav: 'home'
    }
  ];

  const handleExecuteStep = async (stepNum: number) => {
    setIsProcessing(true);
    await runDemoStepAction(stepNum);
    setIsProcessing(false);

    if (stepNum === 6 || stepNum === 9) {
      soundManager.playSuccessChime();
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }

    if (stepNum < 9) {
      setCurrentStep(stepNum + 1);
    } else {
      setIsDemoModalOpen(false);
      setNavSection('home');
    }
  };

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-charcoal-850 via-charcoal-900 to-charcoal-950 border border-amber-500/40 shadow-2xl shadow-amber-500/20 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={() => setIsDemoModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl bg-charcoal-900 border border-white/10 text-ivory-dark hover:text-ivory transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-300">
            <Play className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-ivory">
                {lang === 'hi' ? '9-चरणीय जज लाइव वॉकथ्रू' : '9-Step Judge Demo Flow'}
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full copper-badge font-mono font-bold">
                End-to-End Walkthrough
              </span>
            </div>
            <p className="text-xs text-amber-300/70 font-hindi">
              {lang === 'hi'
                ? 'खोजें → कनेक्ट करें → रीडिंग → लोड सर्ज → एआई सलाह → अनुकूलन → बचत'
                : 'Discover → Connect → Readings → Surge → AI Explains → Optimize → Slashed'}
            </p>
          </div>
        </div>

        {/* 9-Step Progress Stepper Ribbon */}
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 mb-5 overflow-x-auto py-1 shrink-0">
          {steps.map((s) => (
            <div
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`p-1.5 rounded-xl border text-center cursor-pointer transition text-[10px] font-mono ${
                currentStep === s.num
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                  : currentStep > s.num
                  ? 'bg-lime-500/10 border-lime-500/30 text-lime-bright'
                  : 'bg-charcoal-900 border-white/5 text-ivory-dark'
              }`}
            >
              <div className="font-bold">Step {s.num}</div>
              <div className="text-[8px] truncate mt-0.5">
                {currentStep > s.num ? '✓ Done' : s.badge}
              </div>
            </div>
          ))}
        </div>

        {/* Current Step Card */}
        <div className="p-5 rounded-2xl bg-charcoal-900/90 border border-amber-500/20 mb-5 space-y-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-amber-300 font-hindi">
              {currentStepData.title}
            </h3>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-charcoal-800 text-ivory border border-white/10">
              {telemetry ? `${telemetry.currentWatts} Watts Load` : '---'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-ivory/85 leading-relaxed font-hindi">
            {currentStepData.desc}
          </p>

          {/* Quick Metrics Flash */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/5 text-center">
            <div className="p-2.5 rounded-xl bg-charcoal-950/80 border border-white/5">
              <span className="text-[10px] text-ivory-dark block font-mono">Real-time Load</span>
              <span className="text-xs sm:text-sm font-bold text-amber-400 font-mono">
                {telemetry ? `${telemetry.currentWatts} W` : '---'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-charcoal-950/80 border border-white/5">
              <span className="text-[10px] text-ivory-dark block font-mono">Efficiency</span>
              <span className="text-xs sm:text-sm font-bold text-lime-electric font-mono">
                {telemetry ? `${telemetry.efficiencyScore}%` : '---'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-charcoal-950/80 border border-white/5">
              <span className="text-[10px] text-ivory-dark block font-mono">Preventable Waste</span>
              <span className="text-xs sm:text-sm font-bold text-rose-400 font-mono">
                {telemetry ? `₹${telemetry.potentialSavingsTodayCost}/day` : '---'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 shrink-0 pt-2 border-t border-white/5">
          <button
            onClick={() => {
              setCurrentStep(1);
              runDemoStepAction(1);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 border border-white/10 text-xs text-ivory transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={() => handleExecuteStep(currentStep)}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 border border-amber-300/40 transition active:scale-95 disabled:opacity-50"
          >
            <span>{currentStepData.actionText}</span>
            <ArrowRight className="w-4 h-4 text-charcoal-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
