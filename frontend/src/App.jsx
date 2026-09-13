import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import IncidentTrigger from './components/IncidentTrigger';
import ExecutionTimeline from './components/ExecutionTimeline';
import CorrelationView from './components/CorrelationView';
import SlackPreview from './components/SlackPreview';
import LinearPreview from './components/LinearPreview';
import BlastRadiusGraph from './components/BlastRadiusGraph';
import EvalModal from './components/EvalModal';

export default function App() {
  const [status, setStatus] = useState(null);
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(null);
  const [result, setResult] = useState(null);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [scorecard, setScorecard] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Load initial status & presets
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});

    fetch('/api/presets')
      .then((r) => r.json())
      .then((data) => {
        setPresets(data);
        if (data.length > 0) setSelectedPreset(data[0]);
      })
      .catch(() => {});

    fetch('/api/eval/latest')
      .then((r) => r.json())
      .then(setScorecard)
      .catch(() => {});
  }, []);

  // Trigger Live Pipeline with SSE Streaming
  const handleTrigger = () => {
    if (!selectedPreset || isRunning) return;

    setIsRunning(true);
    setSteps([]);
    setActiveStep('ingest');
    setResult(null);

    const eventSource = new EventSource(`/api/trigger/stream?scenario_id=${selectedPreset.id}`);

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'step') {
          setActiveStep(payload.step);
          setSteps((prev) => [...prev, payload]);
        } else if (payload.type === 'result') {
          setResult(payload.data);
          setActiveStep('complete');
          setIsRunning(false);
          eventSource.close();
        } else if (payload.type === 'error') {
          setIsRunning(false);
          eventSource.close();
        }
      } catch (err) {
        setIsRunning(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setIsRunning(false);
      eventSource.close();
    };
  };

  // Run Evaluation Suite
  const handleRunEval = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/eval/run');
      const data = await res.json();
      setScorecard(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#0a0d14] ${isRunning ? 'defcon-red' : ''}`}>
      {/* Navigation Header */}
      <Header
        status={status}
        onOpenEval={() => setEvalModalOpen(true)}
        isEvaluating={isEvaluating}
      />

      {/* Main Mission Control Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Section 1: Trigger Control Panel */}
        <IncidentTrigger
          presets={presets}
          selectedPreset={selectedPreset}
          onSelectPreset={setSelectedPreset}
          onTrigger={handleTrigger}
          isRunning={isRunning}
        />

        {/* Section 2: Real-time Execution Pipeline Trace */}
        <ExecutionTimeline
          steps={steps}
          activeStep={activeStep}
          isRunning={isRunning}
        />

        {/* Section 3: Blast Radius & Service Topology */}
        {result && (
          <BlastRadiusGraph
            project={result.project}
            errorType={result.error_type}
          />
        )}

        {/* Section 4: Deep Correlation & Reasoning View */}
        {result && (
          <CorrelationView result={result} />
        )}

        {/* Section 5: Side-by-Side Multi-App Outputs (Slack & Linear) */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SlackPreview slack={result.slack} />
            <LinearPreview linear={result.linear} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0d121f] py-4 px-6 text-center text-xs font-mono text-slate-500">
        Incident Commander Agent • Powered by Qwen 2.5 (Local) & Multi-App Orchestrator (Slack, Linear, GitHub)
      </footer>

      {/* Benchmark Scorecard Modal */}
      <EvalModal
        isOpen={evalModalOpen}
        onClose={() => setEvalModalOpen(false)}
        scorecard={scorecard}
        onReRun={handleRunEval}
        isEvaluating={isEvaluating}
      />
    </div>
  );
}
