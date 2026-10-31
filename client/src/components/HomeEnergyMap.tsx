import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { Appliance } from '../types';
import {
  Home,
  Tv,
  Wind,
  Refrigerator,
  Flame,
  Sun,
  Shirt,
  Laptop,
  Waves,
  Zap,
  Power,
  Sliders,
  Check,
  X,
  Sparkles,
  Shield,
  Layers,
  Thermometer,
  Gauge
} from 'lucide-react';
import { soundManager } from '../utils/SoundManager';

interface RoomDef {
  id: string;
  name: string;
  nameHi: string;
  icon: string;
  description: string;
  descriptionHi: string;
}

const ROOMS: RoomDef[] = [
  {
    id: 'Living Room',
    name: 'Living Room',
    nameHi: 'लिविंग रूम',
    icon: '🛋️',
    description: 'Entertainment & ambient zones',
    descriptionHi: 'मनोरंजन व एम्बिएंट क्षेत्र'
  },
  {
    id: 'Bedroom',
    name: 'Master Bedroom',
    nameHi: 'मास्टर बेडरूम',
    icon: '🛏️',
    description: 'High thermal & airflow consumption',
    descriptionHi: 'एसी एवं पंखा ऊर्जा क्षेत्र'
  },
  {
    id: 'Kitchen',
    name: 'Modular Kitchen',
    nameHi: 'मॉड्यूलर किचन',
    icon: '🍳',
    description: 'Continuous baseline & heating',
    descriptionHi: 'रेफ्रिजरेटर व माइक्रोवेव'
  },
  {
    id: 'Bathroom',
    name: 'Bathroom',
    nameHi: 'बाथरूम',
    icon: '🚿',
    description: 'Heavy thermal storage element',
    descriptionHi: 'गीज़र वाटर हीटिंग'
  },
  {
    id: 'Utility',
    name: 'Utility & Yard',
    nameHi: 'यूटिलिटी व वाटर पंप',
    icon: '🧺',
    description: 'Motorized high-torque cycles',
    descriptionHi: 'वॉशिंग मशीन व पानी पंप'
  }
];

export const HomeEnergyMap: React.FC = () => {
  const {
    appliances,
    toggleAppliance,
    setApplianceSpeed,
    setApplianceBrightness,
    setApplianceTemp,
    lang,
    telemetry
  } = useEnergy();

  const [selectedApplianceId, setSelectedApplianceId] = useState<string | null>(null);

  const selectedAppliance = appliances.find((a) => a.id === selectedApplianceId) || null;

  // Group appliances by room
  const getRoomAppliances = (roomName: string) => {
    return appliances.filter((a) => a.room.toLowerCase().includes(roomName.toLowerCase()) ||
      (roomName === 'Utility' && (a.id === 'washer' || a.id === 'pump')) ||
      (roomName === 'Living Room' && (a.id === 'tv' || a.id === 'lights')) ||
      (roomName === 'Bedroom' && (a.id === 'ac' || a.id === 'fan' || a.id === 'laptop')) ||
      (roomName === 'Kitchen' && (a.id === 'fridge' || a.id === 'microwave')) ||
      (roomName === 'Bathroom' && a.id === 'geyser')
    );
  };

  const getRoomTotalWatts = (roomName: string) => {
    const list = getRoomAppliances(roomName);
    return list.reduce((acc, cur) => acc + (cur.is_on ? cur.power_watts : (cur.vampire_active ? (cur.standby_watts || 5) : 0)), 0);
  };

  const getAuraColor = (watts: number) => {
    if (watts === 0) return 'border-white/10 bg-charcoal-900/60 shadow-none';
    if (watts < 300) return 'border-lime-500/30 bg-lime-950/15 shadow-lg shadow-lime-500/5';
    if (watts < 1500) return 'border-amber-500/40 bg-amber-950/15 shadow-xl shadow-amber-500/10';
    return 'border-rose-500/50 bg-rose-950/20 shadow-2xl shadow-rose-500/15 animate-pulse';
  };

  const getIntensityBadge = (watts: number) => {
    if (watts === 0) return { label: 'IDLE', color: 'text-ivory-dark bg-charcoal-800' };
    if (watts < 300) return { label: 'ECO LOAD', color: 'text-lime-bright bg-lime-500/20 border border-lime-500/30' };
    if (watts < 1500) return { label: 'MODERATE', color: 'text-amber-300 bg-amber-500/20 border border-amber-500/30' };
    return { label: 'HIGH INTENSITY', color: 'text-rose-400 bg-rose-500/20 border border-rose-500/40 font-bold' };
  };

  const getApplianceIcon = (id: string) => {
    switch (id) {
      case 'ac': return Wind;
      case 'fridge': return Refrigerator;
      case 'tv': return Tv;
      case 'geyser': return Flame;
      case 'fan': return Wind;
      case 'lights': return Sun;
      case 'washer': return Shirt;
      case 'laptop': return Laptop;
      case 'pump': return Waves;
      default: return Zap;
    }
  };

  const tariffRate = telemetry?.effectiveTariff || 8.0;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-charcoal-900/80 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ivory tracking-tight">
              {lang === 'hi' ? 'इंटरएक्टिव होम एनर्जी मैप' : 'Virtual Home Energy Floor Plan'}
            </h3>
            <p className="text-xs text-amber-200/70 font-hindi">
              {lang === 'hi'
                ? 'कमरेवार बिजली लोड का सीधा दृश्य। उपकरण पर क्लिक करके नियंत्रित करें।'
                : 'Spatial power distribution across 5 zones. Click any appliance node for instant telemetry control.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-950 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-lime-bright" />
            <span className="text-ivory-dark">&lt; 300W Eco</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-950 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-ivory-dark">300-1500W</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-950 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-rose-400">&gt; 1500W Surge</span>
          </div>
        </div>
      </div>

      {/* Virtual Floor Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ROOMS.map((room) => {
          const roomWatts = getRoomTotalWatts(room.id);
          const roomApps = getRoomAppliances(room.id);
          const auraClass = getAuraColor(roomWatts);
          const intensity = getIntensityBadge(roomWatts);

          return (
            <div
              key={room.id}
              className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${auraClass}`}
            >
              {/* Room Top Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{room.icon}</span>
                    <div>
                      <h4 className="text-sm font-bold text-ivory">
                        {lang === 'hi' ? room.nameHi : room.name}
                      </h4>
                      <p className="text-[10px] text-ivory-dark">
                        {lang === 'hi' ? room.descriptionHi : room.description}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${intensity.color}`}>
                    {intensity.label}
                  </span>
                </div>

                {/* Room Load Power */}
                <div className="my-3 p-3 rounded-2xl bg-charcoal-950/80 border border-white/5 flex items-baseline justify-between">
                  <span className="text-xs text-ivory-dark font-mono">
                    {lang === 'hi' ? 'कमरे का कुल लोड:' : 'Zone Load:'}
                  </span>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-lg font-black text-amber-300">{roomWatts}</span>
                    <span className="text-xs text-amber-400 font-bold">W</span>
                  </div>
                </div>

                {/* Appliances List inside this Room */}
                <div className="space-y-2.5 mt-4">
                  <span className="text-[10px] font-mono uppercase text-ivory-dark tracking-wider block">
                    {lang === 'hi' ? 'उपकरण (क्लिक करें)' : 'Appliances (Click to Inspect)'}:
                  </span>

                  {roomApps.map((app) => {
                    const AppIcon = getApplianceIcon(app.id);
                    const isSelected = selectedApplianceId === app.id;
                    const connTypeBadge =
                      app.connection_type === 'matter'
                        ? 'Matter'
                        : app.connection_type === 'google_home'
                        ? 'Google Home'
                        : app.connection_type === 'cloud'
                        ? 'Cloud'
                        : 'Demo Device';

                    return (
                      <div
                        key={app.id}
                        onClick={() => {
                          soundManager.playNavTick();
                          setSelectedApplianceId(isSelected ? null : app.id);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10'
                            : app.is_on
                            ? 'bg-charcoal-900/90 border-white/10 hover:border-amber-400/50'
                            : 'bg-charcoal-950/60 border-white/5 opacity-60 hover:opacity-90'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              app.is_on
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-charcoal-800 text-ivory-dark'
                            }`}
                          >
                            <AppIcon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-ivory truncate group-hover:text-amber-300 transition">
                                {lang === 'hi' ? app.name_hi : app.name}
                              </span>
                              <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-charcoal-800 text-amber-300/80 border border-white/5">
                                {connTypeBadge}
                              </span>
                            </div>

                            <div className="text-[10px] text-ivory-dark font-mono flex items-center gap-2 mt-0.5">
                              {app.id === 'ac' && <span>{app.temp_setpoint || 24}°C</span>}
                              {app.id === 'fan' && <span>Speed {app.device_speed || 4}/5</span>}
                              {app.id === 'lights' && <span>{app.brightness || 85}% brightness</span>}
                              <span>{app.efficiency_rating.split(' ')[0]}</span>
                            </div>
                          </div>
                        </div>

                        {/* Power & On/Off State */}
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-amber-300">
                            {app.is_on ? `${app.power_watts} W` : (app.vampire_active ? `${app.standby_watts || 5}W (Vampire)` : 'OFF')}
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                app.is_on ? 'bg-lime-bright' : 'bg-charcoal-700'
                              }`}
                            />
                            <span className="text-[9px] font-mono text-ivory-dark">
                              {app.is_on ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-out / Popover Appliance Interactive Controls */}
      {selectedAppliance && (
        <div className="p-5 sm:p-6 rounded-3xl bg-charcoal-900 border border-amber-500/40 shadow-2xl animate-fade-in relative">
          <div className="flex items-start justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                {React.createElement(getApplianceIcon(selectedAppliance.id), { className: 'w-6 h-6' })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                    {selectedAppliance.room} • {selectedAppliance.category}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-charcoal-800 text-lime-bright border border-lime-500/30">
                    {selectedAppliance.connection_type === 'demo' ? 'DEMO DEVICE' : 'CONNECTED DEVICE'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ivory">
                  {lang === 'hi' ? selectedAppliance.name_hi : selectedAppliance.name}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setSelectedApplianceId(null)}
              className="p-2 rounded-xl bg-charcoal-800 text-ivory hover:bg-charcoal-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Control 1: Power Switch & Status */}
            <div className="p-4 rounded-2xl bg-charcoal-950 border border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-ivory-dark block mb-1">
                  Power State & Relay
                </span>
                <span className="text-sm font-bold text-ivory">
                  {selectedAppliance.is_on ? 'Device is Online' : 'Device is Inactive / Standby'}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-mono text-amber-300">
                  {selectedAppliance.is_on ? `${selectedAppliance.power_watts} W Active` : '0 W'}
                </span>
                <button
                  onClick={() => toggleAppliance(selectedAppliance.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    selectedAppliance.is_on
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                      : 'bg-lime-500/20 text-lime-bright border border-lime-500/30 hover:bg-lime-500/30'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{selectedAppliance.is_on ? 'Turn OFF' : 'Turn ON'}</span>
                </button>
              </div>
            </div>

            {/* Control 2: Specific Dynamic Controls (AC Temp, Fan Speed, Light Brightness) */}
            <div className="p-4 rounded-2xl bg-charcoal-950 border border-white/5 space-y-3">
              {selectedAppliance.id === 'ac' ? (
                <>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-ivory-dark">Thermostat Setpoint</span>
                    <span className="text-lime-bright font-bold text-sm">
                      {selectedAppliance.temp_setpoint || 24}°C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="28"
                    step="1"
                    value={selectedAppliance.temp_setpoint || 24}
                    onChange={(e) => setApplianceTemp('ac', Number(e.target.value))}
                    className="w-full accent-lime-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-ivory-dark font-mono">
                    <span>18°C (High Load)</span>
                    <button
                      onClick={() => setApplianceTemp('ac', 24)}
                      className="text-amber-400 underline font-bold hover:text-amber-300"
                    >
                      Set Eco 24°C
                    </button>
                    <span>28°C (Max Eco)</span>
                  </div>
                </>
              ) : selectedAppliance.id === 'fan' ? (
                <>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-ivory-dark">Fan Speed Regulator</span>
                    <span className="text-amber-300 font-bold text-sm">
                      Level {selectedAppliance.device_speed || 4} of 5
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setApplianceSpeed('fan', speed)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                          (selectedAppliance.device_speed || 4) === speed
                            ? 'bg-amber-500 text-charcoal-950'
                            : 'bg-charcoal-850 text-ivory-dark hover:text-ivory'
                        }`}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                </>
              ) : selectedAppliance.id === 'lights' ? (
                <>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-ivory-dark">Smart Dimmer Brightness</span>
                    <span className="text-amber-300 font-bold text-sm">
                      {selectedAppliance.brightness || 85}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={selectedAppliance.brightness || 85}
                    onChange={(e) => setApplianceBrightness('lights', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-ivory-dark font-mono">
                    <span>10% Mood</span>
                    <span>100% Bright</span>
                  </div>
                </>
              ) : selectedAppliance.id === 'geyser' ? (
                <>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-ivory-dark">Target Water Heat</span>
                    <span className="text-rose-400 font-bold text-sm">
                      {selectedAppliance.water_temp || 55}°C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="75"
                    step="5"
                    value={selectedAppliance.water_temp || 55}
                    onChange={(e) => setApplianceTemp('geyser', Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-ivory-dark font-mono">
                    Auto thermal cutoff: 20 min idle timer active
                  </div>
                </>
              ) : (
                <div className="flex flex-col justify-center h-full text-xs text-ivory-dark space-y-1">
                  <span className="font-bold text-ivory">Standard Telemetry Plugs</span>
                  <p className="text-[11px] font-hindi">
                    {lang === 'hi'
                      ? 'ऊर्जा मीटर 1Hz पर वोल्टेज और करंट रीड कर रहा है।'
                      : 'Reporting electrical telemetry cluster over sub-second bridge pulse.'}
                  </p>
                </div>
              )}
            </div>

            {/* Control 3: Telemetry & Impact Stats */}
            <div className="p-4 rounded-2xl bg-charcoal-950 border border-white/5 space-y-2 text-xs font-mono">
              <span className="text-ivory-dark block text-[11px]">Today's Energy Impact</span>
              <div className="flex justify-between">
                <span className="text-ivory-dark">Daily Energy:</span>
                <span className="text-ivory font-bold">
                  {((selectedAppliance.is_on ? selectedAppliance.power_watts * selectedAppliance.daily_hours : 0) / 1000).toFixed(2)} kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory-dark">Daily Cost:</span>
                <span className="text-amber-300 font-bold">
                  ₹{Math.round(((selectedAppliance.is_on ? selectedAppliance.power_watts * selectedAppliance.daily_hours : 0) / 1000) * tariffRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory-dark">Efficiency:</span>
                <span className="text-lime-bright">{selectedAppliance.efficiency_rating}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
