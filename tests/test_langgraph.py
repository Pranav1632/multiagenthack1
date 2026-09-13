import asyncio
from incident_commander.graph import incident_graph
from incident_commander.eval.fixtures import get_eval_scenarios

def test_langgraph_billing_scenario_execution():
    """Verify that LangGraph compiles and executes the billing incident scenario."""
    scenarios = get_eval_scenarios()
    scenario = scenarios[0]  # billing-keyerror
    
    initial_state = {
        "alert_payload": scenario.alert.model_dump(),
        "repo": "acme-corp/billing-service",
        "alert": None,
        "commits": [c.model_dump() for c in scenario.commits],
        "candidates": [],
        "hypothesis": None,
        "slack_result": None,
        "linear_result": None,
        "hotfix_result": None,
        "status": "started",
        "error": None
    }
    
    final_state = asyncio.run(incident_graph.ainvoke(initial_state))
    
    assert final_state["status"] in ["resolved", "human_escalated"]
    assert final_state["alert"] is not None
    assert len(final_state["candidates"]) > 0
    assert final_state["hypothesis"] is not None
    assert final_state["slack_result"] is not None
    assert final_state["linear_result"] is not None

def test_langgraph_infra_outage_branch():
    """Verify that LangGraph correctly branches to escalate_human for external outage."""
    scenarios = get_eval_scenarios()
    scenario = scenarios[3]  # rds-outage
    
    initial_state = {
        "alert_payload": scenario.alert.model_dump(),
        "repo": "acme-corp/billing-service",
        "alert": None,
        "commits": [c.model_dump() for c in scenario.commits],
        "candidates": [],
        "hypothesis": None,
        "slack_result": None,
        "linear_result": None,
        "hotfix_result": None,
        "status": "started",
        "error": None
    }
    
    final_state = asyncio.run(incident_graph.ainvoke(initial_state))
    
    # Must branch to human escalation and suppress hotfix
    assert final_state["status"] == "human_escalated"
    assert final_state["hotfix_result"]["status"] == "suppressed"
