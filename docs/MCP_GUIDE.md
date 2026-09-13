# 🔌 Model Context Protocol (MCP) Integration Guide

The Model Context Protocol (MCP) is an open standard that allows AI applications and developer IDEs to discover and invoke tools. Incident Commander provides a native MCP server for external agent integration.

---

## 1. Exposed MCP Tools

Implemented in [`incident_commander/mcp/server.py`](file:///d:/project/multiagent/incident_commander/mcp/server.py):

### 1. `investigate_incident`
- **Purpose**: Autonomous incident investigation correlating a Sentry error against git commits using local Qwen 2.5.
- **Parameters**: `scenario_id` (string), `repo` (string).
- **Output**: Full `IncidentResult` object including calibrated confidence, hypothesis, Slack channel, and Linear ticket.

### 2. `run_langgraph_incident`
- **Purpose**: Executes the incident investigation through the LangGraph cyclic state machine.
- **Parameters**: `scenario_id` (string).
- **Output**: Final graph state dictionary with conditional branch history.

### 3. `create_hotfix_pr`
- **Purpose**: Opens a surgical hotfix Pull Request on GitHub.
- **Parameters**: `repo` (string), `culprit_sha` (string), `title` (string).
- **Output**: Structured `GitHubPROutput` with direct PR link and branch name.

---

## 2. Connecting to Antigravity, Claude Code, or Cursor

Add the Incident Commander MCP server to your `mcp_config.json`:

```json
{
  "mcpServers": {
    "incident-commander": {
      "command": "python",
      "args": ["-m", "incident_commander.mcp.server"],
      "env": {
        "PYTHONPATH": "."
      }
    }
  }
}
```
External coding assistants can now directly ask Incident Commander to investigate production crashes and generate surgical fixes!
