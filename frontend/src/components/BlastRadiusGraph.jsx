import React from 'react';
import { 
  Network, 
  Server, 
  Database, 
  Globe, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  Layers,
  ArrowDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

export default function BlastRadiusGraph({ project, errorType }) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/90 shadow-lg">
      <CardHeader className="p-5 sm:p-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-zinc-400" />
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-300">
              3. Service Blast Radius & Dependency Topology
            </CardTitle>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="font-mono text-[11px] text-zinc-400 border-zinc-800">
              Topology: 4 Nodes Monitored
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 pt-2">
        {/* Topology Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-stretch font-mono text-xs">
          {/* Node 1: Edge Ingress */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded bg-zinc-800 text-zinc-300">
                <Globe className="w-4 h-4" />
              </div>
              <Badge variant="success" className="text-[10px] font-mono gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Normal
              </Badge>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">
                Tier 0: Edge Ingress
              </span>
              <h5 className="font-bold text-white text-sm mt-0.5">web-ingress</h5>
              <p className="text-[11px] text-zinc-400 font-sans mt-1">
                Cloudflare edge load balancer. Routing traffic normally.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
              <span>Latency: 14ms</span>
              <span>P99: 22ms</span>
            </div>
          </div>

          {/* Node 2: Failing Fault Origin (Highlighted) */}
          <div className="rounded-lg border border-rose-900/80 bg-rose-950/20 p-4 flex flex-col justify-between space-y-3 ring-1 ring-rose-800/40">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <Badge variant="destructive" className="text-[10px] font-mono font-bold gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                FAULT ORIGIN
              </Badge>
            </div>
            <div>
              <span className="text-[10px] text-rose-400 block uppercase tracking-wider font-bold">
                Tier 1: Crashing Target
              </span>
              <h5 className="font-bold text-white text-sm mt-0.5">
                {project || 'billing-service'}
              </h5>
              <p className="text-[11px] text-rose-200/80 font-sans mt-1">
                {errorType || 'KeyError in handle_stripe_webhook'}
              </p>
            </div>
            <div className="pt-2 border-t border-rose-900/50 flex items-center justify-between text-[10px] text-rose-400 font-bold">
              <span>Error Rate: 100%</span>
              <span>HTTP 500</span>
            </div>
          </div>

          {/* Node 3: Upstream Callers */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded bg-zinc-800 text-zinc-300">
                <Server className="w-4 h-4" />
              </div>
              <Badge variant="warning" className="text-[10px] font-mono gap-1">
                Degraded Callers
              </Badge>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">
                Tier 2: Upstream Gateway
              </span>
              <h5 className="font-bold text-white text-sm mt-0.5">stripe-webhook</h5>
              <p className="text-[11px] text-zinc-400 font-sans mt-1">
                Stripe event delivery webhook queue. Retrying dropped events.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
              <span>Retries: 42/min</span>
              <span>Backoff: Exp</span>
            </div>
          </div>

          {/* Node 4: Persistence Layer */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded bg-zinc-800 text-zinc-300">
                <Database className="w-4 h-4" />
              </div>
              <Badge variant="success" className="text-[10px] font-mono gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Healthy
              </Badge>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">
                Tier 3: Persistence
              </span>
              <h5 className="font-bold text-white text-sm mt-0.5">postgres-primary</h5>
              <p className="text-[11px] text-zinc-400 font-sans mt-1">
                PostgreSQL transactional cluster. No deadlocks or connection saturation.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
              <span>Pool: 18/50 Conns</span>
              <span>CPU: 8%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
