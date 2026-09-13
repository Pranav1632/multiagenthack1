import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Activity, 
  GitCommit, 
  Brain, 
  Ticket, 
  MessageSquare, 
  GitPullRequest,
  Clock,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

export default function ExecutionTimeline({ steps, activeStep, isRunning }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsed(((Date.now() - startTime) / 1000).toFixed(1));
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const STAGES = [
    { id: 'ingest', label: 'Sentry Ingest', desc: 'Alert payload parsing', icon: Activity },
    { id: 'gather', label: 'Git AST', desc: 'Commit diff extraction', icon: GitCommit },
    { id: 'correlate', label: 'Correlation', desc: 'Local Qwen 2.5 synthesis', icon: Brain },
    { id: 'linear', label: 'Linear Ticket', desc: 'P0 issue creation', icon: Ticket },
    { id: 'slack', label: 'Slack Dispatch', desc: 'War room notification', icon: MessageSquare },
    { id: 'github_pr', label: 'Hotfix PR', desc: 'Surgical patch synthesis', icon: GitPullRequest },
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
    <Card className="border-zinc-800 bg-zinc-950/90 shadow-lg">
      <CardHeader className="p-5 sm:p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-zinc-400" />
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-300">
              2. Real-Time Autonomous Execution Pipeline
            </CardTitle>
          </div>

          <div className="flex items-center space-x-3">
            {isRunning ? (
              <Badge variant="outline" className="font-mono text-[11px] gap-1.5 border-zinc-700 bg-zinc-900 text-zinc-200">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Running: {elapsed}s</span>
              </Badge>
            ) : activeStep === 'complete' ? (
              <Badge variant="success" className="font-mono text-[11px] gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pipeline Complete (4.2s)</span>
              </Badge>
            ) : (
              <span className="text-xs font-mono text-zinc-500">Ready</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 pt-2">
        {/* Pipeline Stepper Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((stage, idx) => {
            const status = getStepStatus(stage.id);
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                className={`rounded-lg border p-3.5 flex flex-col justify-between transition-all ${
                  status === 'done'
                    ? 'border-zinc-800 bg-zinc-900/90 text-zinc-200'
                    : status === 'active'
                    ? 'border-white bg-zinc-900 ring-1 ring-white/20 text-white'
                    : 'border-zinc-900 bg-zinc-950/40 text-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-zinc-500">
                    0{idx + 1}
                  </span>

                  {status === 'done' ? (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  ) : status === 'active' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-1.5">
                    <Icon className={`w-3.5 h-3.5 ${status === 'active' ? 'text-white' : status === 'done' ? 'text-zinc-300' : 'text-zinc-600'}`} />
                    <h5 className="text-xs font-semibold leading-tight line-clamp-1">
                      {stage.label}
                    </h5>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 mt-1 line-clamp-1">
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
