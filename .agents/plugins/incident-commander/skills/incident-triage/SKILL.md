---
name: incident-triage
description: >-
  Autonomous incident investigation runbook. Correlates production stack traces
  with candidate git commits, executes 40ms neuro-symbolic AST pruning, queries
  local Qwen 2.5 LLM, and orchestrates multi-app dispatch across Slack, Linear, and GitHub.
---

# Incident Commander Triage Skill

Use this skill when investigating production errors, exceptions, or unhandled crashes.

## Available Actions
1. **Investigate Sentry Crash**: Correlate crash frames with git commits using incident_commander.mcp.server.
2. **LangGraph State Machine**: Run the incident investigation state machine with automated guardrails.
3. **Phase 2 Hotfix Remediation**: Auto-generate a surgical hotfix Pull Request for human approval.
