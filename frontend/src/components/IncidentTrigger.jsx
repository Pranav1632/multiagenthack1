import React from 'react';
import { 
  Play, 
  AlertCircle, 
  KeyRound, 
  Database, 
  CloudOff, 
  Check, 
  GitCommit, 
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export default function IncidentTrigger({
  presets,
  selectedPreset,
  onSelectPreset,
  onTrigger,
  isRunning,
}) {
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'direct_bug':
        return (
          <Badge variant="destructive" className="font-mono text-[10px] font-semibold">
            CODE REGRESSION
          </Badge>
        );
      case 'config_drift':
        return (
          <Badge variant="warning" className="font-mono text-[10px] font-semibold">
            CONFIG DRIFT
          </Badge>
        );
      case 'multi_commit_noise':
        return (
          <Badge variant="blue" className="font-mono text-[10px] font-semibold">
            NOISE PRUNING
          </Badge>
        );
      case 'infra_outage':
        return (
          <Badge variant="secondary" className="font-mono text-[10px] font-semibold border-purple-800 text-purple-300">
            INFRA OUTAGE
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-mono text-[10px]">
            INCIDENT
          </Badge>
        );
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-950/90 shadow-lg">
      <CardHeader className="p-5 sm:p-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500" />
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-300">
                1. Production Incident Ingestion
              </CardTitle>
            </div>
            <CardDescription className="mt-1">
              Select an empirical production crash scenario to trigger autonomous AST correlation, RCA, and multi-channel dispatch.
            </CardDescription>
          </div>

          <Button
            onClick={onTrigger}
            disabled={isRunning}
            size="lg"
            variant="vercel"
            className="h-10 px-6 text-xs font-mono font-bold tracking-wider flex items-center space-x-2 shrink-0 cursor-pointer shadow-sm hover:bg-zinc-100"
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin mr-1" />
                <span>INVESTIGATING PIPELINE...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>TRIGGER SRE PIPELINE</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 pt-2">
        {/* Scenario Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {presets.map((preset) => {
            const isSelected = selectedPreset?.id === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => !isRunning && onSelectPreset(preset)}
                className={`group rounded-lg border p-4 transition-all cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-white bg-zinc-900/90 ring-1 ring-white/20'
                    : 'border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/30'
                }`}
              >
                {/* Active Selection Checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-white text-black">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    {getCategoryBadge(preset.category)}
                  </div>

                  <h4 className="text-xs font-semibold text-white group-hover:text-zinc-100 line-clamp-1 pr-6">
                    {preset.name}
                  </h4>

                  <div className="mt-1 flex items-center space-x-1.5 text-[11px] font-mono text-zinc-400">
                    <span className="text-zinc-500 font-semibold">{preset.alert.project}</span>
                    <span>•</span>
                    <span className="text-rose-400 font-semibold">{preset.alert.error_type}</span>
                  </div>

                  <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <GitCommit className="w-3 h-3 text-zinc-500" />
                    {preset.commits_count} commits
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {preset.alert.alert_id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
