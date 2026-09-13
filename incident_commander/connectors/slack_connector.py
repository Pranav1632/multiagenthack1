import re
import httpx
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from ..types import SentryAlert, RootCauseHypothesis, LinearTicketOutput, SlackCardOutput
from ..config import settings
from .base import BaseSlackConnector

class SlackConnector(BaseSlackConnector):
    @property
    def token(self) -> str:
        return settings.SLACK_BOT_TOKEN

    @property
    def live_mode(self) -> bool:
        return settings.LIVE_API_MODE and bool(self.token)

    _cached_team_id: Optional[str] = None
    _cached_team_domain: Optional[str] = None

    async def get_team_info(self, client: httpx.AsyncClient) -> tuple[str, str]:
        if self._cached_team_id and self._cached_team_domain:
            return self._cached_team_id, self._cached_team_domain
        try:
            auth_resp = await client.post(
                "https://slack.com/api/auth.test",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            if auth_resp.status_code == 200:
                data = auth_resp.json()
                if data.get("ok"):
                    self._cached_team_id = data.get("team_id", "T0C2BU9S40Y")
                    url = data.get("url", "")
                    domain = url.replace("https://", "").replace(".slack.com/", "").strip()
                    self._cached_team_domain = domain or "incident-app"
                    return self._cached_team_id, self._cached_team_domain
        except Exception:
            pass
        return "T0C2BU9S40Y", "incident-app"

    def generate_channel_name(self, service: str, alert_id: Optional[str] = None) -> str:
        # Include current UTC day and time (MMDD-HHMM) plus unique hex suffix to guarantee a brand new channel on every run
        time_str = datetime.now(timezone.utc).strftime("%m%d-%H%M")
        clean_service = re.sub(r"[^a-zA-Z0-9-]", "-", service.lower()).strip("-")[:12]
        import uuid
        unique_suffix = uuid.uuid4().hex[:3]
        return f"inc-{time_str}-{clean_service}-{unique_suffix}".lower()

    def build_block_kit(
        self,
        service: str,
        alert: SentryAlert,
        hypothesis: RootCauseHypothesis,
        linear_ticket: Optional[LinearTicketOutput] = None
    ) -> List[Dict[str, Any]]:
        # Format severity and confidence badges
        conf_pct = int(hypothesis.confidence * 100)
        conf_badge = f"🟢 High ({conf_pct}%)" if conf_pct >= 70 else (f"🟡 Medium ({conf_pct}%)" if conf_pct >= 40 else f"🔴 Low ({conf_pct}%)")

        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🚨 INCIDENT DETECTED: {service}",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Error:* `{alert.error_type}`"},
                    {"type": "mrkdwn", "text": f"*Confidence:* {conf_badge}"},
                    {"type": "mrkdwn", "text": f"*Culprit:* `{alert.culprit or 'Unknown'}`"},
                    {"type": "mrkdwn", "text": f"*Reported:* <!date^{int(datetime.now(timezone.utc).timestamp())}^{{time}}|{alert.timestamp}>"}
                ]
            },
            {"type": "divider"},
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*🎯 Root Cause Hypothesis:*\n{hypothesis.hypothesis}"
                }
            }
        ]

        if hypothesis.evidence:
            evidence_text = "\n".join([f"• {e}" for e in hypothesis.evidence])
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*📋 Falsifiable Evidence:*\n{evidence_text}"
                }
            })

        if hypothesis.recommended_action:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*🛠️ Recommended Mitigation:*\n`{hypothesis.recommended_action}`"
                }
            })

        # Action buttons
        actions = []
        if hypothesis.culprit_sha:
            actions.append({
                "type": "button",
                "text": {"type": "plain_text", "text": f"⏮️ Revert {hypothesis.culprit_sha[:7]}", "emoji": True},
                "style": "danger",
                "value": f"revert_{hypothesis.culprit_sha}"
            })
            actions.append({
                "type": "button",
                "text": {"type": "plain_text", "text": "⚡ Create Hotfix PR", "emoji": True},
                "style": "primary",
                "value": f"hotfix_{hypothesis.culprit_sha}"
            })
        
        if linear_ticket:
            actions.append({
                "type": "button",
                "text": {"type": "plain_text", "text": f"🎫 Linear {linear_ticket.ticket_key}", "emoji": True},
                "url": linear_ticket.url
            })

        if actions:
            blocks.append({"type": "actions", "elements": actions})

        return blocks

    async def create_incident_channel_and_notify(
        self,
        service: str,
        alert: SentryAlert,
        hypothesis: RootCauseHypothesis,
        linear_ticket: Optional[LinearTicketOutput] = None,
        channel_name: Optional[str] = None
    ) -> SlackCardOutput:
        channel_name = channel_name or self.generate_channel_name(service, alert.alert_id)
        blocks = self.build_block_kit(service, alert, hypothesis, linear_ticket)

        if self.live_mode and self.token:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json; charset=utf-8"
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                team_id, domain = await self.get_team_info(client)

                # 1. Create channel
                channel_id = ""
                create_resp = await client.post(
                    "https://slack.com/api/conversations.create",
                    headers=headers,
                    json={"name": channel_name, "is_private": False}
                )
                create_data = create_resp.json()
                if create_data.get("ok"):
                    channel_id = create_data["channel"]["id"]
                elif create_data.get("error") == "name_taken":
                    # If duplicate name, append random hash
                    import uuid
                    retry_name = f"{channel_name[:15]}-{uuid.uuid4().hex[:4]}"
                    retry_resp = await client.post(
                        "https://slack.com/api/conversations.create",
                        headers=headers,
                        json={"name": retry_name, "is_private": False}
                    )
                    if retry_resp.json().get("ok"):
                        channel_name = retry_name
                        channel_id = retry_resp.json()["channel"]["id"]

                # 2. Post message
                if channel_id:
                    post_resp = await client.post(
                        "https://slack.com/api/chat.postMessage",
                        headers=headers,
                        json={
                            "channel": channel_id,
                            "text": f"🚨 Incident Alert: {alert.error_type} in {service}",
                            "blocks": blocks
                        }
                    )
                    post_data = post_resp.json()
                    msg_ts = post_data.get("ts")
                    if msg_ts:
                        # 3. Pin message
                        try:
                            await client.post(
                                "https://slack.com/api/pins.add",
                                headers=headers,
                                json={"channel": channel_id, "timestamp": msg_ts}
                            )
                        except Exception:
                            pass

                    # Direct link to channel in user's workspace
                    direct_url = f"https://app.slack.com/client/{team_id}/{channel_id}"
                    return SlackCardOutput(
                        channel_id=channel_id,
                        channel_name=f"#{channel_name}",
                        message_ts=msg_ts,
                        blocks=blocks,
                        web_url=direct_url,
                        is_live=True
                    )

        # Fallback / Virtual Sandbox Mode
        sim_id = f"C0{abs(hash(channel_name)) % 100000000}"
        return SlackCardOutput(
            channel_id=sim_id,
            channel_name=f"#{channel_name}",
            message_ts=f"{int(datetime.now(timezone.utc).timestamp())}.000100",
            blocks=blocks,
            web_url=f"https://app.slack.com/client/T0C2BU9S40Y/{sim_id}",
            is_live=False
        )

slack_connector = SlackConnector()
