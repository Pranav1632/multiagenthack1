# 🏛️ Architecture & Correlation Engine Specification

Incident Commander combines deterministic heuristic pruning with local language model reasoning to deliver reliable, sub-second root cause analysis for production incidents.

---

## 1. System Pipeline

```
                       Production Error (Sentry / Webhook)
                                       │
                                       ▼
                     [1] Context Normalization & Extraction
                         • Extract error_type, message, culprit
                         • Normalize container paths (/app/.. → relative)
                         • Extract innermost crash frames
                                       │
                                       ▼
                     [2] Commit Candidate Harvesting
                         • GitHub REST API (lookback window = 2 hours)
                         • Unified diff extraction
                         • Modified line interval mapping
                                       │
                                       ▼
                     [3] Hybrid Neuro-Symbolic Correlation
                         ├── Phase A: Algorithmic Filter (40ms)
                         │   • Time Proximity Decay: exp(-0.02 * delta_t)
                         │   • Call-stack Jaccard overlap
                         │   • Diff hunk line proximity (±15 lines)
                         │   • Semantic risk heuristics
                         │
                         ├── Phase B: Calibration Guard (Reliability Metric)
                         │   • Score threshold check (min 0.28)
                         │   • Suppresses false rollbacks on infra outages
                         │
                         └── Phase C: Local Qwen 2.5 Reasoner (Ollama)
                             • Evaluates Top-3 candidates with diffs
                             • Strict JSON schema output
                             • Generates surgical hotfix patch
                                       │
                                       ▼
                     [4] Multi-App Response & Remediation
                         ├── Slack: Creates #incident-YYYYMMDD-<service>
                         ├── Linear: Files P0 issue under team PRA
                         └── GitHub: Opens 1-click Hotfix PR
```

---

## 2. Mathematical Scoring Function

Every commit $c$ is evaluated against alert $A$ using:

$$S(c, A) = w_t \cdot S_{\text{time}}(c, A) + w_p \cdot S_{\text{path}}(c, A) + w_l \cdot S_{\text{line}}(c, A) + w_d \cdot S_{\text{diff}}(c, A)$$

Where:
* $w_t = 0.30$ (Time proximity weight)
* $w_p = 0.35$ (Stack path overlap weight)
* $w_l = 0.20$ (Line proximity weight)
* $w_d = 0.15$ (Semantic diff heuristic weight)

### Component Details:
1. **Time Proximity Decay**:
   $$\Delta t = \frac{T_{\text{alert}} - T_{\text{commit}}}{60} \quad (\text{minutes})$$
   $$S_{\text{time}} = \begin{cases} \exp(-0.02 \cdot \Delta t), & \text{if } \Delta t \ge 0 \\ 0.0, & \text{if } \Delta t < 0 \text{ (commit deployed after alert)} \end{cases}$$

2. **Stack Path Overlap (Jaccard + Innermost Crash Boost)**:
   $$J(c, A) = \frac{|F_{\text{stack}} \cap F_{\text{commit}}|}{|F_{\text{stack}} \cup F_{\text{commit}}|}$$
   If commit touches the innermost crash frame file, score is boosted to $\max(J, 0.85)$.

3. **Line Proximity Match**:
   $$S_{\text{line}} = \begin{cases} 1.0, & \text{if diff hunk overlaps crash line } L_{\text{crash}} \\ 0.9, & \text{if } |L - L_{\text{crash}}| \le 15 \\ 0.5, & \text{if } |L - L_{\text{crash}}| \le 50 \\ 0.0, & \text{otherwise} \end{cases}$$

---

## 3. Reliability & Calibration Guard

When an alert is ingested:
1. If $\max_c S(c, A) < 0.28$, the engine detects that no recent code modifications correlate with the failure.
2. The agent flags:
   - `is_external_outage = True`
   - `needs_human_review = True`
   - `confidence = 0.18` (Capped)
   - `culprit_sha = None`
3. This prevents catastrophic automated rollbacks during AWS, Cloudflare, or database connection pool failures.

---

## 4. Multi-App Architecture

* **Linear**: Integrates via GraphQL `issueCreate` mutation to generate issues under team `PRA`.
* **Slack**: Uses `conversations.create`, `chat.postMessage`, and `pins.add` to coordinate responders.
* **GitHub**: Queries `/repos/{owner}/{repo}/commits` and creates hotfix PR branches.
* **Database**: Zero-config SQLite database (`data/incidents.db`) storing audit trails.
