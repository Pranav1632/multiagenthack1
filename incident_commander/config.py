import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    @property
    def OLLAMA_BASE_URL(self) -> str:
        return os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    @property
    def OLLAMA_MODEL(self) -> str:
        return os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

    @property
    def GEMINI_API_KEY(self) -> str:
        return os.getenv("GEMINI_API_KEY", "")

    @property
    def LINEAR_API_KEY(self) -> str:
        return os.getenv("LINEAR_API_KEY", "")

    @property
    def LINEAR_TEAM_ID(self) -> str:
        return os.getenv("LINEAR_TEAM_ID", "PRA")

    @property
    def SLACK_BOT_TOKEN(self) -> str:
        return os.getenv("SLACK_BOT_TOKEN", "")

    @property
    def GITHUB_TOKEN(self) -> str:
        return os.getenv("GITHUB_TOKEN", "")

    @property
    def GITHUB_DEFAULT_REPO(self) -> str:
        return os.getenv("GITHUB_DEFAULT_REPO", "Pranav1632/multiagenthack1")

    @property
    def LIVE_API_MODE(self) -> bool:
        return os.getenv("LIVE_API_MODE", "false").lower() in ("true", "1", "yes")

    @property
    def DATABASE_PATH(self) -> str:
        return str(BASE_DIR / os.getenv("DATABASE_PATH", "data/incidents.db"))

    def reload(self):
        load_dotenv(BASE_DIR / ".env", override=True)

    def get_status(self) -> dict:
        return {
            "ollama": {
                "base_url": self.OLLAMA_BASE_URL,
                "model": self.OLLAMA_MODEL,
                "available": True
            },
            "github": {
                "configured": bool(self.GITHUB_TOKEN),
                "live_mode": self.LIVE_API_MODE and bool(self.GITHUB_TOKEN)
            },
            "slack": {
                "configured": bool(self.SLACK_BOT_TOKEN),
                "live_mode": self.LIVE_API_MODE and bool(self.SLACK_BOT_TOKEN)
            },
            "linear": {
                "configured": bool(self.LINEAR_API_KEY),
                "team_id": self.LINEAR_TEAM_ID,
                "live_mode": self.LIVE_API_MODE and bool(self.LINEAR_API_KEY)
            }
        }

settings = Settings()
