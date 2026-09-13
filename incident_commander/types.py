from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class StackFrame(BaseModel):
    file: str
    line: int
    function: str
    code: Optional[str] = None

class SentryAlert(BaseModel):
    alert_id: str
    project: str
    error_type: str
    message: str
    timestamp: str  # ISO 8601 string
    culprit: Optional[str] = None
    stack_trace: List[StackFrame] = Field(default_factory=list)
    raw_payload: Optional[Dict[str, Any]] = None

class GitCommit(BaseModel):
    sha: str
    author: str
    message: str
    timestamp: str  # ISO 8601 string
    files_changed: List[str] = Field(default_factory=list)
    diff_patch: str = ""
    url: Optional[str] = None

class CandidateScore(BaseModel):
    sha: str
    author: str
    message: str
    timestamp: str
    time_score: float
    path_score: float
    line_score: float
    diff_score: float
    total_score: float
    diff_snippet: str = ""

class RootCauseHypothesis(BaseModel):
    culprit_sha: Optional[str] = None
    confidence: float  # 0.0 to 1.0
    hypothesis: str
    evidence: List[str] = Field(default_factory=list)
    surgical_patch: Optional[str] = None
    recommended_action: str
    needs_human_review: bool = False
    is_external_outage: bool = False

class SlackCardOutput(BaseModel):
    channel_id: str
    channel_name: str
    message_ts: Optional[str] = None
    blocks: List[Dict[str, Any]] = Field(default_factory=list)
    web_url: str = ""
    is_live: bool = False

class LinearTicketOutput(BaseModel):
    ticket_id: str
    ticket_key: str
    title: str
    url: str
    priority: int
    body_markdown: str
    is_live: bool = False

class GitHubPROutput(BaseModel):
    pr_number: Optional[int] = None
    pr_url: Optional[str] = None
    branch_name: str
    title: str
    is_live: bool = False

class IncidentResult(BaseModel):
    incident_id: str
    project: str
    error_type: str
    error_message: str
    created_at: str
    status: str = "investigating"
    candidate_commits: List[CandidateScore] = Field(default_factory=list)
    top_hypothesis: RootCauseHypothesis
    slack: SlackCardOutput
    linear: LinearTicketOutput
    github_pr: Optional[GitHubPROutput] = None
    execution_time_ms: float = 0.0

class EvalScenario(BaseModel):
    id: str
    name: str
    description: str
    category: str  # "direct_bug", "config_drift", "multi_commit_noise", "infra_outage"
    alert: SentryAlert
    commits: List[GitCommit]
    expected_culprit_sha: Optional[str] = None
    expected_min_confidence: float = 0.0
    expected_max_confidence: float = 1.0
    should_flag_human_review: bool = False

class EvalResult(BaseModel):
    scenario_id: str
    name: str
    category: str
    passed: bool
    predicted_sha: Optional[str] = None
    expected_sha: Optional[str] = None
    confidence: float
    latency_ms: float
    notes: str = ""

class EvalScorecard(BaseModel):
    total_cases: int
    passed_cases: int
    top1_accuracy: float
    mean_reciprocal_rank: float
    brier_score: float
    results: List[EvalResult]
    run_timestamp: str
