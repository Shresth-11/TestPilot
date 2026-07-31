from abc import ABC, abstractmethod
from typing import Any
from app.schemas import TestExecutionResult


class BaseRunner(ABC):
    """Abstract base runner for executing test cases."""

    @abstractmethod
    async def run(self, test_case: Any, base_url: str) -> TestExecutionResult:
        pass
