import React, { useState, useEffect } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { api } from '../services/api';
import { ForecastData } from '../types';
import {
  Receipt,
  TrendingDown,
  TrendingUp,
  Info,
  Calendar,
  IndianRupee,
  ShieldAlert,
  Zap,
  Sliders,
  Sparkles
} from 'lucide-react';

const DEFAULT_FORECAST: ForecastData = {
  currentUsageKwhToday: 17.5,
  projectedMonthlyKwh: 525,
  projectedBill: 3955,
  previousMonthKwh: 540,
  previousMonthBill: 4200,
  optimizedMonthlyKwh: 380,
  optimizedBill: 2772,
  potentialSavings: 1183,
  tariffRate: 8.0,
  tariffModel: 'slab',
  slabs: [
    { name: 'Lifeline Tier (0-100 kWh)', rate: '₹4.50', limit: 100, consumed: 100, cost: 450 },
    { name: 'Standard Tier (101-300 kWh)', rate: '₹7.20', limit: 300, consumed: 200, cost: 1440 },
    { name: 'Peak Surcharge (>300 kWh)', rate: '₹9.80', limit: '300+', consumed: 225, cost: 2065 }
  ]
};

export const BillForecastView: React.FC = () => {
  const { lang, telemetry, settings, showNotification, refreshStatus } = useEnergy();
  const [forecast, setForecast] = useState<ForecastData>(DEFAULT_FORECAST);
  const [tariffRate, setTariffRate] = useState<number>(8.0);
  const [tariffModel, setTariffModel] = useState<'slab' | 'flat'>('slab');

  const fetchForecast = async () => {
    try {
      const res = await api.getForecast();
      if (res.success) {
        setForecast(res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [telemetry]);

  const handleUpdateTariff = async () => {
    try {
      await api.updateSettings({
        tariff_kwh: String(tariffRate),
        tariff_model: tariffModel
      });
      await refreshStatus();
      await fetchForecast();
      showNotification('success', 'Tariff Updated', 'Electricity billing model recomputed.');
    } catch (e) {}
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              {lang === 'hi' ? 'स्मार्ट बिलिंग मॉडल' : 'Predictive Tariff Engine'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-ivory tracking-tight">
            ELECTRICITY BILL FORECAST
          </h1>
          <p className="text-xs text-amber-200/70 font-hindi">
            {lang === 'hi'
              ? 'वर्तमान दैनिक खपत और स्लैब टैरिफ के आधार पर यथार्थवादी बिजली बिल पूर्वानुमान'
              : 'End-of-month simulated expenditure projection incorporating progressive tariff slabs'}
          </p>
        </div>

        {/* Disclaimer Pill */}
        <div className="p-2.5 px-3.5 rounded-xl bg-charcoal-900 border border-amber-500/20 text-[11px] text-amber-300 font-hindi flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{lang === 'hi' ? 'सिम्युलेटेड अनुमान • मानक आवासीय स्लैब मॉडल' : 'Simulated Estimate • BEE Residential Slabs'}</span>
        </div>
      </div>

      {/* Main 4 Forecast Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Projected Bill */}
        <div className="p-5 rounded-3xl glass-card border border-amber-500/30">
          <span className="text-xs text-ivory-dark font-hindi block">
            {lang === 'hi' ? 'प्रोजेक्टेड मासिक बिल' : 'Projected Month-End Bill'}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black font-mono text-amber-400">
              ₹{forecast ? forecast.projectedBill : '--'}
            </span>
          </div>
          <p className="text-[10px] text-amber-200/60 mt-1 font-mono">
            Based on ~{forecast ? forecast.projectedMonthlyKwh : '--'} kWh/mo
          </p>
        </div>

        {/* Card 2: Previous Month */}
        <div className="p-5 rounded-3xl glass-card border border-white/10">
          <span className="text-xs text-ivory-dark font-hindi block">
            {lang === 'hi' ? 'पिछले महीने का बिल' : 'Previous Month Bill'}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black font-mono text-ivory">
              ₹{forecast ? forecast.previousMonthBill : '--'}
            </span>
          </div>
          {forecast && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-lime-bright mt-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>
                -₹{forecast.previousMonthBill - forecast.projectedBill} (
                {(
                  ((forecast.previousMonthBill - forecast.projectedBill) /
                    forecast.previousMonthBill) *
                  100
                ).toFixed(1)}
                % lower)
              </span>
            </div>
          )}
        </div>

        {/* Card 3: Potential Optimized Bill */}
        <div className="p-5 rounded-3xl glass-card border border-lime-500/30">
          <span className="text-xs text-lime-bright font-hindi block font-semibold">
            {lang === 'hi' ? 'संभावित अनुकूलित बिल' : 'Potential Optimized Bill'}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black font-mono text-lime-bright">
              ₹{forecast ? forecast.optimizedBill : '--'}
            </span>
          </div>
          <p className="text-[10px] text-lime-400/80 mt-1 font-mono">
            Potential Saving: ₹{forecast ? forecast.potentialSavings : '--'}
          </p>
        </div>

        {/* Card 4: Daily Run Rate */}
        <div className="p-5 rounded-3xl glass-card border border-white/10">
          <span className="text-xs text-ivory-dark font-hindi block">
            {lang === 'hi' ? 'आज की दैनिक खपत' : "Today's Consumption"}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black font-mono text-ivory">
              {forecast ? forecast.currentUsageKwhToday : '--'}
            </span>
            <span className="text-xs font-mono text-amber-300">kWh</span>
          </div>
          <p className="text-[10px] text-ivory-dark mt-1 font-mono">
            ~₹{telemetry?.todayCost} today
          </p>
        </div>
      </div>

      {/* Indian Slab Breakdown Section */}
      <div className="p-6 rounded-3xl glass-card border border-amber-500/25 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-ivory font-hindi">
              {lang === 'hi' ? 'आवासीय स्लैब-वार बिल विश्लेषण' : 'Residential Slab Breakdown (Progressive Tariff)'}
            </h3>
            <p className="text-xs text-amber-200/60 font-hindi">
              {lang === 'hi'
                ? 'जैसे ही आपकी खपत उच्च स्लैब में जाती है, प्रति यूनिट दर बढ़ती है'
                : 'Unit tariffs increase progressively across consumption tiers'}
            </p>
          </div>
          <span className="text-xs font-mono copper-badge px-2.5 py-1 rounded-full">
            Standard DISCOM Structure
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {(forecast?.slabs || []).map((slab, idx) => (
            <div key={slab.name || idx} className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-ivory">{(slab?.name || 'Tier').split(' (')[0]}</span>
                <span className="text-amber-400 font-mono text-[11px]">{slab.rate}</span>
              </div>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xl font-black text-ivory">{Math.round(slab.consumed || 0)} kWh</span>
                <span className="text-xs text-lime-bright font-bold">₹{Math.round(slab.cost || 0)}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-charcoal-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-copper-500 rounded-full"
                  style={{
                    width: `${Math.min(100, ((slab.consumed || 0) / (typeof slab.limit === 'number' ? slab.limit : 100)) * 100)}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configurable Tariff Rate Box */}
      <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-ivory font-hindi flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>{lang === 'hi' ? 'टैरिफ मॉडल एवं दर कॉन्फ़िगर करें' : 'Configure Tariff Rate & Billing Model'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-ivory-dark mb-1 font-hindi">
              {lang === 'hi' ? 'बिलिंग मॉडल' : 'Billing Structure'}
            </label>
            <select
              value={tariffModel}
              onChange={(e) => setTariffModel(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-ivory outline-none"
            >
              <option value="slab">Progressive Slab Model (Recommended)</option>
              <option value="flat">Flat Rate Model</option>
            </select>
          </div>

          <div>
            <label className="block text-ivory-dark mb-1 font-hindi">
              {lang === 'hi' ? 'फ्लैट दर (₹ / kWh)' : 'Flat Rate (₹ / kWh)'}
            </label>
            <input
              type="number"
              step="0.5"
              min="4"
              max="15"
              value={tariffRate}
              onChange={(e) => setTariffRate(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-ivory font-mono outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleUpdateTariff}
              className="w-full py-2.5 px-4 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 border border-amber-500/30 text-amber-300 font-bold transition text-xs"
            >
              {lang === 'hi' ? 'टैरिफ लागू करें' : 'Recalculate Forecast'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
