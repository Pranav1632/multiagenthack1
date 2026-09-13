import React from 'react';
import { Ticket, ExternalLink, AlertCircle, Tag, CheckSquare } from 'lucide-react';

export default function LinearPreview({ linear }) {
  if (!linear) return null;

  return (
    <div className="bg-[#111726]/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col h-full">
      {/* Linear Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-sm text-purple-300">
                {linear.ticket_key}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-mono font-bold">
                P0 Urgent
              </span>
              {linear.is_live && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE LINEAR
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">Team PRA (Pranav Gaikwad)</span>
          </div>
        </div>

        {linear.url && (
          <a
            href={linear.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-purple-400 hover:underline flex items-center gap-1"
          >
            <span>Open in Linear</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Ticket Details */}
      <div className="flex-1 bg-[#181920] border border-slate-700/60 rounded-xl p-4 font-sans text-slate-200 space-y-4 overflow-y-auto max-h-[420px]">
        {/* Title */}
        <h3 className="font-bold text-sm text-white leading-snug">
          {linear.title}
        </h3>

        {/* Labels & State */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Tag className="w-3 h-3" /> incident
          </span>
          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
            ai-triaged
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            in_progress
          </span>
        </div>

        {/* Ticket Markdown Body */}
        <div className="text-xs text-slate-300 space-y-3 font-mono border-t border-slate-800 pt-3 leading-relaxed whitespace-pre-wrap">
          {linear.body_markdown}
        </div>
      </div>
    </div>
  );
}
