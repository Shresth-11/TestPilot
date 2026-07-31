from abc import ABC, abstractmethod
from app.schemas import APIEndpoint, GeneratedTestCase


class BaseLLMProvider(ABC):
    """Abstract base class for LLM test generation providers."""

    @abstractmethod
    async def generate_test_cases(self, endpoint: APIEndpoint) -> list[GeneratedTestCase]:
        """Generate test cases for a given API endpoint definition."""
        pass
