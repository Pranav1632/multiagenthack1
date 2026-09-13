import React from 'react';
import { 
  Ticket, 
  ExternalLink, 
  Tag, 
  CheckSquare, 
  AlertCircle,
  Clock,
  User
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

export default function LinearPreview({ linear }) {
  if (!linear) return null;

  return (
    <Card className="border-zinc-800 bg-zinc-950/90 shadow-lg flex flex-col h-full">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Ticket className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-xs font-mono font-bold text-white">
                  {linear.ticket_key || 'PRA-104'}
                </CardTitle>
                <Badge variant="destructive" className="text-[10px] font-mono py-0 px-1.5">
                  P0 Urgent
                </Badge>
                {linear.is_live && (
                  <Badge variant="success" className="text-[10px] font-mono py-0 px-1.5">
                    LIVE LINEAR
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-zinc-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <User className="w-2.5 h-2.5" /> Team PRA (Pranav Gaikwad)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> SLA: 45 mins
                </span>
              </div>
            </div>
          </div>

          {linear.url && (
            <a
              href={linear.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 hover:underline"
            >
              <span>Open in Linear</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        {/* Ticket Details Container */}
        <div className="rounded-lg border border-zinc-800/80 bg-[#16171d] p-4 text-zinc-200 font-sans space-y-4">
          <h4 className="font-semibold text-sm text-white leading-snug">
            {linear.title}
          </h4>

          {/* Labels & Tags */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
              <Tag className="w-2.5 h-2.5 text-zinc-400" /> incident
            </span>
            <span className="px-2 py-0.5 rounded bg-sky-950/40 text-sky-300 border border-sky-800">
              ai-triaged
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800">
              in_progress
            </span>
          </div>

          {/* Ticket Markdown Body */}
          <div className="text-xs text-zinc-300 space-y-3 font-mono border-t border-zinc-800/80 pt-3 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
            {linear.body_markdown}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
