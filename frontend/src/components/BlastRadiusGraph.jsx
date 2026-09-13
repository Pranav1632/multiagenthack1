import React from 'react';
import { Network, Server, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function BlastRadiusGraph({ project, errorType }) {
  return (
    <div className="bg-[#111726]/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            Service Blast Radius & Dependency Topology
          </h2>
          <p className="text-xs text-slate-400">
            Real-time topology mapping upstream callers and downstream dependencies.
          </p>
        </div>
      </div>

      {/* Visual Service Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center font-mono text-xs">
        {/* Node 1: Ingress */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">API GATEWAY</span>
            <span className="font-bold text-white">web-ingress</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Healthy
            </span>
          </div>
        </div>

        {/* Node 2: Crashing Service */}
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 glow-red flex items-center space-x-3 relative">
          <div className="p-2 rounded-lg bg-red-900/60 text-red-300 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-red-400 text-[10px] block font-bold">FAULT ORIGIN</span>
            <span className="font-bold text-red-200">{project || 'billing-service'}</span>
            <span className="text-[10px] text-red-400 font-bold block mt-0.5">
              {errorType || 'Error Spike'}
            </span>
          </div>
        </div>

        {/* Node 3: Upstream Dependency */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">PAYMENT GATEWAY</span>
            <span className="font-bold text-white">stripe-api</span>
            <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
              Degraded Callers
            </span>
          </div>
        </div>

        {/* Node 4: Storage */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">DATABASE</span>
            <span className="font-bold text-white">postgres-primary</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Healthy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
