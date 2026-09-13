from typing import TypedDict, List, Optional, Dict, Any
from langgraph.graph import StateGraph, START, END
from ..types import SentryAlert, GitCommit, RootCauseHypothesis, CandidateScore
from ..connectors import sentry_parser, github_connector, slack_connector, linear_connector
from ..engine.correlation_service import correlation_service


class IncidentGraphState(TypedDict):
    alert_payload: Dict[str, Any]
    repo: str
    alert: Optional[Dict[str, Any]]
    commits: List[Dict[str, Any]]
    candidates: List[Dict[str, Any]]
    hypothesis: Optional[Dict[str, Any]]
    slack_result: Optional[Dict[str, Any]]
    linear_result: Optional[Dict[str, Any]]
    hotfix_result: Optional[Dict[str, Any]]
    status: str
    error: Optional[str]


async def node_ingest(state: IncidentGraphState) -> Dict[str, Any]:
    """Node 1: Parses raw Sentry/alert payload and normalizes stack trace frames."""
    try:
        raw = state["alert_payload"]
        alert = sentry_parser.parse(raw)
        return {
            "alert": alert.model_dump(),
            "status": "alert_ingested"
        }
    except Exception as e:
        return {"error": f"Ingest failure: {str(e)}", "status": "failed"}


async def node_gather(state: IncidentGraphState) -> Dict[str, Any]:
    """Node 2: Fetches recent git commits within lookback window."""
    try:
        repo = state.get("repo", "acme-corp/billing-service")
        raw_commits = state.get("commits", [])
        if not raw_commits:
            commits = await github_connector.get_recent_commits(repo, limit=10)
            return {
                "commits": [c.model_dump() for c in commits],
                "status": "commits_gathered"
            }
        return {"status": "commits_gathered"}
    except Exception as e:
        return {"error": f"Gather failure: {str(e)}", "status": "failed"}


async def node_reason(state: IncidentGraphState) -> Dict[str, Any]:
    """Node 3: Executes hybrid neuro-symbolic scoring and Ollama Qwen 2.5 reasoner."""
    try:
        alert = SentryAlert(**state["alert"])
        commits = [GitCommit(**c) for c in state["commits"]]
        
        candidates, hypothesis = await correlation_service.correlate(alert, commits)
        
        return {
            "candidates": [c.model_dump() for c in candidates],
            "hypothesis": hypothesis.model_dump(),
            "status": "hypothesis_generated"
        }
    except Exception as e:
        return {"error": f"Reasoning failure: {str(e)}", "status": "failed"}


def route_by_confidence(state: IncidentGraphState) -> str:
    """Conditional Edge: Evaluates calibrated confidence and outage classification."""
    hyp = state.get("hypothesis")
    if not hyp:
        return "escalate_human"
    
    # If external infra outage or confidence is below 0.65, divert to human escalation
    if hyp.get("is_external_outage") or hyp.get("confidence", 0) < 0.65:
        return "escalate_human"
    
    return "dispatch_war_room"


async def node_escalate_human(state: IncidentGraphState) -> Dict[str, Any]:
    """Node 4A: Suppresses automatic rollback, alerts humans of infrastructure failure."""
    alert = SentryAlert(**state["alert"])
    hyp = RootCauseHypothesis(**state["hypothesis"])
    
    channel_slug = slack_connector.generate_channel_name(alert.project, alert.alert_id)
    linear_res = await linear_connector.create_incident_ticket(
        alert=alert,
        hypothesis=hyp,
        slack_channel=f"#{channel_slug}"
    )
    slack_res = await slack_connector.create_incident_channel_and_notify(
        service=alert.project,
        alert=alert,
        hypothesis=hyp,
        linear_ticket=linear_res
    )
    
    return {
        "slack_result": slack_res.model_dump(),
        "linear_result": linear_res.model_dump(),
        "hotfix_result": {"status": "suppressed", "reason": "Low confidence or external cloud outage detected"},
        "status": "human_escalated"
    }


async def node_dispatch_war_room(state: IncidentGraphState) -> Dict[str, Any]:
    """Node 4B: Creates dedicated Slack war-room and Linear P0 ticket."""
    alert = SentryAlert(**state["alert"])
    hyp = RootCauseHypothesis(**state["hypothesis"])
    
    channel_slug = slack_connector.generate_channel_name(alert.project, alert.alert_id)
    linear_res = await linear_connector.create_incident_ticket(
        alert=alert,
        hypothesis=hyp,
        slack_channel=f"#{channel_slug}"
    )
    slack_res = await slack_connector.create_incident_channel_and_notify(
        service=alert.project,
        alert=alert,
        hypothesis=hyp,
        linear_ticket=linear_res
    )
    
    return {
        "slack_result": slack_res.model_dump(),
        "linear_result": linear_res.model_dump(),
        "status": "war_room_dispatched"
    }


async def node_generate_hotfix(state: IncidentGraphState) -> Dict[str, Any]:
    """Node 5: Prepares Phase 2 surgical hotfix pull request."""
    hyp = state.get("hypothesis", {})
    culprit_sha = hyp.get("culprit_sha")
    action = hyp.get("recommended_action") or f"git revert {culprit_sha} -m 1"
    
    hotfix_data = {
        "status": "ready_for_review",
        "branch": f"hotfix/{culprit_sha[:7] if culprit_sha else 'incident'}",
        "action": action,
        "patch": hyp.get("surgical_patch")
    }
    return {
        "hotfix_result": hotfix_data,
        "status": "resolved"
    }


def build_incident_graph():
    """Constructs and compiles the Incident Commander LangGraph State Machine."""
    builder = StateGraph(IncidentGraphState)

    builder.add_node("ingest", node_ingest)
    builder.add_node("gather", node_gather)
    builder.add_node("reason", node_reason)
    builder.add_node("escalate_human", node_escalate_human)
    builder.add_node("dispatch_war_room", node_dispatch_war_room)
    builder.add_node("generate_hotfix", node_generate_hotfix)

    # Edges
    builder.add_edge(START, "ingest")
    builder.add_edge("ingest", "gather")
    builder.add_edge("gather", "reason")

    # Conditional Branching
    builder.add_conditional_edges(
        "reason",
        route_by_confidence,
        {
            "escalate_human": "escalate_human",
            "dispatch_war_room": "dispatch_war_room"
        }
    )

    builder.add_edge("escalate_human", END)
    builder.add_edge("dispatch_war_room", "generate_hotfix")
    builder.add_edge("generate_hotfix", END)

    return builder.compile()


incident_graph = build_incident_graph()
