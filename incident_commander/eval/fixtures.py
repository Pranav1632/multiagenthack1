from typing import List
from ..types import SentryAlert, StackFrame, GitCommit, EvalScenario

def get_eval_scenarios() -> List[EvalScenario]:
    # -------------------------------------------------------------
    # Scenario 1: Direct Code Regression (Payment Webhook KeyError)
    # -------------------------------------------------------------
    s1_alert = SentryAlert(
        alert_id="alert-pay-901",
        project="billing-service",
        error_type="KeyError",
        message="KeyError: 'billing_address'",
        timestamp="2026-09-13T17:06:00Z",
        culprit="services/payments/processor.py:142 in handle_stripe_webhook",
        stack_trace=[
            StackFrame(
                file="services/payments/router.py",
                line=45,
                function="stripe_webhook_endpoint",
                code="return await process_event(event)"
            ),
            StackFrame(
                file="services/payments/processor.py",
                line=142,
                function="handle_stripe_webhook",
                code="country = payload['customer']['billing_address']['country']"
            )
        ]
    )
    s1_commits = [
        GitCommit(
            sha="c8a1e2f",
            author="Alice Zhang",
            message="refactor(billing): simplify stripe webhook payload parser",
            timestamp="2026-09-13T17:00:00Z",  # 6 mins before alert
            files_changed=["services/payments/processor.py"],
            diff_patch="""--- a/services/payments/processor.py
+++ b/services/payments/processor.py
@@ -139,4 +139,4 @@ def handle_stripe_webhook(payload):
-    customer = payload.get('customer') or {}
-    billing = customer.get('billing_address') or {}
-    country = billing.get('country', 'US')
+    country = payload['customer']['billing_address']['country']"""
        ),
        GitCommit(
            sha="f1b2c3d",
            author="Bob Miller",
            message="fix(styles): update button hover state on checkout",
            timestamp="2026-09-13T16:30:00Z",
            files_changed=["frontend/styles/checkout.css"],
            diff_patch="""--- a/frontend/styles/checkout.css
+++ b/frontend/styles/checkout.css
@@ -20,2 +20,2 @@
-.btn:hover { opacity: 0.8; }
+.btn:hover { opacity: 0.9; }"""
        ),
        GitCommit(
            sha="a9d8e7f",
            author="Charlie Brown",
            message="docs: update API readme guidelines",
            timestamp="2026-09-13T15:00:00Z",
            files_changed=["README.md"],
            diff_patch="""--- a/README.md
+++ b/README.md
@@ -1,2 +1,2 @@
-# API Docs
+# API Documentation v2"""
        )
    ]
    s1 = EvalScenario(
        id="scenario-1-payment-keyerror",
        name="Payment Webhook KeyError",
        description="Direct dictionary key lookup on optional billing address without null-safe fallback.",
        category="direct_bug",
        alert=s1_alert,
        commits=s1_commits,
        expected_culprit_sha="c8a1e2f",
        expected_min_confidence=0.75,
        expected_max_confidence=1.0,
        should_flag_human_review=False
    )

    # -------------------------------------------------------------
    # Scenario 2: Configuration Drift (JWT Token TTL Regression)
    # -------------------------------------------------------------
    s2_alert = SentryAlert(
        alert_id="alert-auth-402",
        project="auth-service",
        error_type="InvalidSignatureError",
        message="Signature has expired / token validation failed",
        timestamp="2026-09-13T14:15:00Z",
        culprit="services/auth/jwt_handler.py:78 in decode_session_token",
        stack_trace=[
            StackFrame(
                file="services/auth/middleware.py",
                line=32,
                function="auth_middleware",
                code="user = decode_session_token(token)"
            ),
            StackFrame(
                file="services/auth/jwt_handler.py",
                line=78,
                function="decode_session_token",
                code="return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])"
            )
        ]
    )
    s2_commits = [
        GitCommit(
            sha="b3d4f5a",
            author="David Ross",
            message="chore(security): adjust session token TTL for integration test",
            timestamp="2026-09-13T14:02:00Z",  # 13 mins before alert
            files_changed=["services/auth/jwt_handler.py"],
            diff_patch="""--- a/services/auth/jwt_handler.py
+++ b/services/auth/jwt_handler.py
@@ -21,3 +21,3 @@
-DEFAULT_TTL_SECONDS = 86400  # 24 hours
+DEFAULT_TTL_SECONDS = 5      # 5 seconds test timeout
@@ -75,3 +75,3 @@ def decode_session_token(token):"""
        ),
        GitCommit(
            sha="c1d2e3f",
            author="Eva Green",
            message="refactor: clean up unused imports in auth tests",
            timestamp="2026-09-13T13:40:00Z",
            files_changed=["tests/test_auth.py"],
            diff_patch=""
        )
    ]
    s2 = EvalScenario(
        id="scenario-2-jwt-token-drift",
        name="JWT Auth Token Expiry Drift",
        description="TTL accidentally reduced from 24 hours to 5 seconds, causing mass token validation crashes.",
        category="config_drift",
        alert=s2_alert,
        commits=s2_commits,
        expected_culprit_sha="b3d4f5a",
        expected_min_confidence=0.70,
        expected_max_confidence=1.0,
        should_flag_human_review=False
    )

    # -------------------------------------------------------------
    # Scenario 3: Multi-Commit Noise Disambiguation (Missing DB Column)
    # -------------------------------------------------------------
    s3_alert = SentryAlert(
        alert_id="alert-db-550",
        project="order-service",
        error_type="OperationalError",
        message="OperationalError: column orders.loyalty_tier does not exist",
        timestamp="2026-09-13T19:30:00Z",
        culprit="db/repositories/orders.py:95 in get_active_orders",
        stack_trace=[
            StackFrame(
                file="api/orders.py",
                line=50,
                function="list_orders",
                code="orders = await get_active_orders(db)"
            ),
            StackFrame(
                file="db/repositories/orders.py",
                line=95,
                function="get_active_orders",
                code="query = select(Order.id, Order.loyalty_tier)"
            )
        ]
    )
    s3_commits = [
        GitCommit(
            sha="8a7b6c5",
            author="Frontend Dev A",
            message="feat(ui): add loyalty badge icon to navbar",
            timestamp="2026-09-13T19:28:00Z",
            files_changed=["frontend/src/Navbar.tsx"],
            diff_patch=""
        ),
        GitCommit(
            sha="e9f2a1b",
            author="Sarah Connor",
            message="feat(loyalty): query loyalty tier on active orders",
            timestamp="2026-09-13T19:20:00Z",  # 10 mins before alert
            files_changed=["db/repositories/orders.py"],
            diff_patch="""--- a/db/repositories/orders.py
+++ b/db/repositories/orders.py
@@ -93,3 +93,3 @@ def get_active_orders(db):
-    query = select(Order.id, Order.amount)
+    query = select(Order.id, Order.loyalty_tier)"""
        ),
        GitCommit(
            sha="1b2c3d4",
            author="Frontend Dev B",
            message="chore: bump lucide-react package",
            timestamp="2026-09-13T19:15:00Z",
            files_changed=["package.json"],
            diff_patch=""
        ),
        GitCommit(
            sha="2c3d4e5",
            author="Frontend Dev C",
            message="fix(cart): align price total margin",
            timestamp="2026-09-13T19:10:00Z",
            files_changed=["frontend/src/Cart.tsx"],
            diff_patch=""
        )
    ]
    s3 = EvalScenario(
        id="scenario-3-multi-commit-noise",
        name="Multi-Commit Noise Disambiguation",
        description="Single subtle database query change hidden amid 4 noisy frontend pull requests.",
        category="multi_commit_noise",
        alert=s3_alert,
        commits=s3_commits,
        expected_culprit_sha="e9f2a1b",
        expected_min_confidence=0.70,
        expected_max_confidence=1.0,
        should_flag_human_review=False
    )

    # -------------------------------------------------------------
    # Scenario 4: AWS RDS Outage (Don't Guess Calibration Test)
    # -------------------------------------------------------------
    s4_alert = SentryAlert(
        alert_id="alert-infra-801",
        project="warehouse-sync",
        error_type="OperationalError",
        message="psycopg2.OperationalError: could not connect to server: Connection timed out (port 5432). Is the server running on host rds-prod-cluster.internal?",
        timestamp="2026-09-13T22:00:00Z",
        culprit="db/connection.py:28 in get_connection_pool",
        stack_trace=[
            StackFrame(
                file="services/sync.py",
                line=110,
                function="sync_warehouse_records",
                code="pool = get_connection_pool()"
            ),
            StackFrame(
                file="db/connection.py",
                line=28,
                function="get_connection_pool",
                code="conn = psycopg2.connect(**DATABASE_CONFIG)"
            )
        ]
    )
    s4_commits = [
        GitCommit(
            sha="99f8e7d",
            author="Docs Writer",
            message="docs: typo in changelog",
            timestamp="2026-09-13T16:00:00Z",
            files_changed=["CHANGELOG.md"],
            diff_patch=""
        ),
        GitCommit(
            sha="88e7d6c",
            author="UI Designer",
            message="style: update footer copyright year",
            timestamp="2026-09-13T14:00:00Z",
            files_changed=["web/footer.html"],
            diff_patch=""
        )
    ]
    s4 = EvalScenario(
        id="scenario-4-infra-outage",
        name="AWS RDS Outage (Calibration Test)",
        description="Database connection timeout with 0 touching code commits. Proves agent refrains from hallucinating rollbacks.",
        category="infra_outage",
        alert=s4_alert,
        commits=s4_commits,
        expected_culprit_sha=None,  # No commit to blame!
        expected_min_confidence=0.0,
        expected_max_confidence=0.35,
        should_flag_human_review=True
    )

    # -------------------------------------------------------------
    # Scenario 5: Async Redis Pool Leak (Resource Starvation)
    # -------------------------------------------------------------
    s5_alert = SentryAlert(
        alert_id="alert-cache-302",
        project="session-service",
        error_type="ConnectionError",
        message="redis.exceptions.ConnectionError: Too many open connections (max_connections=50 reached). Connection pool exhausted.",
        timestamp="2026-09-13T23:15:00Z",
        culprit="services/cache/redis_pool.py:88 in acquire_session_lock",
        stack_trace=[
            StackFrame(
                file="services/session/manager.py",
                line=62,
                function="handle_user_login",
                code="async with acquire_session_lock(user_id):"
            ),
            StackFrame(
                file="services/cache/redis_pool.py",
                line=88,
                function="acquire_session_lock",
                code="conn = await pool.get_connection()"
            )
        ]
    )
    s5_commits = [
        GitCommit(
            sha="d4e5f6a",
            author="DevOps Lead",
            message="perf(cache): reuse redis connection pool without closing connection context",
            timestamp="2026-09-13T23:02:00Z",  # 13 mins before alert
            files_changed=["services/cache/redis_pool.py"],
            diff_patch="""--- a/services/cache/redis_pool.py
+++ b/services/cache/redis_pool.py
@@ -85,4 +85,3 @@ async def acquire_session_lock(key):
     conn = await pool.get_connection()
-    try:
-        yield conn
-    finally:
-        await pool.release(conn)
+    return conn"""
        ),
        GitCommit(
            sha="77b8c9d",
            author="Frontend Engineer",
            message="style(navbar): increase avatar border radius",
            timestamp="2026-09-13T22:30:00Z",
            files_changed=["frontend/nav.css"],
            diff_patch=""
        )
    ]
    s5 = EvalScenario(
        id="scenario-5-redis-pool-leak",
        name="Async Redis Pool Leak (Resource Starvation)",
        description="NOTE FOR JUDGES: Refactoring removed the try/finally connection release block in services/cache/redis_pool.py, causing connections to leak under concurrent load until pool exhaustion (ConnectionError).",
        category="resource_leak",
        alert=s5_alert,
        commits=s5_commits,
        expected_culprit_sha="d4e5f6a",
        expected_min_confidence=0.70,
        expected_max_confidence=1.0,
        should_flag_human_review=False
    )

    return [s1, s2, s3, s4, s5]
