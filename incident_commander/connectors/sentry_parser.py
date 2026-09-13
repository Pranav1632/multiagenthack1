import re
import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone
from ..types import SentryAlert, StackFrame
from .base import BaseSentryParser

class SentryParser(BaseSentryParser):
    def normalize_filepath(self, raw_path: str) -> str:
        """Strip deployment container prefixes to get clean repo relative path."""
        if not raw_path:
            return ""
        clean = raw_path.replace("\\", "/")
        # Strip container / app root prefixes
        prefixes = [
            r"^/app/",
            r"^/var/task/",
            r"^/usr/src/app/",
            r"^/var/www/",
            r"^webpack:///",
            r"^[a-zA-Z]:/[^/]+/"  # Windows drive e.g. C:/project/
        ]
        for p in prefixes:
            clean = re.sub(p, "", clean)
        return clean.strip("/")

    def parse(self, raw_data: Dict[str, Any]) -> SentryAlert:
        alert_id = raw_data.get("event_id") or raw_data.get("id") or f"alert-{uuid.uuid4().hex[:8]}"
        project = raw_data.get("project") or raw_data.get("service") or "unknown-service"
        
        # Extract error message and type
        error_type = "Error"
        message = "Unknown error occurred"
        culprit = raw_data.get("culprit")
        timestamp = raw_data.get("timestamp") or datetime.now(timezone.utc).isoformat()

        # Check standard Sentry event structure
        exception = raw_data.get("exception", {})
        if isinstance(exception, dict):
            values = exception.get("values", [])
            if values and isinstance(values, list):
                val = values[0]
                error_type = val.get("type", error_type)
                message = val.get("value", message)
                frames_raw = val.get("stacktrace", {}).get("frames", [])
            else:
                frames_raw = []
        else:
            frames_raw = []

        # Check direct fallback keys if simplified fixture
        if "error_type" in raw_data:
            error_type = raw_data["error_type"]
        if "message" in raw_data:
            message = raw_data["message"]
        if "stack_trace" in raw_data and isinstance(raw_data["stack_trace"], list):
            frames_raw = raw_data["stack_trace"]

        frames: List[StackFrame] = []
        for f in frames_raw:
            if isinstance(f, dict):
                raw_file = f.get("filename") or f.get("file") or f.get("abs_path") or ""
                clean_file = self.normalize_filepath(raw_file)
                line = int(f.get("lineno") or f.get("line") or 0)
                fn = f.get("function") or f.get("method") or "anonymous"
                code = f.get("context_line") or f.get("code")
                frames.append(StackFrame(
                    file=clean_file,
                    line=line,
                    function=fn,
                    code=code
                ))

        if not culprit and frames:
            innermost = frames[-1]
            culprit = f"{innermost.file}:{innermost.line} in {innermost.function}"

        return SentryAlert(
            alert_id=alert_id,
            project=project,
            error_type=error_type,
            message=message,
            timestamp=timestamp,
            culprit=culprit,
            stack_trace=frames,
            raw_payload=raw_data
        )

sentry_parser = SentryParser()
