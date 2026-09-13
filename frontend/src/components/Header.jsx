import React from 'react';
import { 
  ShieldAlert, 
  Cpu, 
  Award, 
  Radio, 
  Terminal, 
  Search, 
  ChevronRight,
  GitBranch,
  Layers
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export default function Header({ 
  status, 
  onOpenEval, 
  isEvaluating, 
  onOpenCommandMenu,
  activeTab,
  onSelectTab,
  isRunning
}) {
  const isOllamaOnline = status?.ollama?.available ?? true;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-black/90 backdrop-blur-md">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand & Breadcrumbs */}
        <div className="flex items-center space-x-3">
          {/* Vercel Icon Mark */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 text-white shadow-sm">
            <svg
              className="w-4 h-4 fill-current text-white"
              viewBox="0 0 76 65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </div>

          {/* Breadcrumb path */}
          <div className="flex items-center text-xs font-medium space-x-1.5 text-zinc-400">
            <span className="text-zinc-200 font-semibold hover:text-white transition cursor-pointer">
              acme-corp
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-zinc-200 font-semibold flex items-center gap-1.5">
              incident-commander
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                PROD
              </span>
            </span>
          </div>

          <div className="hidden lg:flex items-center pl-2 space-x-2 border-l border-zinc-800">
            <Badge variant="outline" className="text-[11px] font-mono gap-1 text-zinc-400 border-zinc-800">
              <GitBranch className="w-3 h-3 text-zinc-500" />
              main
            </Badge>
          </div>
        </div>

        {/* Right: Telemetry Status & Actions */}
        <div className="flex items-center space-x-2.5 text-xs font-mono">
          {/* Live Streaming SSE Indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isRunning ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRunning ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-zinc-400 text-[11px]">SSE:</span>
            <span className="text-[11px] font-semibold text-zinc-200">
              {isRunning ? 'Streaming' : 'Connected'}
            </span>
          </div>

          {/* AI Engine Status */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 text-zinc-300">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400 text-[11px]">LLM:</span>
            <span className="text-[11px] font-semibold text-zinc-200">
              {status?.ollama?.model || 'Qwen 2.5 (3B)'}
            </span>
          </div>

          {/* Command Menu Trigger */}
          <button
            onClick={onOpenCommandMenu}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition cursor-pointer text-[11px]"
            title="Quick Command Menu"
          >
            <Search className="w-3 h-3 text-zinc-400" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono border border-zinc-700">
              ⌘K
            </kbd>
          </button>

          {/* Benchmark Suite Button */}
          <Button
            onClick={onOpenEval}
            disabled={isEvaluating}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-mono border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
          >
            <Award className={`w-3.5 h-3.5 mr-1.5 ${isEvaluating ? 'animate-spin' : 'text-zinc-400'}`} />
            <span>Benchmarks</span>
          </Button>
        </div>
      </div>

      {/* Sub-Navigation Bar / Tabs (Vercel Style) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center space-x-1 border-t border-zinc-900 text-xs font-medium overflow-x-auto">
        {[
          { id: 'overview', label: 'Mission Overview' },
          { id: 'live-audit', label: '🔴 Live Repo & Sentry Audit' },
          { id: 'timeline', label: 'Live Trace & Logs' },
          { id: 'correlation', label: 'Root Cause & Diff' },
          { id: 'topology', label: 'Service Blast Radius' },
          { id: 'dispatch', label: 'War Room & Linear' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`py-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
