import asyncio
from incident_commander.eval.runner import eval_runner

def test_full_benchmark_suite():
    scorecard = asyncio.run(eval_runner.run_benchmark())
    assert scorecard.total_cases == 4
    assert scorecard.passed_cases == 4
    assert scorecard.top1_accuracy == 1.0
    assert scorecard.mean_reciprocal_rank == 1.0
    assert scorecard.brier_score < 0.25

    # Verify scenario 4 calibrated as external infra outage
    scenario_4_result = [r for r in scorecard.results if "Infra" in r.name or "RDS" in r.name][0]
    assert scenario_4_result.passed is True
    assert scenario_4_result.predicted_sha is None
    assert scenario_4_result.confidence <= 0.35
