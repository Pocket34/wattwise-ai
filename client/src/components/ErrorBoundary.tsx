import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(`[WattWise ErrorBoundary] Caught error in ${this.props.sectionName || 'Component'}:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (e) {
        console.error('Error during ErrorBoundary reset:', e);
      }
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const sectionTitle = this.props.sectionName || 'Dashboard Section';

      return (
        <div className="p-6 rounded-3xl glass-card border border-amber-500/30 bg-charcoal-900/90 text-ivory shadow-xl my-4 space-y-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Resilience Shield Active
                </span>
                <span className="text-[10px] font-mono text-ivory-dark bg-charcoal-800 px-2 py-0.5 rounded-full border border-white/5">
                  Isolated Rendering Event
                </span>
              </div>
              <h3 className="text-base font-bold text-ivory">
                {sectionTitle} is temporarily refreshing
              </h3>
              <p className="text-xs text-amber-200/80 leading-relaxed font-hindi">
                An isolated data formatting event occurred in this panel. All other monitoring systems, live telemetry, and circuits continue operating normally.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 text-xs font-bold transition shadow-md active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Panel</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-ivory text-xs font-medium border border-white/10 transition"
            >
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span>Reload App</span>
            </button>
          </div>

          {/* Collapsible Error Info for Debugging */}
          {this.state.error && (
            <details className="mt-3 pt-2 border-t border-white/5 text-[11px] text-ivory-dark">
              <summary className="cursor-pointer hover:text-amber-300 font-mono text-[10px]">
                Diagnostics Details
              </summary>
              <div className="mt-2 p-3 rounded-xl bg-charcoal-950 border border-white/5 font-mono text-[10px] text-rose-300 overflow-x-auto whitespace-pre-wrap">
                {this.state.error.toString()}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
