import re
import httpx
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from ..types import SentryAlert, RootCauseHypothesis, LinearTicketOutput, SlackCardOutput
from ..config import settings
from .base import BaseSlackConnector

class SlackConnector(BaseSlackConnector):
    def __init__(self):
        self.token = settings.SLACK_BOT_TOKEN
        self.live_mode = settings.LIVE_API_MODE and bool(self.token)

    def generate_channel_name(self, service: str) -> str:
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        clean_service = re.sub(r"[^a-zA-Z0-9-]", "-", service.lower()).strip("-")[:25]
        return f"incident-{date_str}-{clean_service}"

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
        linear_ticket: Optional[LinearTicketOutput] = None
    ) -> SlackCardOutput:
        channel_name = self.generate_channel_name(service)
        blocks = self.build_block_kit(service, alert, hypothesis, linear_ticket)

        if self.live_mode and self.token:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json; charset=utf-8"
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
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
                    # Channel already exists, lookup ID
                    list_resp = await client.get("https://slack.com/api/conversations.list?types=public_channel", headers=headers)
                    if list_resp.status_code == 200:
                        for ch in list_resp.json().get("channels", []):
                            if ch.get("name") == channel_name:
                                channel_id = ch.get("id")
                                break

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
                        await client.post(
                            "https://slack.com/api/pins.add",
                            headers=headers,
                            json={"channel": channel_id, "timestamp": msg_ts}
                        )

                    return SlackCardOutput(
                        channel_id=channel_id,
                        channel_name=f"#{channel_name}",
                        message_ts=msg_ts,
                        blocks=blocks,
                        web_url=f"https://slack.com/app_redirect?channel={channel_id}",
                        is_live=True
                    )

        # Fallback / Virtual Sandbox Mode
        sim_id = f"C0{abs(hash(channel_name)) % 100000000}"
        return SlackCardOutput(
            channel_id=sim_id,
            channel_name=f"#{channel_name}",
            message_ts=f"{int(datetime.now(timezone.utc).timestamp())}.000100",
            blocks=blocks,
            web_url=f"https://app.slack.com/client/T00000000/{sim_id}",
            is_live=False
        )

slack_connector = SlackConnector()
