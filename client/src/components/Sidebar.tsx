import React from 'react';
import { useEnergy } from '../context/EnergyContext';
import { NavSection } from '../types';
import {
  Home,
  Activity,
  Cpu,
  SearchAlert,
  FlaskConical,
  Workflow,
  Receipt,
  Leaf,
  Target,
  Sparkles,
  Settings,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: NavSection;
  labelEn: string;
  labelHi: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeType?: 'alert' | 'lime' | 'amber';
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { navSection, setNavSection, leaks, lang, rules, goals } = useEnergy();

  const activeLeaksCount = leaks.filter(l => l.status === 'active').length;
  const activeRulesCount = rules.filter(r => r.is_enabled === 1).length;
  const activeGoalsCount = goals.filter(g => g.status === 'active').length;

  const navItems: NavItem[] = [
    { id: 'home', labelEn: 'Home', labelHi: 'होम ओवरव्यू', icon: Home },
    { id: 'pulse', labelEn: 'Energy Pulse', labelHi: 'एनर्जी पल्स', icon: Activity },
    { id: 'appliances', labelEn: 'Appliances', labelHi: 'स्मार्ट उपकरण', icon: Cpu, badge: '10' },
    {
      id: 'bridge',
      labelEn: 'Smart Home Bridge',
      labelHi: 'स्मार्ट होम ब्रिज',
      icon: Radio,
      badge: 'Connect',
      badgeType: 'lime'
    },
    {
      id: 'leaks',
      labelEn: 'Leak Detective',
      labelHi: 'लीक डिटेक्टिव',
      icon: SearchAlert,
      badge: activeLeaksCount > 0 ? activeLeaksCount : undefined,
      badgeType: 'alert'
    },
    { id: 'what-if', labelEn: 'What-If Lab', labelHi: 'व्हाट-इफ लैब', icon: FlaskConical },
    {
      id: 'rules',
      labelEn: 'Smart Rules',
      labelHi: 'स्मार्ट रूल्स',
      icon: Workflow,
      badge: activeRulesCount,
      badgeType: 'lime'
    },
    { id: 'forecast', labelEn: 'Bill Forecast', labelHi: 'बिल पूर्वानुमान', icon: Receipt },
    { id: 'carbon', labelEn: 'Carbon Impact', labelHi: 'कार्बन प्रभाव', icon: Leaf },
    {
      id: 'goals',
      labelEn: 'Energy Goals',
      labelHi: 'ऊर्जा लक्ष्य',
      icon: Target,
      badge: activeGoalsCount,
      badgeType: 'amber'
    },
    { id: 'insights', labelEn: 'AI Insights', labelHi: 'एआई अंतर्दृष्टि', icon: Sparkles },
    { id: 'settings', labelEn: 'Settings', labelHi: 'सेटिंग्स', icon: Settings },
  ];

  const handleNavClick = (id: NavSection) => {
    setNavSection(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-charcoal-950/95 lg:bg-charcoal-950 border-r border-amber-500/15 flex flex-col justify-between p-3.5 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="space-y-1 overflow-y-auto pr-1">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-500/80 font-mono">
            {lang === 'hi' ? 'नेविगेशन' : 'Navigation'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = navSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition duration-150 group ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-copper-600/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                    : 'text-ivory-dark hover:bg-charcoal-850 hover:text-ivory border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-amber-400 scale-110' : 'text-ivory-dark group-hover:text-amber-300'
                    }`}
                  />
                  <span className="font-hindi tracking-wide font-medium">
                    {lang === 'hi' ? item.labelHi : item.labelEn}
                  </span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full font-mono ${
                      item.badgeType === 'alert'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : item.badgeType === 'lime'
                        ? 'bg-lime-500/20 text-lime-bright border border-lime-500/40'
                        : item.badgeType === 'amber'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-charcoal-800 text-ivory-dark border border-white/10'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-3 border-t border-white/5 px-2">
          <div className="p-2.5 rounded-xl bg-charcoal-900/90 border border-amber-500/15 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-lime-electric shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-ivory truncate">
                WattWise Engine
              </p>
              <p className="text-[10px] text-amber-200/60 font-mono truncate">
                Deterministic v1.0 • Offline Ready
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
