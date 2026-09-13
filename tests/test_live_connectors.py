import asyncio
from incident_commander.eval.fixtures import get_eval_scenarios
from incident_commander.connectors import sentry_parser, github_connector, slack_connector, linear_connector
from incident_commander.types import RootCauseHypothesis

def test_slack_block_kit_structure():
    s1 = get_eval_scenarios()[0]
    hypothesis = RootCauseHypothesis(
        culprit_sha="c8a1e2f",
        confidence=0.88,
        hypothesis="Removed null checks for billing address",
        evidence=["Line 142 crashed", "Deployed 6m prior"],
        surgical_patch="--- a/test.py\n+++ b/test.py",
        recommended_action="git revert c8a1e2f",
        needs_human_review=False
    )
    blocks = slack_connector.build_block_kit("billing-service", s1.alert, hypothesis)
    assert len(blocks) >= 4
    assert blocks[0]["type"] == "header"
    assert "billing-service" in blocks[0]["text"]["text"]

def test_linear_ticket_markdown():
    s1 = get_eval_scenarios()[0]
    hypothesis = RootCauseHypothesis(
        culprit_sha="c8a1e2f",
        confidence=0.88,
        hypothesis="Removed null checks for billing address",
        evidence=["Line 142 crashed"],
        recommended_action="git revert c8a1e2f"
    )
    body = linear_connector.format_ticket_body(s1.alert, hypothesis, "#incident-test")
    assert "billing-service" in body
    assert "c8a1e2f" in body
    assert "git revert c8a1e2f" in body

def test_github_hotfix_pr_generator():
    pr = asyncio.run(github_connector.create_hotfix_pr(
        repo="Pranav1632/multiagenthack1",
        title="[HOTFIX] Test",
        branch_name="hotfix/test",
        patch_diff="diff",
        body="body"
    ))
    assert pr.branch_name == "hotfix/test"
    assert "https://github.com/Pranav1632/multiagenthack1/pull/" in pr.pr_url
