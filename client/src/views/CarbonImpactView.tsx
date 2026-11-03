import React, { useState, useEffect } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { api } from '../services/api';
import { CarbonData } from '../types';
import {
  Leaf,
  Sprout,
  Trees,
  Car,
  TrendingDown,
  Sparkles,
  Zap,
  Globe,
  Share2
} from 'lucide-react';

const DEFAULT_CARBON: CarbonData = {
  co2SavedTodayKg: 2.8,
  co2SavedMonthKg: 84.5,
  treesEquivalent: 4.2,
  evKmEquivalent: 540,
  currentDailyCo2Kg: 11.6,
  impactStory: 'By optimizing your dual-inverter AC setpoint and eliminating standby vampire draw, your home is on track to avoid 84.5 kg of CO₂ emissions this month.',
  impactStoryHi: 'अपने एसी को 24°C पर चलाकर और वैम्पायर बिजली बंद करके, आपका घर इस महीने 84.5 किग्रा CO₂ उत्सर्जन रोकने की राह पर है।'
};

export const CarbonImpactView: React.FC = () => {
  const { lang, telemetry } = useEnergy();
  const [carbon, setCarbon] = useState<CarbonData>(DEFAULT_CARBON);

  useEffect(() => {
    let isMounted = true;
    const fetchCarbon = async () => {
      try {
        const res = await api.getCarbon();
        if (res && res.success && isMounted) {
          setCarbon(res);
        }
      } catch (e) {
        console.warn('Using baseline carbon data:', e);
      }
    };
    fetchCarbon();
    return () => { isMounted = false; };
  }, [telemetry]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-lime-bright" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-lime-bright">
              {lang === 'hi' ? 'पर्यावरणीय प्रभाव एवं कार्बन लाभांश' : 'Environmental Dividend & Carbon Offset'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-ivory tracking-tight">
            CARBON & CLIMATE IMPACT
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {lang === 'hi'
              ? 'बचाई गई प्रत्येक यूनिट सीधे भारतीय ग्रिड पर थर्मल कोयले के दहन को रोकती है'
              : 'Every kWh saved directly avoids thermal coal generation on the Indian power grid (0.82 kg CO₂ / unit)'}
          </p>
        </div>

        <div className="text-xs font-mono text-lime-bright px-3 py-1.5 rounded-xl bg-charcoal-900 border border-lime-500/30 flex items-center gap-2">
          <Globe className="w-4 h-4 text-lime-bright" />
          <span>BEE Grid Standard 0.82 kg/kWh</span>
        </div>
      </div>

      {/* 4 Carbon Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly CO2 Avoided */}
        <div className="p-5 rounded-3xl glass-card border border-lime-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ivory-dark font-hindi">
              {lang === 'hi' ? 'मासिक CO₂ बचत' : 'CO₂ Avoided This Month'}
            </span>
            <div className="p-2 rounded-xl bg-lime-500/15 text-lime-bright">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-lime-bright">
              {carbon ? carbon.co2SavedMonthKg : '--'}
            </span>
            <span className="text-xs font-mono text-lime-400">kg CO₂</span>
          </div>
          <p className="text-[10px] text-lime-400/80 mt-1 font-mono">
            Direct atmospheric emissions averted
          </p>
        </div>

        {/* Metric 2: Equivalent Trees */}
        <div className="p-5 rounded-3xl glass-card border border-amber-500/25">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ivory-dark font-hindi">
              {lang === 'hi' ? 'बराबर पेड़' : 'Equivalent Mature Trees'}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Trees className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-amber-300">
              {carbon ? carbon.treesEquivalent : '--'}
            </span>
            <span className="text-xs font-mono text-amber-200">trees</span>
          </div>
          <p className="text-[10px] text-amber-200/70 mt-1 font-hindi">
            {lang === 'hi' ? 'वार्षिक CO₂ अवशोषण के बराबर' : 'Annual carbon absorption equivalent'}
          </p>
        </div>

        {/* Metric 3: EV Distance Equivalent */}
        <div className="p-5 rounded-3xl glass-card border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ivory-dark font-hindi">
              {lang === 'hi' ? 'ईवी यात्रा समतुल्य' : 'EV Travel Equivalent'}
            </span>
            <div className="p-2 rounded-xl bg-copper-500/20 text-copper-light">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-ivory">
              {carbon ? carbon.evKmEquivalent : '--'}
            </span>
            <span className="text-xs font-mono text-amber-300">km</span>
          </div>
          <p className="text-[10px] text-ivory-dark mt-1 font-mono">
            Zero-emission driving distance
          </p>
        </div>

        {/* Metric 4: Saved Today */}
        <div className="p-5 rounded-3xl glass-card border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ivory-dark font-hindi">
              {lang === 'hi' ? 'आज रोकी गई CO₂' : 'Avoided Today'}
            </span>
            <div className="p-2 rounded-xl bg-charcoal-800 text-ivory">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-ivory">
              {carbon ? carbon.co2SavedTodayKg : '--'}
            </span>
            <span className="text-xs font-mono text-ivory-dark">kg CO₂</span>
          </div>
          <p className="text-[10px] text-ivory-dark mt-1 font-mono">
            Today's optimized actions
          </p>
        </div>
      </div>

      {/* "YOUR IMPACT STORY" Narrative Card */}
      {carbon && (
        <div className="p-6 sm:p-7 rounded-3xl glass-card border border-lime-500/30 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-2xl bg-lime-500/20 text-lime-bright border border-lime-500/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-lime-bright">
                {lang === 'hi' ? 'आपकी पर्यावरण प्रभाव गाथा' : 'YOUR CLIMATE IMPACT STORY'}
              </span>
              <h3 className="text-lg font-bold text-ivory font-hindi">
                {lang === 'hi' ? 'घर से शुरू हुआ हरित बदलाव' : 'Home-Grown Green Transformation'}
              </h3>
            </div>
          </div>

          <p className="text-sm sm:text-base text-ivory/90 leading-relaxed font-hindi p-4 rounded-2xl bg-charcoal-900/90 border border-white/5">
            {lang === 'hi' ? carbon.impactStoryHi : carbon.impactStory}
          </p>

          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ivory-dark">
            <span className="font-hindi">
              {lang === 'hi'
                ? 'वाटवाइज़ एआई के साथ आपका घर ग्रिड पर स्वच्छ ऊर्जा संतुलन बनाने में मदद कर रहा है।'
                : 'WattWise AI ensures household energy efficiency directly correlates with measurable decarbonization.'}
            </span>
            <span className="text-lime-bright font-mono font-bold shrink-0">
              Net Zero Milestone Tracker Active
            </span>
          </div>
        </div>
      )}

      {/* Grid Decarbonization Infographic */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <h4 className="text-sm font-bold text-ivory font-hindi">
          {lang === 'hi' ? 'भारतीय बिजली ग्रिड संरचना और ऊर्जा बचत का महत्व' : 'Indian Power Grid Generation Mix & Decarbonization'}
        </h4>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-ivory-dark">Thermal Coal (~71%)</span>
            <span className="text-amber-400">Peak Contaminant</span>
          </div>
          <div className="w-full h-3 rounded-full bg-charcoal-800 overflow-hidden flex">
            <div className="h-full bg-amber-600 w-[71%]" title="Thermal Coal 71%" />
            <div className="h-full bg-lime-500 w-[23%]" title="Renewables 23%" />
            <div className="h-full bg-copper-500 w-[6%]" title="Hydro/Nuclear 6%" />
          </div>
          <div className="flex justify-between text-[10px] text-ivory-dark font-mono pt-1">
            <span className="text-amber-400">Coal 71%</span>
            <span className="text-lime-bright">Solar & Wind 23%</span>
            <span className="text-copper-light">Hydro & Nuclear 6%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
