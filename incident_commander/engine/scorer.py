import math
import re
from datetime import datetime, timezone
from typing import List, Tuple
from ..types import SentryAlert, GitCommit, CandidateScore

class CorrelationScorer:
    def parse_iso(self, ts_str: str) -> datetime:
        try:
            # Clean trailing Z for fromisoformat compatibility
            clean = ts_str.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            return datetime.now(timezone.utc)

    def calculate_time_score(self, alert_time: datetime, commit_time: datetime, decay_lambda: float = 0.02) -> float:
        """
        Time proximity score:
        Delta t in minutes.
        If commit was after alert, score is 0.0.
        Otherwise exp(-lambda * delta_minutes).
        """
        delta_seconds = (alert_time - commit_time).total_seconds()
        if delta_seconds < -60:  # Commit happened >1 min after alert
            return 0.0
        
        delta_minutes = max(0.0, delta_seconds / 60.0)
        # 0 mins -> 1.0, 10 mins -> 0.82, 30 mins -> 0.55, 60 mins -> 0.30
        return math.exp(-decay_lambda * delta_minutes)

    def calculate_path_score(self, alert: SentryAlert, commit: GitCommit) -> Tuple[float, bool]:
        """
        Computes Jaccard overlap between commit files and stack trace files.
        Grants a high-priority boost if the innermost crash frame matches.
        """
        if not commit.files_changed or not alert.stack_trace:
            return 0.0, False

        stack_files = {f.file.lower() for f in alert.stack_trace if f.file}
        commit_files = {f.lower() for f in commit.files_changed if f}

        if not stack_files or not commit_files:
            return 0.0, False

        # Jaccard overlap
        intersection = stack_files.intersection(commit_files)
        union = stack_files.union(commit_files)
        jaccard = len(intersection) / len(union) if union else 0.0

        # Check innermost crash frame
        innermost_file = alert.stack_trace[-1].file.lower() if alert.stack_trace else ""
        innermost_match = False
        for cf in commit_files:
            if innermost_file and (innermost_file in cf or cf in innermost_file):
                innermost_match = True
                break

        score = jaccard
        if innermost_match:
            score = max(score, 0.85)

        return min(1.0, score), innermost_match

    def calculate_line_score(self, alert: SentryAlert, commit: GitCommit) -> float:
        """
        Extracts line numbers from git diff hunks and checks proximity to crash line.
        """
        if not alert.stack_trace or not commit.diff_patch:
            return 0.0

        crash_line = alert.stack_trace[-1].line
        if crash_line <= 0:
            return 0.0

        # Parse diff hunk line headers: @@ -10,6 +15,9 @@
        hunk_pattern = re.compile(r"@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@")
        matches = hunk_pattern.findall(commit.diff_patch)
        
        min_distance = 999999
        for start_str, count_str in matches:
            start_line = int(start_str)
            count = int(count_str) if count_str else 1
            end_line = start_line + count

            if start_line <= crash_line <= end_line:
                return 1.0  # Exact hunk overlap
            
            dist = min(abs(crash_line - start_line), abs(crash_line - end_line))
            if dist < min_distance:
                min_distance = dist

        if min_distance <= 15:
            return 0.9
        elif min_distance <= 50:
            return 0.5
        elif min_distance <= 100:
            return 0.2
        return 0.0

    def calculate_diff_heuristic_score(self, commit: GitCommit) -> float:
        """
        Detects risky semantic patterns in diff:
        - Removed null guards / safe get
        - Added exceptions
        - Altered timeouts / TTL
        """
        patch = commit.diff_patch
        if not patch:
            return 0.0

        score = 0.1  # baseline for having a diff
        # Check removed lines (starting with - but not ---)
        removed_lines = [l[1:].strip() for l in patch.splitlines() if l.startswith("-") and not l.startswith("---")]
        for line in removed_lines:
            if ".get(" in line or "if " in line or "None" in line or "try:" in line:
                score += 0.35  # removed safety check!
            if "timeout" in line.lower() or "ttl" in line.lower():
                score += 0.30

        return min(1.0, score)

    def score_candidates(
        self,
        alert: SentryAlert,
        commits: List[GitCommit],
        weights: Tuple[float, float, float, float] = (0.30, 0.35, 0.20, 0.15)
    ) -> List[CandidateScore]:
        """
        Rank all candidate commits by composite score.
        """
        w_time, w_path, w_line, w_diff = weights
        alert_time = self.parse_iso(alert.timestamp)
        scored: List[CandidateScore] = []

        for c in commits:
            commit_time = self.parse_iso(c.timestamp)
            s_time = self.calculate_time_score(alert_time, commit_time)
            s_path, innermost_hit = self.calculate_path_score(alert, c)
            s_line = self.calculate_line_score(alert, c) if innermost_hit else 0.0
            s_diff = self.calculate_diff_heuristic_score(c)

            total = (w_time * s_time) + (w_path * s_path) + (w_line * s_line) + (w_diff * s_diff)

            diff_snippet = c.diff_patch[:300] + ("..." if len(c.diff_patch) > 300 else "")

            scored.append(CandidateScore(
                sha=c.sha,
                author=c.author,
                message=c.message,
                timestamp=c.timestamp,
                time_score=round(s_time, 3),
                path_score=round(s_path, 3),
                line_score=round(s_line, 3),
                diff_score=round(s_diff, 3),
                total_score=round(total, 3),
                diff_snippet=diff_snippet
            ))

        # Sort descending by total score
        scored.sort(key=lambda x: x.total_score, reverse=True)
        return scored

correlation_scorer = CorrelationScorer()
