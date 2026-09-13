import React, { useState } from 'react';
import { 
  GitCommit, 
  Copy, 
  Check, 
  GitPullRequest, 
  FileCode, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export default function CodeDiffViewer({ diffPatch, culpritSha, author, message, onRevertPR }) {
  const [copied, setCopied] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!diffPatch) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(diffPatch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevert = () => {
    setIsReverting(true);
    setTimeout(() => {
      setIsReverting(false);
      onRevertPR?.();
    }, 1200);
  };

  // Parse diff lines into structured objects
  const lines = diffPatch.split('\n');

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 overflow-hidden shadow-lg">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-900/80 border-b border-zinc-800 text-xs font-mono">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-zinc-400 hover:text-white transition cursor-pointer"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className="flex items-center space-x-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-zinc-400" />
              Unified Git Diff
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
              {culpritSha}
            </span>
          </div>

          <span className="text-zinc-500 hidden md:inline truncate max-w-md">
            "{message}" — {author}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="h-7 text-[11px] font-mono border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-zinc-400 mr-1" />
                Copy Diff
              </>
            )}
          </Button>

          <Button
            onClick={handleRevert}
            disabled={isReverting}
            size="sm"
            variant="destructive"
            className="h-7 text-[11px] font-mono font-semibold"
          >
            <GitPullRequest className={`w-3 h-3 mr-1.5 ${isReverting ? 'animate-spin' : ''}`} />
            <span>{isReverting ? 'Creating PR...' : 'Hotfix Revert PR'}</span>
          </Button>
        </div>
      </div>

      {/* Diff Content Body */}
      {isExpanded && (
        <div className="overflow-x-auto bg-black font-mono text-xs p-4 leading-relaxed max-h-80 select-text">
          {lines.map((line, idx) => {
            const isAdd = line.startsWith('+') && !line.startsWith('+++');
            const isDel = line.startsWith('-') && !line.startsWith('---');
            const isMeta = line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++');

            return (
              <div
                key={idx}
                className={`flex items-start px-2 py-0.5 rounded-sm font-mono ${
                  isAdd
                    ? 'diff-added font-medium'
                    : isDel
                    ? 'diff-removed font-medium'
                    : isMeta
                    ? 'text-zinc-500 bg-zinc-900/30'
                    : 'text-zinc-400'
                }`}
              >
                <span className="w-8 select-none text-zinc-600 text-right pr-3 shrink-0 text-[11px]">
                  {idx + 1}
                </span>
                <span className="w-4 select-none font-bold shrink-0 text-center">
                  {isAdd ? '+' : isDel ? '-' : ' '}
                </span>
                <span className="whitespace-pre flex-1 break-all">
                  {isAdd || isDel ? line.substring(1) : line}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
