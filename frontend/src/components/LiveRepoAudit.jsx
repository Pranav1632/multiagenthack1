import React, { useState } from 'react';
import { 
  Radio, 
  GitBranch, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  ExternalLink,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export default function LiveRepoAudit({ onTriggerAudit, isRunning }) {
  const [repo, setRepo] = useState('Pranav1632/multiagenthack1');
  const [errorMessage, setErrorMessage] = useState("Rollup failed to resolve import 'clsx' from 'frontend/src/lib/utils.js'");
  const [errorFile, setErrorFile] = useState('frontend/src/lib/utils.js');
  const [customStack, setCustomStack] = useState(`error during build:
[vite]: Rollup failed to resolve import "clsx" from "/home/runner/work/multiagenthack1/multiagenthack1/frontend/src/lib/utils.js".
    at viteLog (frontend/node_modules/vite/dist/node/chunks/dep-Dm0c1Wj2.js:46504:15)
    at handle_stripe_webhook (frontend/src/lib/utils.js:1:1)`);
  const [webhookCurlCopied, setWebhookCurlCopied] = useState(false);

  const curlCommand = `curl -X POST http://localhost:8000/api/webhook/sentry \\
  -H "Content-Type: application/json" \\
  -d '{"project":"${repo.split('/')[1] || 'multiagenthack1'}","message":"${errorMessage}","culprit":"${errorFile}:1 in main"}'`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setWebhookCurlCopied(true);
    setTimeout(() => setWebhookCurlCopied(false), 2000);
  };

  const handleAuditSubmit = (e) => {
    e.preventDefault();
    if (isRunning) return;
    onTriggerAudit({
      repo,
      errorMessage,
      errorFile
    });
  };

  return (
    <div className="space-y-6">
      {/* Live Mode Announcement Banner */}
      <div className="p-4 rounded-lg border border-emerald-900/50 bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-md bg-emerald-900/40 border border-emerald-800 text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              100% Real Production Audit & Live GitHub / Sentry Ingestion
              <Badge variant="success" className="font-mono text-[10px] py-0.5">LIVE REST API</Badge>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Target any real GitHub repository. The engine fetches genuine live commits via GitHub REST API, cross-references with local Qwen 2.5, and creates real Slack channels & Linear tickets.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Audit Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-800 bg-zinc-950/90 shadow-lg">
            <CardHeader className="p-5 border-b border-zinc-800/80">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-200">
                  Target Live Repository & Crash Frame
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <form onSubmit={handleAuditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Target GitHub Repository (Owner / Repo):
                  </label>
                  <input
                    type="text"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-white transition"
                    placeholder="e.g. Pranav1632/multiagenthack1"
                    required
                  />
                  <span className="text-[11px] text-zinc-500 font-sans mt-1 block">
                    Authenticated with your live GitHub PAT. Evaluates recent commit history on this repo.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                      Production Error Message:
                    </label>
                    <input
                      type="text"
                      value={errorMessage}
                      onChange={(e) => setErrorMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-white transition"
                      placeholder="e.g. Rollup failed to resolve import 'clsx'"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                      Crash File Location:
                    </label>
                    <input
                      type="text"
                      value={errorFile}
                      onChange={(e) => setErrorFile(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-white transition"
                      placeholder="e.g. frontend/src/lib/utils.js"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Stack Trace & Build Crash Log:
                  </label>
                  <textarea
                    rows={4}
                    value={customStack}
                    onChange={(e) => setCustomStack(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-white transition"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Multi-App Target:</span>
                    <span className="text-zinc-200 font-semibold">Slack (#incident-app) + Linear (Team PRA)</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isRunning}
                    variant="vercel"
                    size="sm"
                    className="h-9 px-5 text-xs font-mono font-semibold"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Auditing Live Commits...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 mr-2" />
                        Trigger Live Investigation
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Inbound Webhook Listener */}
        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-950/90 shadow-lg">
            <CardHeader className="p-5 border-b border-zinc-800/80">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-sky-400" />
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-zinc-200">
                  Autonomous Webhook Listener
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Our backend runs a live HTTP listener at <code className="text-white bg-zinc-900 px-1 py-0.5 rounded">/api/webhook/sentry</code>. You can trigger it directly from your terminal or genuine Sentry webhook integrations:
              </p>

              <div className="p-3 rounded-lg bg-black border border-zinc-800 font-mono text-xs relative group">
                <pre className="overflow-x-auto text-[11px] text-zinc-300 leading-normal">
                  {curlCommand}
                </pre>
                <button
                  onClick={copyCurl}
                  className="mt-2 text-[11px] px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono border border-zinc-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {webhookCurlCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Terminal className="w-3 h-3" />}
                  <span>{webhookCurlCopied ? 'Copied to Clipboard!' : 'Copy cURL Command'}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                  <span>GitHub PAT Access:</span>
                  <span className="text-emerald-400 font-semibold">Active (Repo Read/Write)</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                  <span>Slack Bot Token:</span>
                  <span className="text-emerald-400 font-semibold">Active (#incident-app)</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                  <span>Linear GraphQL:</span>
                  <span className="text-emerald-400 font-semibold">Active (Team PRA)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
