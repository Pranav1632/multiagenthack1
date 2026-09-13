import React from 'react';
import { MessageSquare, ExternalLink, Pin, ShieldAlert, Check } from 'lucide-react';

export default function SlackPreview({ slack, onRevert, onHotfix }) {
  if (!slack) return null;

  return (
    <div className="bg-[#111726]/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col h-full">
      {/* Slack Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white font-mono">
                {slack.channel_name}
              </h2>
              {slack.is_live && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE SLACK
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Pin className="w-3 h-3 text-amber-400" /> Pinned incident briefing
            </span>
          </div>
        </div>

        {slack.web_url && (
          <a
            href={slack.web_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Open</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Simulated Slack Message Container */}
      <div className="flex-1 bg-[#1a1d21] border border-slate-700/60 rounded-xl p-4 font-sans text-slate-200 space-y-3">
        {/* Bot Profile */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center font-bold text-white shadow">
            IC
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white">Incident Commander</span>
              <span className="text-[10px] px-1 rounded bg-slate-700 text-slate-300 font-mono">APP</span>
              <span className="text-xs text-slate-400">Just now</span>
            </div>
          </div>
        </div>

        {/* Message Content Rendered from Blocks */}
        <div className="space-y-2.5 pl-11">
          {slack.blocks.map((block, idx) => {
            if (block.type === 'header') {
              return (
                <h3 key={idx} className="font-bold text-base text-red-400">
                  {block.text.text}
                </h3>
              );
            }
            if (block.type === 'section' && block.fields) {
              return (
                <div key={idx} className="grid grid-cols-2 gap-2 text-xs bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40 font-mono">
                  {block.fields.map((f, fi) => (
                    <div key={fi} dangerouslySetInnerHTML={{ __html: f.text.replace(/\*(.*?)\*/g, '<strong>$1</strong>') }} />
                  ))}
                </div>
              );
            }
            if (block.type === 'section' && block.text) {
              return (
                <div
                  key={idx}
                  className="text-xs text-slate-200 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: block.text.text.replace(/\*(.*?)\*/g, '<strong class="text-white">$1</strong>').replace(/\n/g, '<br/>') }}
                />
              );
            }
            if (block.type === 'actions') {
              return (
                <div key={idx} className="flex flex-wrap gap-2 pt-2">
                  {block.elements.map((el, ei) => (
                    <button
                      key={ei}
                      onClick={() => alert(`Action executed: ${el.text.text}`)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        el.style === 'danger'
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : el.style === 'primary'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      <span>{el.text.text}</span>
                    </button>
                  ))}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
