import React, { useState } from 'react';
import { EnergyProvider, useEnergy } from './context/EnergyContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { WelcomeModal } from './components/WelcomeModal';
import { DemoGuideModal } from './components/DemoGuideModal';
import { SmartHomeBridgeModal } from './components/SmartHomeBridgeModal';

import { HomeView } from './views/HomeView';
import { EnergyPulseView } from './views/EnergyPulseView';
import { AppliancesView } from './views/AppliancesView';
import { SmartHomeBridgeView } from './views/SmartHomeBridgeView';
import { LeakDetectiveView } from './views/LeakDetectiveView';
import { WhatIfLabView } from './views/WhatIfLabView';
import { SmartRulesView } from './views/SmartRulesView';
import { BillForecastView } from './views/BillForecastView';
import { CarbonImpactView } from './views/CarbonImpactView';
import { EnergyGoalsView } from './views/EnergyGoalsView';
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';

import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { navSection, notification, clearNotification, loading, error } = useEnergy();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const renderActiveView = () => {
    switch (navSection) {
      case 'home':
        return <HomeView />;
      case 'pulse':
        return <EnergyPulseView />;
      case 'appliances':
        return <AppliancesView />;
      case 'bridge':
        return <SmartHomeBridgeView />;
      case 'leaks':
        return <LeakDetectiveView />;
      case 'what-if':
        return <WhatIfLabView />;
      case 'rules':
        return <SmartRulesView />;
      case 'forecast':
        return <BillForecastView />;
      case 'carbon':
        return <CarbonImpactView />;
      case 'goals':
        return <EnergyGoalsView />;
      case 'insights':
        return <InsightsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-ivory flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation */}
      <Navbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Body with Sidebar + Active View */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <span>{error}</span>
            </div>
          )}

          {renderActiveView()}
        </main>
      </div>

      {/* Welcome & Demo Modals */}
      <WelcomeModal />
      <DemoGuideModal />
      <SmartHomeBridgeModal />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm p-4 rounded-2xl glass-card border border-amber-500/40 shadow-2xl animate-fade-in flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-lime-bright" />}
            {notification.type === 'alert' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {notification.type === 'info' && <Info className="w-5 h-5 text-amber-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold text-ivory">{notification.title}</h5>
            <p className="text-[11px] text-ivory-dark mt-0.5 font-hindi leading-snug">
              {notification.message}
            </p>
          </div>
          <button
            onClick={clearNotification}
            className="text-ivory-dark hover:text-ivory p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <EnergyProvider>
      <DashboardContent />
    </EnergyProvider>
  );
}
