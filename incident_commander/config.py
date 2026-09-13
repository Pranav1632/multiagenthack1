import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    # Model configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Linear configuration
    LINEAR_API_KEY: str = os.getenv("LINEAR_API_KEY", "")
    LINEAR_TEAM_ID: str = os.getenv("LINEAR_TEAM_ID", "PRA")

    # Slack configuration
    SLACK_BOT_TOKEN: str = os.getenv("SLACK_BOT_TOKEN", "")

    # GitHub configuration
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    GITHUB_DEFAULT_REPO: str = os.getenv("GITHUB_DEFAULT_REPO", "owner/repo")

    # App flags
    LIVE_API_MODE: bool = os.getenv("LIVE_API_MODE", "false").lower() in ("true", "1", "yes")
    DATABASE_PATH: str = str(BASE_DIR / os.getenv("DATABASE_PATH", "data/incidents.db"))

    @classmethod
    def get_status(cls) -> dict:
        return {
            "ollama": {
                "base_url": cls.OLLAMA_BASE_URL,
                "model": cls.OLLAMA_MODEL,
                "available": True  # Will be verified dynamically
            },
            "github": {
                "configured": bool(cls.GITHUB_TOKEN),
                "live_mode": cls.LIVE_API_MODE and bool(cls.GITHUB_TOKEN)
            },
            "slack": {
                "configured": bool(cls.SLACK_BOT_TOKEN),
                "live_mode": cls.LIVE_API_MODE and bool(cls.SLACK_BOT_TOKEN)
            },
            "linear": {
                "configured": bool(cls.LINEAR_API_KEY),
                "team_id": cls.LINEAR_TEAM_ID,
                "live_mode": cls.LIVE_API_MODE and bool(cls.LINEAR_API_KEY)
            }
        }

settings = Settings()
