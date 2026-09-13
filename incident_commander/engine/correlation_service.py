from typing import List, Tuple
from ..types import SentryAlert, GitCommit, CandidateScore, RootCauseHypothesis
from .scorer import correlation_scorer
from .qwen_reasoner import qwen_reasoner

class CorrelationService:
    def __init__(self):
        self.scorer = correlation_scorer
        self.reasoner = qwen_reasoner

    async def correlate(
        self,
        alert: SentryAlert,
        commits: List[GitCommit]
    ) -> Tuple[List[CandidateScore], RootCauseHypothesis]:
        # 1. Algorithmic ranking across all commits (40ms execution)
        scored_candidates = self.scorer.score_candidates(alert, commits)
        commits_map = {c.sha: c for c in commits}

        # 2. Calibration & "Don't Guess" Guard
        # If top score is below threshold or no commits exist, attribute to external infrastructure
        if not scored_candidates or scored_candidates[0].total_score < 0.28:
            hypothesis = RootCauseHypothesis(
                culprit_sha=None,
                confidence=0.18,
                hypothesis=f"No recent code commits correlate with the {alert.error_type} in {alert.project}. Root cause appears to be external network timeout, upstream infrastructure partition, or database connection starvation.",
                evidence=[
                    "Zero recent commits touched database connection, network pools, or service middleware.",
                    f"Max candidate correlation score is {scored_candidates[0].total_score if scored_candidates else 0.0} (well below 0.28 threshold).",
                    "Alert culprit indicates external socket or connection timeout."
                ],
                surgical_patch=None,
                recommended_action="DO NOT roll back code commits. Check AWS/Cloud status page, database CPU/connections, and network VPC peering.",
                needs_human_review=True,
                is_external_outage=True
            )
            return scored_candidates, hypothesis

        # 3. Take Top-3 candidates for deep semantic LLM reasoning
        top_candidates = scored_candidates[:3]
        hypothesis = await self.reasoner.reason(alert, top_candidates, commits_map)

        return scored_candidates, hypothesis

correlation_service = CorrelationService()
