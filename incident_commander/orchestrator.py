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

        print(f"\n{'='*70}")
        print(f"🚨 [INCIDENT DETECTED] Project: {alert.project} | Type: {alert.error_type}")
        print(f"   Message: {alert.message}")
        print(f"   Culprit: {alert.culprit or 'Unknown'}")
        print(f"{'-'*70}")

        # Step 2: Gather Commits
        if on_step_callback:
            await on_step_callback("gather", f"Gathering candidate git commits within lookback window for {alert.project}...")

        commit_list = commits or []
        if not commit_list:
            print(f"🔍 [1/5 GATHER] Querying GitHub API for recent commits in {repo}...")
            commit_list = await self.github.get_recent_commits(repo, since_timestamp=alert.timestamp, limit=10)
        print(f"   [1/5 GATHER] Evaluated {len(commit_list)} candidate commits.")

        # Step 3: Correlate & Reason
        if on_step_callback:
            await on_step_callback("correlate", "Running hybrid neuro-symbolic correlation & Qwen 2.5 local reasoner...")

        print(f"🧠 [2/5 REASON] Executing 40ms algorithmic pruning + Qwen 2.5 local LLM...")
        candidates, hypothesis = await self.correlation.correlate(alert, commit_list)
        culprit_display = hypothesis.culprit_sha if hypothesis.culprit_sha else "NONE (External Infra Outage)"
        print(f"   [2/5 REASON] Top Culprit: {culprit_display} | Calibrated Confidence: {int(hypothesis.confidence*100)}%")

        # Step 4: Create Linear Ticket
        if on_step_callback:
            await on_step_callback("linear", f"Creating pre-filled incident ticket in Linear (Team: {self.linear.team_key})...")

        channel_slug = self.slack.generate_channel_name(alert.project)
        print(f"🎫 [3/5 LINEAR] Filing P0 Urgent incident ticket under team {self.linear.team_key}...")
        linear_ticket = await self.linear.create_incident_ticket(alert, hypothesis, slack_channel=f"#{channel_slug}")
        print(f"   [3/5 LINEAR] Ticket {linear_ticket.ticket_key} created: {linear_ticket.url} (Live: {linear_ticket.is_live})")

        # Step 5: Create Slack Channel & Post BlockKit Card
        if on_step_callback:
            await on_step_callback("slack", f"Creating incident channel #{channel_slug} in Slack and pinning briefing...")

        print(f"💬 [4/5 SLACK]  Creating incident war-room channel #{channel_slug} and posting BlockKit...")
        slack_card = await self.slack.create_incident_channel_and_notify(
            alert.project, alert, hypothesis, linear_ticket
        )
        print(f"   [4/5 SLACK]  Channel {slack_card.channel_name} active with briefing pinned (Live: {slack_card.is_live})")

        # Step 6: Create GitHub Hotfix PR (Closed-loop remediation)
        github_pr = None
        if hypothesis.culprit_sha and hypothesis.surgical_patch:
            if on_step_callback:
                await on_step_callback("github_pr", f"Auto-generating hotfix PR for commit {hypothesis.culprit_sha[:7]}...")
            
            branch_name = f"hotfix/{channel_slug}"
            print(f"⚡ [5/5 GITHUB] Auto-generating branch {branch_name} and opening Hotfix PR...")
            github_pr = await self.github.create_hotfix_pr(
                repo=repo,
                title=f"[HOTFIX] Resolve {alert.error_type} in {alert.project}",
                branch_name=branch_name,
                patch_diff=hypothesis.surgical_patch,
                body=f"Automated hotfix created by Incident Commander Agent for Linear issue [{linear_ticket.ticket_key}]({linear_ticket.url})."
            )
            print(f"   [5/5 GITHUB] PR Ready: {github_pr.pr_url}")

        execution_time_ms = round((time.time() - t0) * 1000, 2)
        print(f"{'='*70}")
        print(f"✅ [COMPLETE] Autonomous SRE Incident Response resolved in {execution_time_ms}ms!")
        print(f"{'='*70}\n")

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
