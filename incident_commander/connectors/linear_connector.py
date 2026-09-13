import httpx
import uuid
from typing import Optional
from ..types import SentryAlert, RootCauseHypothesis, LinearTicketOutput
from ..config import settings
from .base import BaseLinearConnector

class LinearConnector(BaseLinearConnector):
    endpoint = "https://api.linear.app/graphql"

    @property
    def api_key(self) -> str:
        return settings.LINEAR_API_KEY

    @property
    def team_key(self) -> str:
        return settings.LINEAR_TEAM_ID or "PRA"

    @property
    def live_mode(self) -> bool:
        return settings.LIVE_API_MODE and bool(self.api_key)

    def format_ticket_body(
        self,
        alert: SentryAlert,
        hypothesis: RootCauseHypothesis,
        slack_channel: Optional[str] = None
    ) -> str:
        conf_pct = int(hypothesis.confidence * 100)
        evidence_md = "\n".join([f"- {e}" for e in hypothesis.evidence]) if hypothesis.evidence else "- Manual triage required."
        
        # Format human-readable UTC timestamp
        occurred_at = alert.timestamp or datetime.now(timezone.utc).isoformat()
        
        body = f"""## 🚨 Production Incident Briefing

- **Service / Project**: `{alert.project}`
- **Error Type**: `{alert.error_type}`
- **Error Message**: `{alert.message}`
- **Crash Location**: `{alert.culprit or 'Unknown'}`
- **First Detected (UTC)**: `{occurred_at}`
- **Incident War-Room**: `{slack_channel or '#incident-commander'}`

---

### 🎯 Root Cause Hypothesis (AI Confidence: {conf_pct}%)
{hypothesis.hypothesis}

#### 📋 Falsifiable Evidence:
{evidence_md}

---

### 🛠️ Remediation Instructions
**Recommended Action**: `{hypothesis.recommended_action}`
"""
        if hypothesis.culprit_sha:
            body += f"""
```bash
# Rollback Culprit Commit
git revert {hypothesis.culprit_sha} -m 1
git push origin main
```
"""
        if hypothesis.surgical_patch:
            body += f"""
#### 🩹 Suggested Surgical Patch:
```diff
{hypothesis.surgical_patch}
```
"""
        return body

    async def create_incident_ticket(
        self,
        alert: SentryAlert,
        hypothesis: RootCauseHypothesis,
        slack_channel: Optional[str] = None
    ) -> LinearTicketOutput:
        title = f"[INCIDENT] {alert.error_type} in {alert.project}: {alert.message[:60]}"
        body = self.format_ticket_body(alert, hypothesis, slack_channel)

        if self.live_mode and self.api_key:
            headers = {
                "Authorization": self.api_key,
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=20.0) as client:
                try:
                    # 1. Fetch team ID for key (e.g. PRA)
                    team_query = """
                    query Teams {
                        teams {
                            nodes { id name key }
                        }
                    }
                    """
                    team_resp = await client.post(self.endpoint, headers=headers, json={"query": team_query})
                    team_id = None
                    if team_resp.status_code == 200:
                        teams = team_resp.json().get("data", {}).get("teams", {}).get("nodes", [])
                        for t in teams:
                            if t.get("key") == self.team_key or self.team_key.lower() in t.get("name", "").lower():
                                team_id = t.get("id")
                                break
                        if not team_id and teams:
                            team_id = teams[0].get("id")

                    if team_id:
                        # 2. Create Issue
                        issue_mutation = """
                        mutation CreateIssue($input: IssueCreateInput!) {
                            issueCreate(input: $input) {
                                success
                                issue {
                                    id
                                    identifier
                                    title
                                    url
                                }
                            }
                        }
                        """
                        variables = {
                            "input": {
                                "title": title,
                                "description": body,
                                "teamId": team_id,
                                "priority": 1  # Urgent / P0
                            }
                        }
                        create_resp = await client.post(
                            self.endpoint,
                            headers=headers,
                            json={"query": issue_mutation, "variables": variables}
                        )
                        if create_resp.status_code == 200:
                            data = create_resp.json().get("data", {}).get("issueCreate", {})
                            if data.get("success"):
                                issue = data["issue"]
                                return LinearTicketOutput(
                                    ticket_id=issue["id"],
                                    ticket_key=issue["identifier"],
                                    title=issue["title"],
                                    url=issue["url"],
                                    priority=1,
                                    body_markdown=body,
                                    is_live=True
                                )
                except Exception as e:
                    print(f"[-] [LINEAR ERROR] Exception creating live ticket: {e}")

        # Fallback / Virtual Sandbox Mode
        ticket_num = abs(hash(alert.alert_id)) % 900 + 100
        ticket_key = f"{self.team_key}-{ticket_num}"
        workspace = getattr(settings, "LINEAR_WORKSPACE", "pranav1632")
        return LinearTicketOutput(
            ticket_id=f"lin-{uuid.uuid4().hex[:8]}",
            ticket_key=ticket_key,
            title=title,
            url=f"https://linear.app/{workspace}/issue/{ticket_key}",
            priority=1,
            body_markdown=body,
            is_live=False
        )

linear_connector = LinearConnector()
