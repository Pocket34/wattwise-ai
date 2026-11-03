import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { EnergyProvider, useEnergy } from './context/EnergyContext';
import { NavSection } from './types';
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
import { ErrorBoundary } from './components/ErrorBoundary';

import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

// Route path mappings
const SECTION_TO_PATH: Record<NavSection, string> = {
  home: '/',
  pulse: '/pulse',
  appliances: '/appliances',
  bridge: '/bridge',
  leaks: '/leaks',
  'what-if': '/what-if',
  rules: '/rules',
  forecast: '/forecast',
  carbon: '/carbon',
  goals: '/goals',
  insights: '/insights',
  settings: '/settings'
};

const PATH_TO_SECTION: Record<string, NavSection> = {
  '/': 'home',
  '/home': 'home',
  '/pulse': 'pulse',
  '/appliances': 'appliances',
  '/bridge': 'bridge',
  '/leaks': 'leaks',
  '/what-if': 'what-if',
  '/rules': 'rules',
  '/forecast': 'forecast',
  '/carbon': 'carbon',
  '/goals': 'goals',
  '/insights': 'insights',
  '/settings': 'settings'
};

const DashboardContent: React.FC = () => {
  const { navSection, setNavSection, notification, clearNotification, error } = useEnergy();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Keep route pathname and navSection synchronized
  useEffect(() => {
    const matchedSection = PATH_TO_SECTION[location.pathname];
    if (matchedSection && matchedSection !== navSection) {
      setNavSection(matchedSection);
    }
  }, [location.pathname]);

  useEffect(() => {
    const targetPath = SECTION_TO_PATH[navSection];
    if (targetPath && location.pathname !== targetPath && !(targetPath === '/' && location.pathname === '/home')) {
      navigate(targetPath);
    }
  }, [navSection]);

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

          {/* Declarative React Router Routes for all 12 views with ErrorBoundary protection */}
          <ErrorBoundary sectionName="WattWise Intelligence View">
            <Routes>
              <Route path="/" element={<ErrorBoundary sectionName="Home Dashboard"><HomeView /></ErrorBoundary>} />
              <Route path="/home" element={<ErrorBoundary sectionName="Home Dashboard"><HomeView /></ErrorBoundary>} />
              <Route path="/pulse" element={<ErrorBoundary sectionName="Energy Pulse"><EnergyPulseView /></ErrorBoundary>} />
              <Route path="/appliances" element={<ErrorBoundary sectionName="Appliances Fleet"><AppliancesView /></ErrorBoundary>} />
              <Route path="/bridge" element={<ErrorBoundary sectionName="Smart Home Bridge"><SmartHomeBridgeView /></ErrorBoundary>} />
              <Route path="/leaks" element={<ErrorBoundary sectionName="Leak Detective"><LeakDetectiveView /></ErrorBoundary>} />
              <Route path="/what-if" element={<ErrorBoundary sectionName="What-If Simulation Lab"><WhatIfLabView /></ErrorBoundary>} />
              <Route path="/rules" element={<ErrorBoundary sectionName="Smart Rules Automation"><SmartRulesView /></ErrorBoundary>} />
              <Route path="/forecast" element={<ErrorBoundary sectionName="Bill Forecast"><BillForecastView /></ErrorBoundary>} />
              <Route path="/carbon" element={<ErrorBoundary sectionName="Carbon Impact"><CarbonImpactView /></ErrorBoundary>} />
              <Route path="/goals" element={<ErrorBoundary sectionName="Energy Goals"><EnergyGoalsView /></ErrorBoundary>} />
              <Route path="/insights" element={<ErrorBoundary sectionName="Energy Insights"><InsightsView /></ErrorBoundary>} />
              <Route path="/settings" element={<ErrorBoundary sectionName="System Settings"><SettingsView /></ErrorBoundary>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
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
    <ErrorBoundary sectionName="WattWise Application Shell">
      <BrowserRouter>
        <EnergyProvider>
          <DashboardContent />
        </EnergyProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
