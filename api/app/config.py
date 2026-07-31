import os


class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME") or "TestPilot"
    API_V1_STR: str = os.getenv("API_V1_STR") or "/api"

    DATABASE_URL: str = os.getenv("DATABASE_URL") or "sqlite+aiosqlite:///./testpilot.db"
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER") or "mock"
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY") or None
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL") or "gpt-4o"
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL") or "https://api.openai.com/v1"

    ALLOW_LOCAL_TARGETS: bool = (
        os.getenv("ALLOW_LOCAL_TARGETS", "true").lower() in ("true", "1", "yes")
        if os.getenv("ALLOW_LOCAL_TARGETS")
        else True
    )
    MAX_UPLOAD_SIZE_MB: int = (
        int(os.getenv("MAX_UPLOAD_SIZE_MB"))
        if os.getenv("MAX_UPLOAD_SIZE_MB") and os.getenv("MAX_UPLOAD_SIZE_MB").isdigit()
        else 10
    )
    HTTP_TIMEOUT_SECONDS: float = 30.0

    def __init__(self):
        timeout_env = os.getenv("HTTP_TIMEOUT_SECONDS")
        if timeout_env:
            try:
                self.HTTP_TIMEOUT_SECONDS = float(timeout_env)
            except Exception:
                self.HTTP_TIMEOUT_SECONDS = 30.0

    def get_database_url(self) -> str:
        if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
            return "sqlite+aiosqlite:////tmp/testpilot.db"
        return self.DATABASE_URL


settings = Settings()
