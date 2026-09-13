import React from 'react';
import { 
  MessageSquare, 
  ExternalLink, 
  Pin, 
  Users, 
  Hash, 
  Check, 
  AlertOctagon,
  ChevronDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

export default function SlackPreview({ slack, onActionClick }) {
  if (!slack) return null;

  return (
    <Card className="border-zinc-800 bg-zinc-950/90 shadow-lg flex flex-col h-full">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Hash className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-xs font-mono font-bold text-white">
                  {slack.channel_name || '#incident-lab'}
                </CardTitle>
                {slack.is_live && (
                  <Badge variant="success" className="text-[10px] font-mono py-0 px-1.5">
                    LIVE SLACK
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-zinc-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Pin className="w-2.5 h-2.5 text-zinc-400" /> Pinned incident brief
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" /> 18 members
                </span>
              </div>
            </div>
          </div>

          {slack.web_url && (
            <a
              href={slack.web_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 hover:underline"
            >
              <span>Open in Slack</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        {/* Slack Message Box */}
        <div className="rounded-lg border border-zinc-800/80 bg-[#1a1d21] p-4 text-zinc-200 font-sans space-y-3">
          {/* Bot Profile Header */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs font-mono">
              IC
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white">Incident Commander</span>
                <span className="text-[9px] px-1 rounded bg-zinc-700 text-zinc-300 font-mono font-bold">
                  APP
                </span>
                <span className="text-xs text-zinc-500 font-mono">Just now</span>
              </div>
            </div>
          </div>

          {/* Block Kit Rendering */}
          <div className="space-y-3 pl-11 text-xs">
            {slack.blocks?.map((block, idx) => {
              if (block.type === 'header') {
                return (
                  <h4 key={idx} className="font-bold text-sm text-rose-400 leading-snug">
                    {block.text?.text}
                  </h4>
                );
              }
              if (block.type === 'section' && block.fields) {
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-2 gap-2 text-xs bg-zinc-900/90 p-3 rounded-md border border-zinc-800 font-mono"
                  >
                    {block.fields.map((f, fi) => (
                      <div
                        key={fi}
                        dangerouslySetInnerHTML={{
                          __html: f.text?.replace(/\*(.*?)\*/g, '<strong class="text-white">$1</strong>') || '',
                        }}
                      />
                    ))}
                  </div>
                );
              }
              if (block.type === 'section' && block.text) {
                return (
                  <div
                    key={idx}
                    className="text-xs text-zinc-300 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{
                      __html: block.text?.text
                        ?.replace(/\*(.*?)\*/g, '<strong class="text-white">$1</strong>')
                        ?.replace(/\n/g, '<br/>') || '',
                    }}
                  />
                );
              }
              if (block.type === 'actions') {
                return (
                  <div key={idx} className="flex flex-wrap gap-2 pt-2">
                    {block.elements?.map((el, ei) => (
                      <button
                        key={ei}
                        onClick={() => onActionClick?.(el.text?.text)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer font-sans ${
                          el.style === 'danger'
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : el.style === 'primary'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                        }`}
                      >
                        {el.text?.text}
                      </button>
                    ))}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
