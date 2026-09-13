import React from 'react';
import { Play, AlertOctagon, KeyRound, Database, CloudOff, ArrowRight } from 'lucide-react';

export default function IncidentTrigger({ presets, selectedPreset, onSelectPreset, onTrigger, isRunning }) {
  const getIcon = (category) => {
    switch (category) {
      case 'direct_bug':
        return <AlertOctagon className="w-5 h-5 text-red-400" />;
      case 'config_drift':
        return <KeyRound className="w-5 h-5 text-amber-400" />;
      case 'multi_commit_noise':
        return <Database className="w-5 h-5 text-sky-400" />;
      case 'infra_outage':
        return <CloudOff className="w-5 h-5 text-purple-400" />;
      default:
        return <AlertOctagon className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-[#111726]/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            1. Trigger Simulated Sentry Alert
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select a production crash scenario to launch the automated correlation and response loop.
          </p>
        </div>

        <button
          onClick={onTrigger}
          disabled={isRunning}
          className={`flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
            isRunning
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 glow-red border border-red-400/50 cursor-pointer active:scale-95'
          }`}
        >
          <Play className={`w-4 h-4 fill-current ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Investigating...' : 'TRIGGER INCIDENT'}</span>
        </button>
      </div>

      {/* Scenario Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {presets.map((p) => {
          const isSelected = selectedPreset?.id === p.id;
          return (
            <div
              key={p.id}
              onClick={() => !isRunning && onSelectPreset(p)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-sky-500/80 glow-blue ring-1 ring-sky-500/50'
                  : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
                  <div className="bg-sky-500 text-[9px] font-bold text-slate-900 py-0.5 text-center transform rotate-45 translate-x-3 translate-y-1 shadow">
                    READY
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2.5 mb-2">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60">
                    {getIcon(p.category)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white leading-tight">
                      {p.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      {p.alert.project}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {p.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">
                  {p.alert.error_type}
                </span>
                <span>{p.commits_count} candidate commits</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
