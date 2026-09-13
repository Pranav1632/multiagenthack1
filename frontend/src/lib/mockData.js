// Mock fixtures matching Python eval/fixtures.py for offline / standalone resilience

export const MOCK_PRESETS = [
  {
    id: "scenario-1-payment-keyerror",
    name: "Payment Webhook KeyError",
    description: "Direct dictionary key lookup on optional billing address without null-safe fallback.",
    category: "direct_bug",
    alert: {
      alert_id: "alert-pay-901",
      project: "billing-service",
      error_type: "KeyError",
      message: "KeyError: 'billing_address'",
      culprit: "services/payments/processor.py:142 in handle_stripe_webhook"
    },
    commits_count: 3
  },
  {
    id: "scenario-2-jwt-token-drift",
    name: "JWT Auth Token Expiry Drift",
    description: "TTL accidentally reduced from 24 hours to 5 seconds, causing mass token validation crashes.",
    category: "config_drift",
    alert: {
      alert_id: "alert-auth-402",
      project: "auth-service",
      error_type: "InvalidSignatureError",
      message: "Signature has expired / token validation failed",
      culprit: "services/auth/jwt_handler.py:78 in decode_session_token"
    },
    commits_count: 2
  },
  {
    id: "scenario-3-multi-commit-noise",
    name: "Multi-Commit Noise Disambiguation",
    description: "Single subtle database query change hidden amid 4 noisy frontend pull requests.",
    category: "multi_commit_noise",
    alert: {
      alert_id: "alert-db-550",
      project: "order-service",
      error_type: "OperationalError",
      message: "OperationalError: column orders.loyalty_tier does not exist",
      culprit: "db/repositories/orders.py:95 in get_active_orders"
    },
    commits_count: 4
  },
  {
    id: "scenario-4-infra-outage",
    name: "AWS RDS Outage (Calibration Test)",
    description: "Database connection timeout with 0 touching code commits. Proves agent refrains from hallucinating rollbacks.",
    category: "infra_outage",
    alert: {
      alert_id: "alert-infra-801",
      project: "warehouse-sync",
      error_type: "OperationalError",
      message: "psycopg2.OperationalError: could not connect to server: Connection timed out (port 5432).",
      culprit: "db/connection.py:28 in get_connection_pool"
    },
    commits_count: 2
  }
];

export const MOCK_RESULTS = {
  "scenario-1-payment-keyerror": {
    project: "billing-service",
    error_type: "KeyError",
    top_hypothesis: {
      culprit_sha: "c8a1e2f",
      confidence: 0.94,
      is_external_outage: false,
      hypothesis: "Commit c8a1e2f removed defensive dictionary lookup (.get('billing_address') or {}) and directly accessed payload['customer']['billing_address']['country'], triggering KeyError when webhooks lack billing_address.",
      evidence: [
        "Commit c8a1e2f modified services/payments/processor.py matching stack frame #2 exactly.",
        "Diff removes .get('billing_address') fallback at line 142.",
        "Committed 6 minutes before initial Sentry crash spike.",
        "Zero other service modifications detected in deployment window."
      ],
      recommended_action: "Surgical rollback of commit c8a1e2f or restore .get('billing_address', {}) defensive fallback.",
      surgical_patch: `--- a/services/payments/processor.py
+++ b/services/payments/processor.py
@@ -139,4 +139,4 @@ def handle_stripe_webhook(payload):
-    country = payload['customer']['billing_address']['country']
+    customer = payload.get('customer') or {}
+    billing = customer.get('billing_address') or {}
+    country = billing.get('country', 'US')`
    },
    candidate_commits: [
      {
        sha: "c8a1e2f",
        author: "Alice Zhang",
        message: "refactor(billing): simplify stripe webhook payload parser",
        time_score: "0.95",
        path_score: "1.00",
        line_score: "0.88",
        total_score: "0.94",
        diff_patch: `--- a/services/payments/processor.py
+++ b/services/payments/processor.py
@@ -139,4 +139,4 @@ def handle_stripe_webhook(payload):
-    customer = payload.get('customer') or {}
-    billing = customer.get('billing_address') or {}
-    country = billing.get('country', 'US')
+    country = payload['customer']['billing_address']['country']`
      },
      {
        sha: "f1b2c3d",
        author: "Bob Miller",
        message: "fix(styles): update button hover state on checkout",
        time_score: "0.60",
        path_score: "0.00",
        line_score: "0.00",
        total_score: "0.20",
        diff_patch: `--- a/frontend/styles/checkout.css
+++ b/frontend/styles/checkout.css
@@ -20,2 +20,2 @@
-.btn:hover { opacity: 0.8; }
+.btn:hover { opacity: 0.9; }`
      },
      {
        sha: "a9d8e7f",
        author: "Charlie Brown",
        message: "docs: update API readme guidelines",
        time_score: "0.40",
        path_score: "0.00",
        line_score: "0.00",
        total_score: "0.13",
        diff_patch: `--- a/README.md
+++ b/README.md
@@ -1,2 +1,2 @@
-# API Docs
+# API Documentation v2`
      }
    ],
    slack: {
      channel_name: "#incident-lab",
      is_live: true,
      web_url: "https://slack.com",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🚨 P0 INCIDENT: KeyError: 'billing_address' in billing-service"
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: "*Service:*\nbilling-service" },
            { type: "mrkdwn", text: "*Severity:*\nP0 Critical" },
            { type: "mrkdwn", text: "*Culprit Commit:*\n`c8a1e2f` (Alice Zhang)" },
            { type: "mrkdwn", text: "*Confidence:*\n94% (Calibrated)" }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Root Cause Synthesis:*\nCommit `c8a1e2f` removed defensive `.get('billing_address')` lookup in `handle_stripe_webhook`, crashing 100% of guest checkout webhooks."
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Create Hotfix Revert PR" },
              style: "danger"
            },
            {
              type: "button",
              text: { type: "plain_text", text: "Acknowledge Incident" },
              style: "primary"
            }
          ]
        }
      ]
    },
    linear: {
      ticket_key: "PRA-104",
      is_live: true,
      url: "https://linear.app",
      title: "P0 Bug: KeyError: 'billing_address' in handle_stripe_webhook",
      body_markdown: `## Incident Overview
- **Service:** billing-service
- **Error:** KeyError: 'billing_address'
- **Culprit Commit:** \`c8a1e2f\` (Alice Zhang)
- **Confidence:** 94%

## Root Cause Analysis
Commit \`c8a1e2f\` modified \`services/payments/processor.py\` line 142 by removing safe null check on \`payload['customer']['billing_address']\`.

## Proposed Hotfix
Revert commit \`c8a1e2f\` or deploy patch restoring \`customer.get('billing_address') or {}\`.`
    }
  },

  "scenario-4-infra-outage": {
    project: "warehouse-sync",
    error_type: "OperationalError",
    top_hypothesis: {
      culprit_sha: null,
      confidence: 0.18,
      is_external_outage: true,
      hypothesis: "Zero touching code commits found in deployment window. Connection timeout (port 5432) is consistent with an external AWS RDS cluster network partition or maintenance restart.",
      evidence: [
        "Diff scan across 2 recent commits revealed only documentation and static footer edits.",
        "Database pool exhaustion or AWS security group drift detected.",
        "Confidence calibrated to 18% (refraining from false commit revert)."
      ],
      recommended_action: "Escalate to Infrastructure On-Call (AWS RDS status check). Do NOT revert code commits.",
      surgical_patch: null
    },
    candidate_commits: [
      {
        sha: "99f8e7d",
        author: "Docs Writer",
        message: "docs: typo in changelog",
        time_score: "0.20",
        path_score: "0.00",
        line_score: "0.00",
        total_score: "0.07",
        diff_patch: ""
      },
      {
        sha: "88e7d6c",
        author: "UI Designer",
        message: "style: update footer copyright year",
        time_score: "0.15",
        path_score: "0.00",
        line_score: "0.00",
        total_score: "0.05",
        diff_patch: ""
      }
    ],
    slack: {
      channel_name: "#incident-lab",
      is_live: true,
      web_url: "https://slack.com",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "⚠️ INFRASTRUCTURE ALERT: AWS RDS Connection Timeout in warehouse-sync"
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: "*Service:*\nwarehouse-sync" },
            { type: "mrkdwn", text: "*Severity:*\nP1 Infra" },
            { type: "mrkdwn", text: "*Culprit:*\nNo code commits blamed" },
            { type: "mrkdwn", text: "*Calibration:*\n18% (Don't Guess Guard)" }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Analysis:*\nAgent verified zero code changes caused this outage. Flagged for AWS cloud infrastructure team."
          }
        }
      ]
    },
    linear: {
      ticket_key: "PRA-107",
      is_live: true,
      url: "https://linear.app",
      title: "Infra Investigation: AWS RDS Timeout in warehouse-sync",
      body_markdown: `## Incident Overview
- **Service:** warehouse-sync
- **Error:** OperationalError: could not connect to server: Connection timed out
- **Action:** Checked AWS RDS health; no code rollback needed.`
    }
  }
};

export const MOCK_SCORECARD = {
  run_timestamp: new Date().toISOString(),
  total_cases: 4,
  passed_cases: 4,
  top1_accuracy: 1.0,
  mean_reciprocal_rank: 1.0,
  brier_score: 0.032,
  results: [
    {
      scenario_id: "scenario-1-payment-keyerror",
      name: "Payment Webhook KeyError",
      passed: true,
      predicted_sha: "c8a1e2f",
      expected_sha: "c8a1e2f",
      confidence: 0.94,
      latency_ms: 3820
    },
    {
      scenario_id: "scenario-2-jwt-token-drift",
      name: "JWT Auth Token Expiry Drift",
      passed: true,
      predicted_sha: "b3d4f5a",
      expected_sha: "b3d4f5a",
      confidence: 0.89,
      latency_ms: 4110
    },
    {
      scenario_id: "scenario-3-multi-commit-noise",
      name: "Multi-Commit Noise Disambiguation",
      passed: true,
      predicted_sha: "e9f2a1b",
      expected_sha: "e9f2a1b",
      confidence: 0.84,
      latency_ms: 4450
    },
    {
      scenario_id: "scenario-4-infra-outage",
      name: "AWS RDS Outage (Calibration Guard)",
      passed: true,
      predicted_sha: null,
      expected_sha: null,
      confidence: 0.18,
      latency_ms: 2980
    }
  ]
};
