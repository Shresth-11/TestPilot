import logging
from app.config import settings
from app.llm.base import BaseLLMProvider
from app.llm.mock_provider import MockLLMProvider
from app.llm.openai_provider import OpenAIProvider
from app.schemas import APIEndpoint, GeneratedTestCase

logger = logging.getLogger(__name__)


class TestGenerator:
    """Orchestrates LLM test case generation with safe retries and mock fallbacks."""

    def __init__(self, provider: BaseLLMProvider | None = None):
        if provider:
            self.provider = provider
        elif settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            self.provider = OpenAIProvider()
        else:
            self.provider = MockLLMProvider()

    async def generate_tests(self, endpoint: APIEndpoint) -> list[GeneratedTestCase]:
        """Generate test cases for an API endpoint using the configured LLM with fallback safety."""
        try:
            tests = await self.provider.generate_test_cases(endpoint)
            if tests:
                return tests
        except Exception as err:
            logger.warning(
                f"LLM provider ({self.provider.__class__.__name__}) failed: {err}. Falling back to MockLLMProvider."
            )

        # Fallback to MockLLMProvider to guarantee valid test generation
        mock_fallback = MockLLMProvider()
        return await mock_fallback.generate_test_cases(endpoint)
