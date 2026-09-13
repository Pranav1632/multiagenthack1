import React, { useState } from 'react';
import { 
  Target, 
  GitCommit, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Code, 
  ArrowRight,
  Flame,
  Copy,
  Check,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import CodeDiffViewer from './CodeDiffViewer';

export default function CorrelationView({ result, onHotfixPR }) {
  const [copiedSha, setCopiedSha] = useState(null);

  if (!result) return null;

  const { top_hypothesis, candidate_commits } = result;
  const confPct = Math.round(top_hypothesis.confidence * 100);

  const getConfBadge = (pct, isInfra) => {
    if (isInfra) {
      return {
        text: 'LOW (INFRA OUTAGE - DO NOT REVERT)',
        variant: 'secondary',
        className: 'border-purple-800 bg-purple-950/40 text-purple-300'
      };
    }
    if (pct >= 70) {
      return {
        text: `HIGH CONFIDENCE (${pct}%)`,
        variant: 'success',
        className: 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
      };
    }
    if (pct >= 40) {
      return {
        text: `MEDIUM CONFIDENCE (${pct}%)`,
        variant: 'warning',
        className: 'border-amber-800 bg-amber-950/40 text-amber-300'
      };
    }
    return {
      text: `LOW CONFIDENCE (${pct}%)`,
      variant: 'destructive',
      className: 'border-rose-800 bg-rose-950/40 text-rose-300'
    };
  };

  const badge = getConfBadge(confPct, top_hypothesis.is_external_outage);

  const copyToClipboard = (sha) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  // Find culprit commit object if available to pass its diff into CodeDiffViewer
  const culpritCommit = candidate_commits?.find((c) => c.sha === top_hypothesis.culprit_sha);

  return (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-zinc-950/90 shadow-lg">
        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-300">
                  4. Root Cause Correlation & Reasoning
                </CardTitle>
                <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                  Composite attribution across AST call stack frames, temporal decay, and Qwen 2.5 synthesis.
                </p>
              </div>
            </div>

            <Badge variant={badge.variant} className={`font-mono text-xs font-bold py-1 px-3 ${badge.className}`}>
              {badge.text}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-2 space-y-6">
          {/* Primary Hypothesis Card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                Primary Root Cause Hypothesis
              </h4>
            </div>

            <p className="text-sm text-zinc-100 font-medium leading-relaxed">
              {top_hypothesis.hypothesis}
            </p>

            {/* Falsifiable Evidence */}
            {top_hypothesis.evidence?.length > 0 && (
              <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                <span className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider block">
                  Empirical Evidence & Call Stack Matches:
                </span>
                <ul className="space-y-1.5">
                  {top_hypothesis.evidence.map((ev, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start space-x-2">
                      <span className="text-zinc-500 font-bold">•</span>
                      <span className="leading-normal">{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Action */}
            {top_hypothesis.recommended_action && (
              <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <span className="text-zinc-400">Recommended Action:</span>
                <span className="px-2.5 py-1 rounded bg-zinc-800 text-white font-bold border border-zinc-700">
                  {top_hypothesis.recommended_action}
                </span>
              </div>
            )}
          </div>

          {/* Unified Git Diff Viewer (if culprit has diff patch) */}
          {culpritCommit?.diff_patch && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
                <Code className="w-4 h-4 text-zinc-400" />
                Culprit Commit Diff Patch
              </h4>
              <CodeDiffViewer
                diffPatch={culpritCommit.diff_patch}
                culpritSha={culpritCommit.sha}
                author={culpritCommit.author}
                message={culpritCommit.message}
                onRevertPR={onHotfixPR}
              />
            </div>
          )}

          {/* Candidate Commits Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-zinc-400" />
                Candidate Commits Scanned by SRE Engine
              </h4>
              <span className="text-[11px] font-mono text-zinc-500">
                Sorted by Composite Score
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-black">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3.5">Commit SHA</th>
                    <th className="py-2.5 px-3.5">Author</th>
                    <th className="py-2.5 px-3.5">Commit Message</th>
                    <th className="py-2.5 px-3 text-center">Time</th>
                    <th className="py-2.5 px-3 text-center">Path</th>
                    <th className="py-2.5 px-3 text-center">Line</th>
                    <th className="py-2.5 px-3.5 text-right">Composite Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-xs">
                  {candidate_commits.map((c) => {
                    const isCulprit = c.sha === top_hypothesis.culprit_sha;
                    return (
                      <tr
                        key={c.sha}
                        className={`transition-colors ${
                          isCulprit
                            ? 'bg-rose-950/20 text-white font-medium'
                            : 'hover:bg-zinc-900/40 text-zinc-300'
                        }`}
                      >
                        <td className="py-2.5 px-3.5 font-bold">
                          <button
                            onClick={() => copyToClipboard(c.sha)}
                            className="flex items-center space-x-1.5 hover:underline text-left cursor-pointer group"
                            title="Click to copy SHA"
                          >
                            {isCulprit && <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />}
                            <span className={isCulprit ? 'text-rose-400 underline' : 'text-zinc-200'}>
                              {c.sha}
                            </span>
                            {copiedSha === c.sha ? (
                              <Check className="w-3 h-3 text-emerald-400 ml-1" />
                            ) : (
                              <Copy className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-3.5 text-zinc-400">{c.author}</td>
                        <td className="py-2.5 px-3.5 truncate max-w-xs">{c.message}</td>
                        <td className="py-2.5 px-3 text-center text-zinc-400">{c.time_score}</td>
                        <td className="py-2.5 px-3 text-center text-zinc-400">{c.path_score}</td>
                        <td className="py-2.5 px-3 text-center text-zinc-400">{c.line_score}</td>
                        <td className="py-2.5 px-3.5 text-right font-bold text-white">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              isCulprit
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'text-zinc-400'
                            }`}
                          >
                            {c.total_score}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suggested Surgical Patch */}
          {top_hypothesis.surgical_patch && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  AI-Synthesized Hotfix Patch
                </h4>
                <button
                  onClick={() => {
                    const idePrompt = `You are fixing a critical production bug in ${result.project}.
Error: ${result.error_type}: ${result.error_message}
Culprit Location: ${result.top_hypothesis.hypothesis}
Culprit Commit SHA: ${result.top_hypothesis.culprit_sha}

Suggested Patch:
${result.top_hypothesis.surgical_patch}

Please apply this surgical patch to the file, write a unit test to prevent regression, and run pytest!`;
                    navigator.clipboard.writeText(idePrompt);
                    setCopiedSha('IDE_PROMPT');
                    setTimeout(() => setCopiedSha(null), 3000);
                  }}
                  className="px-3 py-1 rounded bg-purple-950/60 border border-purple-800/80 text-purple-300 hover:bg-purple-900/60 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{copiedSha === 'IDE_PROMPT' ? '✓ Copied IDE Prompt!' : 'Dispatch to Antigravity / Claude Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-black border border-zinc-800 font-mono text-xs overflow-x-auto text-zinc-300 leading-relaxed">
                {top_hypothesis.surgical_patch}
              </pre>
            </div>
          )}

          {/* LLM Neural Reasoning Inspector */}
          {top_hypothesis.llm_prompt && (
            <div className="mt-4 pt-4 border-t border-zinc-800/80">
              <details className="group">
                <summary className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center justify-between cursor-pointer hover:text-zinc-200">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    Inspect Local Qwen 2.5 LLM Prompt & Raw JSON Response
                  </span>
                  <span className="text-[11px] text-sky-400 font-normal group-open:rotate-180 transition-transform">▼</span>
                </summary>
                
                <div className="mt-3 space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-sky-300">Model: {top_hypothesis.llm_model || 'qwen2.5:3b'}</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-300">Inference Latency: {top_hypothesis.llm_latency_ms || '40'}ms</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-purple-300">Format: JSON</span>
                  </div>

                  <div>
                    <span className="text-zinc-500 block mb-1">PROMPT SENT TO LOCAL OLLAMA:</span>
                    <pre className="p-3 rounded bg-zinc-950 border border-zinc-850 text-zinc-400 text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {top_hypothesis.llm_prompt}
                    </pre>
                  </div>

                  <div>
                    <span className="text-zinc-500 block mb-1">RAW STRUCTURED JSON RESPONSE:</span>
                    <pre className="p-3 rounded bg-zinc-950 border border-zinc-850 text-emerald-400 text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {top_hypothesis.llm_response}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
