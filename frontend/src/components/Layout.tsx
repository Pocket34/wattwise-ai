// WattWise AI — Layout: Sidebar navigation + content area + mobile bottom nav
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Activity, Cpu, Search, FlaskConical, Workflow,
  Receipt, Leaf, Target, Lightbulb, Settings as SettingsIcon,
  Zap, Menu, X, Play
} from 'lucide-react';
import { useStore } from '../store';
import { playSound } from '../sound';

const NAV_ITEMS = [
  { path: '/',              label: 'Home',           icon: Home },
  { path: '/energy-pulse',  label: 'Energy Pulse',   icon: Activity },
  { path: '/appliances',    label: 'Appliances',     icon: Cpu },
  { path: '/leaks',         label: 'Leak Detective', icon: Search },
  { path: '/whatif',        label: 'What-If Lab',    icon: FlaskConical },
  { path: '/rules',         label: 'Smart Rules',    icon: Workflow },
  { path: '/bill',          label: 'Bill Forecast',  icon: Receipt },
  { path: '/carbon',        label: 'Carbon Impact',  icon: Leaf },
  { path: '/goals',         label: 'Energy Goals',   icon: Target },
  { path: '/insights',      label: 'Insights',       icon: Lightbulb },
  { path: '/settings',      label: 'Settings',       icon: SettingsIcon },
];

export default function Layout() {
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const isDemoRunning = useStore((s) => s.isDemoRunning);
  const runDemo = useStore((s) => s.runDemo);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = () => {
    playSound('tick');
    setSidebarOpen(false);
  };

  const handleDemo = () => {
    if (isDemoRunning) return;
    playSound('activate');
    runDemo(navigate);
  };

  return (
    <div className="flex min-h-screen bg-ww-bg">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] fixed inset-y-0 left-0 bg-ww-surface/90 backdrop-blur-xl border-r border-ww-border/50 z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ww-amber to-ww-orange flex items-center justify-center">
            <Zap className="w-5 h-5 text-ww-bg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ww-ivory tracking-tight">WattWise</h1>
            <p className="text-[10px] font-medium text-ww-amber uppercase tracking-[0.2em]">AI Energy</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                ${isActive
                  ? 'text-ww-amber bg-ww-amber/8'
                  : 'text-ww-ivory-dim hover:text-ww-ivory hover:bg-ww-card/50'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-ww-amber" />
                  )}
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-ww-amber' : ''}`} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Demo button */}
        <div className="p-4">
          <button
            onClick={handleDemo}
            disabled={isDemoRunning}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              bg-gradient-to-r from-ww-amber/20 to-ww-orange/20 border border-ww-amber/30
              text-ww-amber font-medium text-sm
              hover:from-ww-amber/30 hover:to-ww-orange/30 hover:border-ww-amber/50
              transition-all duration-300 glow-amber
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            {isDemoRunning ? 'Demo Running...' : 'Start Smart Home Demo'}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-ww-surface/95 backdrop-blur-xl border-b border-ww-border/50 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-ww-amber to-ww-orange flex items-center justify-center">
            <Zap className="w-4 h-4 text-ww-bg" />
          </div>
          <span className="font-bold text-ww-ivory">WattWise AI</span>
        </div>
        <button
          onClick={() => { playSound('click'); setSidebarOpen(!sidebarOpen); }}
          className="p-2 rounded-lg text-ww-ivory-dim hover:text-ww-ivory"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[260px] bg-ww-surface/95 backdrop-blur-xl border-r border-ww-border/50 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ww-amber to-ww-orange flex items-center justify-center">
                    <Zap className="w-4 h-4 text-ww-bg" />
                  </div>
                  <span className="font-bold text-ww-ivory">WattWise AI</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1 text-ww-ivory-dim">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
                {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === '/'}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${isActive ? 'text-ww-amber bg-ww-amber/8' : 'text-ww-ivory-dim hover:text-ww-ivory hover:bg-ww-card/50'}`
                    }
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
              <div className="p-4">
                <button
                  onClick={handleDemo}
                  disabled={isDemoRunning}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                    bg-gradient-to-r from-ww-amber/20 to-ww-orange/20 border border-ww-amber/30
                    text-ww-amber font-medium text-sm transition-all glow-amber
                    disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  {isDemoRunning ? 'Demo Running...' : 'Start Demo'}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:ml-[260px] min-h-screen pt-14 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
