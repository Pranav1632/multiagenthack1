from incident_commander.connectors.sentry_parser import sentry_parser

def test_normalize_filepath():
    assert sentry_parser.normalize_filepath("/app/services/payments/webhook.py") == "services/payments/webhook.py"
    assert sentry_parser.normalize_filepath("/var/task/handler.py") == "handler.py"
    assert sentry_parser.normalize_filepath("C:/project/src/main.py") == "src/main.py"

def test_parse_simple_alert():
    raw = {
        "event_id": "test-123",
        "project": "billing-service",
        "error_type": "KeyError",
        "message": "KeyError: 'billing_address'",
        "timestamp": "2026-09-13T17:06:00Z",
        "stack_trace": [
            {"file": "/app/services/payments/router.py", "line": 45, "function": "stripe_webhook_endpoint"},
            {"file": "/app/services/payments/processor.py", "line": 142, "function": "handle_stripe_webhook", "code": "country = payload['customer']['billing_address']"}
        ]
    }
    alert = sentry_parser.parse(raw)
    assert alert.alert_id == "test-123"
    assert alert.project == "billing-service"
    assert alert.error_type == "KeyError"
    assert len(alert.stack_trace) == 2
    assert alert.stack_trace[1].file == "services/payments/processor.py"
    assert alert.stack_trace[1].line == 142
    assert "processor.py:142 in handle_stripe_webhook" in alert.culprit
