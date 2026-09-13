import React from 'react';
import { ShieldAlert, Cpu, CheckCircle2, Award, Terminal, RefreshCw } from 'lucide-react';

export default function Header({ status, onOpenEval, isEvaluating }) {
  return (
    <header className="border-b border-slate-800 bg-[#0d121f]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl glow-red">
            <ShieldAlert className="w-7 h-7 text-red-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                INCIDENT COMMANDER
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  AI SRE AGENT
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Autonomous Root-Cause Correlation & Multi-App Response
            </p>
          </div>
        </div>

        {/* Status Indicators & Action */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          {/* AI Engine Status */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/60 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">LLM:</span>
            <span className="text-emerald-400 font-semibold">Qwen 2.5 (3B Local)</span>
          </div>

          {/* Linear Status */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/60 text-slate-300">
            <span className="text-slate-400">Linear:</span>
            <span className="text-purple-400 font-semibold">Team PRA</span>
          </div>

          {/* Slack Status */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/60 text-slate-300">
            <span className="text-slate-400">Slack:</span>
            <span className="text-emerald-400 font-semibold">#incident-lab</span>
          </div>

          {/* Benchmark Button */}
          <button
            onClick={onOpenEval}
            disabled={isEvaluating}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-semibold transition shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            {isEvaluating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Award className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Eval Benchmark (25%)</span>
          </button>
        </div>
      </div>
    </header>
  );
}
