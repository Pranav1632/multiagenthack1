from datetime import datetime, timezone
from incident_commander.engine.scorer import correlation_scorer
from incident_commander.types import SentryAlert, StackFrame, GitCommit

def test_time_decay_scoring():
    t_alert = datetime(2026, 9, 13, 17, 6, 0, tzinfo=timezone.utc)
    t_commit_6m = datetime(2026, 9, 13, 17, 0, 0, tzinfo=timezone.utc)
    t_commit_60m = datetime(2026, 9, 13, 16, 6, 0, tzinfo=timezone.utc)
    t_commit_future = datetime(2026, 9, 13, 17, 10, 0, tzinfo=timezone.utc)

    score_6m = correlation_scorer.calculate_time_score(t_alert, t_commit_6m)
    score_60m = correlation_scorer.calculate_time_score(t_alert, t_commit_60m)
    score_future = correlation_scorer.calculate_time_score(t_alert, t_commit_future)

    assert score_6m > 0.85
    assert score_60m < 0.35
    assert score_future == 0.0
    assert score_6m > score_60m

def test_path_overlap_scoring():
    alert = SentryAlert(
        alert_id="a1",
        project="billing",
        error_type="KeyError",
        message="test",
        timestamp="2026-09-13T17:06:00Z",
        stack_trace=[
            StackFrame(file="services/payments/processor.py", line=142, function="foo")
        ]
    )
    commit_match = GitCommit(
        sha="c1",
        author="Alice",
        message="fix processor",
        timestamp="2026-09-13T17:00:00Z",
        files_changed=["services/payments/processor.py"]
    )
    commit_unrelated = GitCommit(
        sha="c2",
        author="Bob",
        message="fix docs",
        timestamp="2026-09-13T17:00:00Z",
        files_changed=["docs/readme.md"]
    )

    score_match, innermost_match = correlation_scorer.calculate_path_score(alert, commit_match)
    score_unrelated, _ = correlation_scorer.calculate_path_score(alert, commit_unrelated)

    assert innermost_match is True
    assert score_match >= 0.85
    assert score_unrelated == 0.0
