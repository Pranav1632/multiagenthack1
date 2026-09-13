# 🏗️ Incident Commander Architecture & System Design

## 1. System Philosophy
The Incident Commander is built on three core engineering pillars:
1. **Low Latency & High Throughput**: Sub-second candidate filtering enables immediate incident response.
2. **Deterministic Safety Guardrails**: Neural models must never guess or hallucinate code rollbacks during cloud outages.
3. **True Multi-App Synergy**: Native integration across Sentry, GitHub, Slack, and Linear rather than superficial iframe embeds.

---

## 2. Component Topology

```
┌─────────────────────────────────────────────────────────┐
│                   INCOMING SENTRY ALERT                 │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│               1. ALERT NORMALIZATION & PARSER           │
│  - Cleans absolute container paths into repo-rel paths   │
│  - Extracts error type, crash line, caller AST frames   │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│              2. GITHUB RECENT COMMITS RETRIEVER         │
│  - Retrieves commits across lookback window             │
│  - Fetches patch diffs & changed file paths             │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│             3. 40ms ALGORITHMIC SCORING FILTER          │
│  - Exponential Time Decay: exp(-lambda * delta_t)       │
│  - Jaccard File Path Set Overlap                        │
│  - AST Diff Line-Level Proximity Scoring                │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│          4. LOCAL QWEN 2.5 REASONER & GUARD             │
│  - Semantic analysis of top 3-5 diff patches            │
│  - "Don't Guess" calibration threshold check (< 0.65)   │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│             5. MULTI-APP DISPATCH ORCHESTRATION         │
│  - Slack: Creates dedicated war-room channel            │
│  - Linear: Files P0 issue under team PRA                │
│  - GitHub: Generates Phase 2 surgical hotfix branch     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Database & Telemetry Persistence
- Stored locally in SQLite (`data/incidents.db`).
- Tracks incident IDs, raw payloads, top culprit SHA, calibrated confidence, Slack channel IDs, Linear ticket keys, and full execution duration.
