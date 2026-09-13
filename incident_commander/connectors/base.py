from abc import ABC, abstractmethod
from typing import List, Optional
from ..types import SentryAlert, GitCommit, RootCauseHypothesis, SlackCardOutput, LinearTicketOutput, GitHubPROutput

class BaseSentryParser(ABC):
    @abstractmethod
    def parse(self, raw_data: dict) -> SentryAlert:
        pass

class BaseGitHubConnector(ABC):
    @abstractmethod
    async def get_recent_commits(self, repo: str, since_timestamp: Optional[str] = None, limit: int = 10) -> List[GitCommit]:
        pass

    @abstractmethod
    async def create_hotfix_pr(self, repo: str, title: str, branch_name: str, patch_diff: str, body: str) -> GitHubPROutput:
        pass

class BaseSlackConnector(ABC):
    @abstractmethod
    async def create_incident_channel_and_notify(
        self,
        service: str,
        alert: SentryAlert,
        hypothesis: RootCauseHypothesis,
        linear_ticket: Optional[LinearTicketOutput] = None
    ) -> SlackCardOutput:
        pass

class BaseLinearConnector(ABC):
    @abstractmethod
    async def create_incident_ticket(
        self,
        alert: SentryAlert,
        hypothesis: RootCauseHypothesis,
        slack_channel: Optional[str] = None
    ) -> LinearTicketOutput:
        pass
