# 🎬 Two-Actor Demonstration Guide: Developer POV vs SRE AI Agent POV

This guide provides the exact script to demonstrate **Incident Commander** from two distinct human perspectives during your hackathon pitch:

1. **Person 1 (The Feature Developer)**: Pushes a real code commit in another microservice (`demo_service`), runs the app, and triggers a real unhandled production exception.
2. **Person 2 (The Incident Commander Agent)**: Sentry catches the crash $\rightarrow$ automatically fires a webhook $\rightarrow$ Incident Commander starts autonomously with zero button clicking $\rightarrow$ creates Slack war-room & Linear P0 issue $\rightarrow$ prepares hotfix revert PR!

---

## Architecture: How `demo_service/` Operates Without Breaking Anything

```
+--------------------------------------------------------------------------+
| PERSON 1: DEVELOPER POV                                                  |
| 1. Modifies demo_service/server.js (Introduces bad object access)        |
| 2. Pushes commit to repo: 'refactor(payment): simplify webhook payload' |
| 3. Customer sends real Stripe transaction -> server throws TypeError!    |
| 4. Sentry catches error & dispatches webhook to localhost:8000           |
+------------------------------------+-------------------------------------+
                                     │ (POST /api/webhook/sentry)
                                     ▼
+--------------------------------------------------------------------------+
| PERSON 2: AUTONOMOUS AI SRE AGENT POV                                    |
| 1. Incident Commander receives live crash webhook                        |
| 2. Queries GitHub API for recent commits in repo                         |
| 3. Correlates crash line (server.js:38) against author's commit diff     |
| 4. Dispatches Slack channel (#inc-...) & Linear P0 ticket (Team PRA)     |
| 5. Opens surgical Hotfix PR to revert the bad commit                     |
+--------------------------------------------------------------------------+
```

---

## 3-Minute Live Video Demo Walkthrough

### Part 1: Start the Servers (Before Recording)
1. **Terminal 1 (Incident Commander Backend + UI)**:
   ```bash
   python run_demo.py
   ```
2. **Terminal 2 (The Developer's Demo Microservice)**:
   ```bash
   cd demo_service
   npm start
   ```
   *(Output: `Demo Payment Service listening on http://localhost:4000`)*

---

### Part 2: Record the Demonstration

#### Scene 1: The Developer's POV (Person 1) — 0:00 to 0:45
- **What to show on screen**: Open VS Code or terminal showing `demo_service/server.js`.
- **Narration**:
  > *"I'm a developer working on our payment microservice. I just refactored our Stripe webhook handler to read `payload.customer.billing_address.country` directly without defensive checks, committed it to git, and deployed it."*
- **The Action**: Open another terminal and simulate a real customer checkout hitting the service:
  ```bash
  cd demo_service
  npm run trigger-crash
  ```
- **What happens**:
  - `demo_service` immediately crashes with:
    ```text
    🚨 [CRASH TRIGGERED IN DEMO_SERVICE]: TypeError: Cannot read properties of undefined (reading 'country')
        at handle_stripe_webhook (demo_service/server.js:38:43)
    [!] [SENTRY EMULATOR] Dispatched crash alert to Incident Commander webhook at http://localhost:8000/api/webhook/sentry
    ```

---

#### Scene 2: The Autonomous Agent's POV (Person 2) — 0:45 to 2:00
- **What to show on screen**: Switch to the Incident Commander web dashboard (`http://localhost:5173`) and terminal.
- **Narration**:
  > *"Notice that nobody pressed any buttons in the dashboard. Sentry caught the unhandled production exception and fired an inbound webhook to Incident Commander. The autonomous agent immediately springs to life!"*
- **What to highlight in the UI**:
  1. **Autonomous Execution Timeline**:
     - `ingest`: Stack trace parsed (`demo_service/server.js:38`).
     - `gather`: Lookback commits retrieved via GitHub REST API.
     - `correlate`: Local Qwen 2.5 LLM analyzes the diff and assigns 87% calibrated confidence.
  2. **Multi-App Dispatch**:
     - Switch to **Slack**: Show the newly created `#inc-...` channel with the BlockKit card.
     - Switch to **Linear**: Show the newly created P0 ticket under team **`PRA`** with reproduction steps and rollback command.
  3. **Phase 2 Hotfix Automation**:
     - Point to the auto-generated surgical patch and GitHub branch ready for 1-click merge!

---

#### Scene 3: The Reliability Showstopper (The Outage Guard) — 2:00 to 2:45
- **Narration**:
  > *"Most AI agents blindly suggest reverting code even when code isn't the problem. Let's see what happens during a cloud infrastructure outage."*
- **The Action**: Click **Trigger: AWS RDS Outage**.
- **What to highlight**:
  - The agent identifies connection timeout, detects 0 code correlation, outputs **Confidence: 18% (Low)**, and **suppresses automated code rollbacks**.
- **The Wrap-up**: Open the **Benchmarks** modal to show the **5/5 (100% Top-1 Accuracy, MRR 1.000)** official scorecard.
