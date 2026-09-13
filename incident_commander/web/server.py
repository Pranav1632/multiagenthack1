import json
import asyncio
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from ..config import settings
from ..orchestrator import orchestrator
from ..db import get_incidents, get_incident_by_id, get_latest_eval_run
from ..eval.fixtures import get_eval_scenarios
from ..eval.runner import eval_runner

app = FastAPI(
    title="Incident Commander Agent API",
    description="Autonomous production error investigation, root cause correlation, and incident orchestration",
    version="1.0.0"
)

# Enable CORS for React/Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """Health check endpoint for container orchestrators and CI/CD probes."""
    return {
        "status": "healthy",
        "service": "incident-commander",
        "version": "1.0.0",
        "live_mode": settings.LIVE_API_MODE,
        "database": Path(settings.DATABASE_PATH).exists()
    }

@app.get("/api/status")
async def get_system_status():
    status = settings.get_status()
    # Check Ollama connectivity
    import httpx
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            r = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            ollama_ok = (r.status_code == 200)
    except Exception:
        ollama_ok = False
    status["ollama"]["available"] = ollama_ok
    return status

@app.get("/api/presets")
async def get_presets():
    scenarios = get_eval_scenarios()
    presets = []
    for s in scenarios:
        presets.append({
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "category": s.category,
            "alert": s.alert.model_dump(),
            "commits_count": len(s.commits),
            "commits": [c.model_dump() for c in s.commits]
        })
    return presets

@app.post("/api/trigger")
async def trigger_incident(payload: Dict[str, Any]):
    """Trigger incident investigation from raw alert payload or preset."""
    alert_raw = payload.get("alert") or payload
    commits_raw = payload.get("commits")
    repo = payload.get("repo", "acme-corp/billing-service")

    from ..types import GitCommit
    commits = [GitCommit(**c) for c in commits_raw] if commits_raw else None

    result = await orchestrator.run_pipeline(
        alert_payload=alert_raw,
        commits=commits,
        repo=repo
    )
    return result.model_dump()

@app.get("/api/trigger/stream")
async def trigger_incident_stream(request: Request, scenario_id: Optional[str] = "scenario-1-payment-keyerror"):
    """Server-Sent Events (SSE) streaming real-time execution steps."""
    scenarios = {s.id: s for s in get_eval_scenarios()}
    scenario = scenarios.get(scenario_id, scenarios.get("scenario-1-payment-keyerror"))

    async def event_generator():
        event_queue = asyncio.Queue()

        async def step_callback(step: str, message: str):
            await event_queue.put({"type": "step", "step": step, "message": message})

        async def worker():
            try:
                res = await orchestrator.run_pipeline(
                    alert_payload=scenario.alert,
                    commits=scenario.commits,
                    repo=f"acme-corp/{scenario.alert.project}",
                    on_step_callback=step_callback
                )
                await event_queue.put({"type": "result", "data": res.model_dump()})
            except Exception as e:
                await event_queue.put({"type": "error", "message": str(e)})
            finally:
                await event_queue.put(None)  # Sentinel

        task = asyncio.create_task(worker())

        while True:
            if await request.is_disconnected():
                task.cancel()
                break
            item = await event_queue.get()
            if item is None:
                break
            yield {"event": "message", "data": json.dumps(item)}

    return EventSourceResponse(event_generator())

@app.get("/api/incidents")
async def list_incidents(limit: int = 20):
    return get_incidents(limit)

@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str):
    inc = get_incident_by_id(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@app.get("/api/eval/run")
async def run_evaluation():
    scorecard = await eval_runner.run_benchmark()
    return scorecard.model_dump()

@app.get("/api/eval/latest")
async def latest_eval_report():
    report = get_latest_eval_run()
    if not report:
        scorecard = await eval_runner.run_benchmark()
        return scorecard.model_dump()
    return json.loads(report["summary_json"])

# Serve frontend static production build if available
from pathlib import Path
dist_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("incident_commander.web.server:app", host="127.0.0.1", port=8000, reload=True)
