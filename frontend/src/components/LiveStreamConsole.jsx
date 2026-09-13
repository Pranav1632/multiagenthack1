import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Trash2, 
  ArrowDown, 
  Pause, 
  Play, 
  Filter,
  Code2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export default function LiveStreamConsole({ steps, isRunning, onCopyLogs }) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filterStage, setFilterStage] = useState('ALL');
  const scrollRef = useRef(null);

  // Auto-scroll when new steps arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps, autoScroll]);

  const handleCopy = () => {
    const text = steps.map((s) => `[${s.step?.toUpperCase() || 'INFO'}] ${s.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopyLogs?.();
  };

  const filteredSteps = filterStage === 'ALL'
    ? steps
    : steps.filter((s) => s.step?.toLowerCase() === filterStage.toLowerCase());

  const getStepColor = (step) => {
    switch (step?.toLowerCase()) {
      case 'ingest':
        return 'text-rose-400 bg-rose-950/40 border-rose-900/50';
      case 'gather':
        return 'text-sky-400 bg-sky-950/40 border-sky-900/50';
      case 'correlate':
        return 'text-amber-400 bg-amber-950/40 border-amber-900/50';
      case 'linear':
        return 'text-purple-400 bg-purple-950/40 border-purple-900/50';
      case 'slack':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50';
      case 'github_pr':
        return 'text-indigo-400 bg-indigo-950/40 border-indigo-900/50';
      default:
        return 'text-zinc-400 bg-zinc-900 border-zinc-800';
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-950/90 shadow-lg">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                Live SSE Telemetry Stream
                {isRunning && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[10px] lowercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    live stream active
                  </span>
                )}
              </CardTitle>
            </div>
          </div>

          {/* Console Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Filter pills */}
            <div className="flex items-center space-x-1 rounded-md bg-zinc-900 p-0.5 border border-zinc-800 text-[11px]">
              {['ALL', 'INGEST', 'CORRELATE', 'DISPATCH'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStage(f)}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    filterStage === f
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center space-x-1 px-2 py-1 rounded border text-[11px] transition cursor-pointer ${
                autoScroll
                  ? 'border-zinc-700 bg-zinc-900 text-white'
                  : 'border-zinc-850 bg-zinc-950 text-zinc-500'
              }`}
              title="Toggle Auto-Scroll"
            >
              <ArrowDown className={`w-3 h-3 ${autoScroll ? 'text-emerald-400' : 'text-zinc-600'}`} />
              <span className="hidden sm:inline">Auto-Scroll</span>
            </button>

            {/* Copy Logs */}
            <Button
              onClick={handleCopy}
              disabled={steps.length === 0}
              variant="outline"
              size="sm"
              className="h-7 text-[11px] font-mono border-zinc-800 text-zinc-300 hover:bg-zinc-900"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-zinc-400 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={scrollRef}
          className="h-64 sm:h-72 overflow-y-auto bg-black p-4 font-mono text-xs leading-relaxed space-y-1.5 selection:bg-zinc-800"
        >
          {steps.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2 select-none">
              <Terminal className="w-8 h-8 opacity-40 stroke-1" />
              <p className="text-xs">Awaiting incident trigger to stream SSE events...</p>
              <span className="text-[10px] text-zinc-700 font-mono">
                Connects to /api/trigger/stream via Server-Sent Events
              </span>
            </div>
          ) : (
            filteredSteps.map((st, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-2.5 py-0.5 px-2 rounded hover:bg-zinc-900/50 transition-colors animate-fade-in"
              >
                <span className="text-zinc-600 select-none text-[11px] shrink-0">
                  {new Date().toLocaleTimeString()}.{String(idx * 140 % 1000).padStart(3, '0')}
                </span>

                <span
                  className={`px-1.5 py-0.2 rounded border text-[10px] font-semibold shrink-0 select-none uppercase ${getStepColor(
                    st.step
                  )}`}
                >
                  {st.step}
                </span>

                <span className="text-zinc-300 break-all leading-normal flex-1">
                  {st.message}
                </span>
              </div>
            ))
          )}

          {isRunning && (
            <div className="flex items-center space-x-2 py-1 px-2 text-zinc-500">
              <span className="w-1.5 h-3.5 bg-zinc-300 animate-pulse" />
              <span className="text-[11px] italic">Agent stream actively processing...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
