import React from 'react';
import { Target, GitCommit, CheckCircle, AlertTriangle, ShieldCheck, Code, ArrowRight } from 'lucide-react';

export default function CorrelationView({ result }) {
  if (!result) return null;

  const { top_hypothesis, candidate_commits } = result;
  const confPct = Math.round(top_hypothesis.confidence * 100);

  const getConfBadge = (pct, isInfra) => {
    if (isInfra) {
      return {
        text: 'LOW (INFRA OUTAGE)',
        color: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
      };
    }
    if (pct >= 70) {
      return {
        text: `HIGH CONFIDENCE (${pct}%)`,
        color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
      };
    }
    if (pct >= 40) {
      return {
        text: `MEDIUM (${pct}%)`,
        color: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      };
    }
    return {
      text: `LOW (${pct}%)`,
      color: 'bg-red-500/10 text-red-300 border-red-500/30'
    };
  };

  const badge = getConfBadge(confPct, top_hypothesis.is_external_outage);

  return (
    <div className="bg-[#111726]/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
      {/* Header & Confidence Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30">
            <Target className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
              Root Cause Correlation & Reasoning
            </h2>
            <p className="text-xs text-slate-400">
              Correlated across time decay, AST call stack overlap, and local Qwen 2.5 reasoning.
            </p>
          </div>
        </div>

        <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold ${badge.color}`}>
          {badge.text}
        </div>
      </div>

      {/* Hypothesis Statement */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Primary Hypothesis
        </h3>
        <p className="text-sm text-slate-100 leading-relaxed font-medium">
          {top_hypothesis.hypothesis}
        </p>

        {top_hypothesis.evidence?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Falsifiable Evidence:
            </span>
            <ul className="space-y-1">
              {top_hypothesis.evidence.map((ev, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                  <span className="text-sky-400 font-bold">•</span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {top_hypothesis.recommended_action && (
          <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Recommended Action:</span>
            <span className="text-amber-400 font-bold">{top_hypothesis.recommended_action}</span>
          </div>
        )}
      </div>

      {/* Ranked Candidate Commits Table */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2.5 flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-purple-400" />
          Candidate Commits Ranked by Correlation Score
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">SHA</th>
                <th className="py-2.5 px-3">Author</th>
                <th className="py-2.5 px-3">Message</th>
                <th className="py-2.5 px-3 text-center">Time</th>
                <th className="py-2.5 px-3 text-center">Path</th>
                <th className="py-2.5 px-3 text-center">Line</th>
                <th className="py-2.5 px-3 text-right">Composite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {candidate_commits.map((c, i) => {
                const isCulprit = c.sha === top_hypothesis.culprit_sha;
                return (
                  <tr
                    key={c.sha}
                    className={`transition-colors ${
                      isCulprit
                        ? 'bg-red-500/10 hover:bg-red-500/15 text-red-200'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold flex items-center space-x-1.5">
                      {isCulprit && <span className="text-red-400">🔥</span>}
                      <span className={isCulprit ? 'text-red-400 underline' : 'text-sky-400'}>
                        {c.sha}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{c.author}</td>
                    <td className="py-2.5 px-3 truncate max-w-xs">{c.message}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{c.time_score}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{c.path_score}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{c.line_score}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">
                      {c.total_score}
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
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2 flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-400" />
            Auto-Generated Surgical Fix Patch
          </h3>
          <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs overflow-x-auto text-slate-300">
            {top_hypothesis.surgical_patch}
          </pre>
        </div>
      )}
    </div>
  );
}
