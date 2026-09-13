import time
from incident_commander.engine.scorer import correlation_scorer
from incident_commander.eval.fixtures import get_eval_scenarios

def test_algorithmic_filter_latency():
    """Verify that heuristic pruning prunes commits in under 50 milliseconds."""
    scenarios = get_eval_scenarios()
    
    for s in scenarios:
        t0 = time.perf_counter()
        candidates = correlation_scorer.score_candidates(s.alert, s.commits)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        # Assert sub-50ms execution speed
        assert elapsed_ms < 50.0, f"Scorer took {elapsed_ms:.2f}ms on {s.name}, expected < 50ms"
        assert len(candidates) == len(s.commits)
        # Assert candidates are sorted descending
        for i in range(len(candidates) - 1):
            assert candidates[i].total_score >= candidates[i+1].total_score
