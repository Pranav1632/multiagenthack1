import React from 'react';
import { CheckCircle2, Clock, Activity, GitCommit, Brain, MessageSquare, Ticket, GitPullRequest } from 'lucide-react';

export default function ExecutionTimeline({ steps, activeStep, isRunning }) {
  const STAGES = [
    { id: 'ingest', label: '1. Sentry Ingest', icon: Activity },
    { id: 'gather', label: '2. GitHub Commits', icon: GitCommit },
    { id: 'correlate', label: '3. Correlation & Qwen', icon: Brain },
    { id: 'linear', label: '4. Linear Ticket', icon: Ticket },
    { id: 'slack', label: '5. Slack Channel', icon: MessageSquare },
    { id: 'github_pr', label: '6. Hotfix PR', icon: GitPullRequest },
  ];

  const getStepStatus = (stageId) => {
    const stageIndex = STAGES.findIndex((s) => s.id === stageId);
    const activeIndex = STAGES.findIndex((s) => s.id === activeStep);

    if (activeStep === 'complete') return 'done';
    if (!activeStep) return 'pending';
    if (stageId === activeStep) return 'active';
    if (stageIndex < activeIndex) return 'done';
    return 'pending';
  };

  return (
    <div className="bg-[#111726]/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          Live Agent Reasoning Trace
        </h2>
        {isRunning && (
          <span className="text-xs font-mono text-sky-400 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            Executing Pipeline...
          </span>
        )}
      </div>

      {/* Visual Pipeline Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {STAGES.map((s) => {
          const status = getStepStatus(s.id);
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                status === 'done'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : status === 'active'
                  ? 'bg-sky-500/15 border-sky-500/80 text-sky-200 glow-blue animate-pulse'
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
              }`}
            >
              <div className="mb-1.5">
                {status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Icon className={`w-5 h-5 ${status === 'active' ? 'text-sky-400 animate-spin' : ''}`} />
                )}
              </div>
              <span className="text-[11px] font-mono font-bold leading-tight">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live Log Stream */}
      <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 font-mono text-xs max-h-36 overflow-y-auto space-y-1.5 text-slate-300">
        {steps.length === 0 ? (
          <p className="text-slate-600 italic">Waiting for incident trigger...</p>
        ) : (
          steps.map((st, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-sky-400 font-bold">[{st.step.toUpperCase()}]</span>
              <span className="text-slate-300">{st.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
