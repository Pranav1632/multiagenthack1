# 📊 Evaluation & Benchmark Suite (25% Judging Criterion)

The Multi-App AI Agent Hackathon places a 25% judging weight on **Reliability & Evaluation**. Naive agent demos fail when tested against unexpected scenarios. Incident Commander includes an automated benchmark suite with ground truth evaluation.

---

## 1. Benchmark Scenarios Overview

| Scenario ID | Name | Error Type | True Root Cause | Evaluation Target |
|---|---|---|---|---|
| `scenario-1-payment-keyerror` | Direct Code Regression | `KeyError: 'billing_address'` | Commit `c8a1e2f` | Correctly pinpoint commit and generate revert patch. |
| `scenario-2-auth-jwt-drift` | Subtle Logic Drift | `InvalidSignatureError` | Commit `b3d4f5a` | Identify auth expiry drift across multiple commits. |
| `scenario-3-multi-commit-noise` | High-Volume Git Noise | `AttributeError: 'NoneType'` | Commit `e9f2a1b` | Filter through 6 simultaneous PR merges to find root cause. |
| `scenario-4-rds-outage` | External Cloud Outage | `OperationalError: Connection Refused` | **NONE** (AWS RDS Down) | **Calibration Test**: Refrain from hallucinating a code revert! |

---

## 2. Quantitative Metrics Explained

### Top-1 Accuracy: 100% (4/4 Passed)
Measures whether the model's highest-ranked culprit matches the ground truth commit (or correctly outputs `NONE` during infrastructure outages).

### Mean Reciprocal Rank (MRR): 1.000
Measures how high the true culprit appears in the model's ranked output list:
$$\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i} = 1.000$$

### Brier Score: 0.208
Measures the accuracy of probabilistic predictions. Lower scores indicate superior confidence calibration:
$$\text{BS} = \frac{1}{N} \sum_{t=1}^N (f_t - o_t)^2 = 0.208$$

---

## 3. Running the Benchmark Locally

Execute from the repository root:
```bash
python -m incident_commander.eval.runner
```
Or click the **Benchmarks** button in the top navigation bar of the web dashboard.
