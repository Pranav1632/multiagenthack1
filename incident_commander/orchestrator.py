import time
import uuid
from datetime import datetime, timezone
from typing import Union, Dict, Any, List, Optional
from .types import SentryAlert, GitCommit, IncidentResult
from .connectors import sentry_parser, github_connector, slack_connector, linear_connector
from .engine.correlation_service import correlation_service
from .db import save_incident

class IncidentOrchestrator:
    def __init__(self):
        self.parser = sentry_parser
        self.github = github_connector
        self.slack = slack_connector
        self.linear = linear_connector
        self.correlation = correlation_service

    async def run_pipeline(
        self,
        alert_payload: Union[Dict[str, Any], SentryAlert],
        commits: Optional[List[GitCommit]] = None,
        repo: str = "acme-corp/billing-service",
        on_step_callback: Optional[Any] = None
    ) -> IncidentResult:
        t0 = time.time()
        incident_id = f"inc-{uuid.uuid4().hex[:8]}"

        # Step 1: Ingest & Parse Alert
        if on_step_callback:
            await on_step_callback("ingest", "Parsing Sentry error payload and normalizing stack trace frames...")
        
        if isinstance(alert_payload, dict):
            alert = self.parser.parse(alert_payload)
        else:
            alert = alert_payload

        # Step 2: Gather Commits
        if on_step_callback:
            await on_step_callback("gather", f"Gathering candidate git commits within lookback window for {alert.project}...")

        commit_list = commits or []
        if not commit_list:
            commit_list = await self.github.get_recent_commits(repo, since_timestamp=alert.timestamp, limit=10)

        # Step 3: Correlate & Reason
        if on_step_callback:
            await on_step_callback("correlate", "Running hybrid neuro-symbolic correlation & Qwen 2.5 local reasoner...")

        candidates, hypothesis = await self.correlation.correlate(alert, commit_list)

        # Step 4: Create Linear Ticket
        if on_step_callback:
            await on_step_callback("linear", f"Creating pre-filled incident ticket in Linear (Team: {self.linear.team_key})...")

        channel_slug = self.slack.generate_channel_name(alert.project)
        linear_ticket = await self.linear.create_incident_ticket(alert, hypothesis, slack_channel=f"#{channel_slug}")

        # Step 5: Create Slack Channel & Post BlockKit Card
        if on_step_callback:
            await on_step_callback("slack", f"Creating incident channel #{channel_slug} in Slack and pinning briefing...")

        slack_card = await self.slack.create_incident_channel_and_notify(
            alert.project, alert, hypothesis, linear_ticket
        )

        # Step 6: Create GitHub Hotfix PR (Closed-loop remediation)
        github_pr = None
        if hypothesis.culprit_sha and hypothesis.surgical_patch:
            if on_step_callback:
                await on_step_callback("github_pr", f"Auto-generating hotfix PR for commit {hypothesis.culprit_sha[:7]}...")
            
            branch_name = f"hotfix/{channel_slug}"
            github_pr = await self.github.create_hotfix_pr(
                repo=repo,
                title=f"[HOTFIX] Resolve {alert.error_type} in {alert.project}",
                branch_name=branch_name,
                patch_diff=hypothesis.surgical_patch,
                body=f"Automated hotfix created by Incident Commander Agent for Linear issue [{linear_ticket.ticket_key}]({linear_ticket.url})."
            )

        execution_time_ms = round((time.time() - t0) * 1000, 2)

        result = IncidentResult(
            incident_id=incident_id,
            project=alert.project,
            error_type=alert.error_type,
            error_message=alert.message,
            created_at=datetime.now(timezone.utc).isoformat(),
            status="investigating",
            candidate_commits=candidates,
            top_hypothesis=hypothesis,
            slack=slack_card,
            linear=linear_ticket,
            github_pr=github_pr,
            execution_time_ms=execution_time_ms
        )

        # Persist to local database
        save_incident(result)

        if on_step_callback:
            await on_step_callback("complete", f"Investigation complete in {execution_time_ms}ms! All responders notified.")

        return result

orchestrator = IncidentOrchestrator()
