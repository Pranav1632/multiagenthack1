# 🛠️ Phase 2: Autonomous Auto-Heal & Hotfix PRs

While Phase 1 addresses incident detection, correlation, and multi-app notification, **Phase 2 closes the loop with Autonomous Remediation**.

---

## 1. Hotfix Architecture Flow

```
Incident Correlated (Confidence >= 0.65)
                  │
                  ▼
         [Generate Revert Diff]
                  │
                  ▼
         [Create Git Branch]
       hotfix/revert-<culprit_sha>
                  │
                  ▼
         [Push Commit via GitHub API]
                  │
                  ▼
         [Open GitHub Pull Request]
                  │
                  ▼
       [Update Slack Card & Linear]
```

---

## 2. API Endpoint: `POST /api/hotfix/create-pr`

- **Request Body**:
  ```json
  {
    "repo": "Pranav1632/multiagenthack1",
    "culprit_sha": "c8a1e2f",
    "title": "fix(revert): auto-revert culprit commit c8a1e2f",
    "patch": "git revert c8a1e2f"
  }
  ```
- **Response**:
  ```json
  {
    "pr_number": 142,
    "pr_url": "https://github.com/Pranav1632/multiagenthack1/pull/142",
    "branch_name": "hotfix/revert-c8a1e2f",
    "title": "fix(revert): auto-revert culprit commit c8a1e2f",
    "is_live": true
  }
  ```

---

## 3. Pre-Flight Sandbox Verification
In full enterprise production deployments:
1. The agent spins up an ephemeral container running the repo's test suite (`pytest` / `npm test`).
2. Confirms that applying the revert diff fixes the failing test without introducing regressions.
3. Requests 1-click human approval directly on the interactive Slack BlockKit card.
