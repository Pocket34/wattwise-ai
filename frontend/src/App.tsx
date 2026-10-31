// WattWise AI — App root: Router + Layout + Welcome gate
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore } from './store';

import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import EnergyPulse from './pages/EnergyPulse';
import Appliances from './pages/Appliances';
import LeakDetective from './pages/LeakDetective';
import WhatIfLab from './pages/WhatIfLab';
import SmartRules from './pages/SmartRules';
import BillForecast from './pages/BillForecast';
import CarbonImpact from './pages/CarbonImpact';
import EnergyGoals from './pages/EnergyGoals';
import Insights from './pages/Insights';
import Settings from './pages/Settings';

function AppContent() {
  const hasSeenWelcome = useStore((s) => s.hasSeenWelcome);
  const refreshAll = useStore((s) => s.refreshAll);
  const notification = useStore((s) => s.notification);

  useEffect(() => {
    if (hasSeenWelcome) {
      refreshAll();
    }
  }, [hasSeenWelcome]);

  return (
    <>
      {/* Global notification toast */}
      <AnimatePresence>
        {notification && (
          <div
            className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl border backdrop-blur-xl text-sm font-medium shadow-lg transition-all
              ${notification.type === 'success' ? 'bg-green-900/80 border-green-700/50 text-green-200' :
                notification.type === 'error' ? 'bg-red-900/80 border-red-700/50 text-red-200' :
                'bg-ww-card/90 border-ww-amber/30 text-ww-ivory'}`}
          >
            {notification.message}
          </div>
        )}
      </AnimatePresence>

      <Routes>
        {!hasSeenWelcome && (
          <Route path="*" element={<Welcome />} />
        )}
        {hasSeenWelcome && (
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/energy-pulse" element={<EnergyPulse />} />
            <Route path="/appliances" element={<Appliances />} />
            <Route path="/leaks" element={<LeakDetective />} />
            <Route path="/whatif" element={<WhatIfLab />} />
            <Route path="/rules" element={<SmartRules />} />
            <Route path="/bill" element={<BillForecast />} />
            <Route path="/carbon" element={<CarbonImpact />} />
            <Route path="/goals" element={<EnergyGoals />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
