import json
import logging
import httpx

from app.config import settings
from app.llm.base import BaseLLMProvider
from app.llm.prompts import SYSTEM_PROMPT, build_user_prompt
from app.schemas import APIEndpoint, GeneratedTestCase, GeneratedTestCasesPayload

logger = logging.getLogger(__name__)


class OpenAIProvider(BaseLLMProvider):
    """
    LLM Provider integrating with OpenAI / OpenAI-compatible chat completions API.
    Enforces structured JSON output and validates results against Pydantic models.
    """

    def __init__(self, api_key: str | None = None, model: str | None = None, base_url: str | None = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL
        self.base_url = (base_url or settings.OPENAI_BASE_URL).rstrip("/")

    async def generate_test_cases(self, endpoint: APIEndpoint) -> list[GeneratedTestCase]:
        if not self.api_key:
            raise ValueError("OpenAI API key is missing. Set OPENAI_API_KEY or switch LLM_PROVIDER=mock.")

        endpoint_dict = endpoint.model_dump()
        user_prompt = build_user_prompt(endpoint_dict)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
            )

        if response.status_code != 200:
            logger.error(f"OpenAI API Error ({response.status_code}): {response.text}")
            raise RuntimeError(f"LLM API returned error status {response.status_code}: {response.text}")

        data = response.json()
        content = data["choices"][0]["message"]["content"]

        try:
            raw_json = json.loads(content)
            parsed_payload = GeneratedTestCasesPayload.model_validate(raw_json)
            return parsed_payload.tests
        except Exception as err:
            logger.warning(f"Failed to parse LLM JSON payload: {err}")
            raise ValueError(f"LLM output could not be validated against Pydantic schema: {str(err)}")
