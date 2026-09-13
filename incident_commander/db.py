import sqlite3
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from .config import settings
from .types import IncidentResult, EvalScorecard

def get_connection() -> sqlite3.Connection:
    db_path = Path(settings.DATABASE_PATH)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        project TEXT NOT NULL,
        error_type TEXT NOT NULL,
        error_message TEXT NOT NULL,
        culprit TEXT,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL,
        top_commit_sha TEXT,
        confidence REAL,
        hypothesis TEXT,
        slack_channel TEXT,
        linear_ticket_id TEXT,
        linear_ticket_url TEXT,
        patch_diff TEXT,
        raw_result_json TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS eval_runs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        total_cases INTEGER NOT NULL,
        passed_cases INTEGER NOT NULL,
        top1_accuracy REAL NOT NULL,
        mean_reciprocal_rank REAL NOT NULL,
        brier_score REAL NOT NULL,
        summary_json TEXT NOT NULL
    );
    """)
    conn.commit()
    conn.close()

def save_incident(result: IncidentResult):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO incidents (
        id, project, error_type, error_message, culprit, created_at, status,
        top_commit_sha, confidence, hypothesis, slack_channel,
        linear_ticket_id, linear_ticket_url, patch_diff, raw_result_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        result.incident_id,
        result.project,
        result.error_type,
        result.error_message,
        result.candidate_commits[0].sha if result.candidate_commits else None,
        result.created_at,
        result.status,
        result.top_hypothesis.culprit_sha,
        result.top_hypothesis.confidence,
        result.top_hypothesis.hypothesis,
        result.slack.channel_name,
        result.linear.ticket_key,
        result.linear.url,
        result.top_hypothesis.surgical_patch,
        result.model_dump_json()
    ))
    conn.commit()
    conn.close()

def get_incidents(limit: int = 20) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_incident_by_id(incident_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def save_eval_run(scorecard: EvalScorecard):
    conn = get_connection()
    cursor = conn.cursor()
    import uuid
    run_id = f"eval-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
    INSERT INTO eval_runs (
        id, timestamp, total_cases, passed_cases, top1_accuracy,
        mean_reciprocal_rank, brier_score, summary_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        run_id,
        scorecard.run_timestamp,
        scorecard.total_cases,
        scorecard.passed_cases,
        scorecard.top1_accuracy,
        scorecard.mean_reciprocal_rank,
        scorecard.brier_score,
        scorecard.model_dump_json()
    ))
    conn.commit()
    conn.close()
    return run_id

def get_latest_eval_run() -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM eval_runs ORDER BY timestamp DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

# Auto-initialize DB on import
init_db()
