import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import (
    coverage,
    endpoints,
    evaluation,
    execution,
    health,
    projects,
    runs,
    specs,
    test_cases,
    test_generation,
)
from app.config import settings
from app.database import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting TestPilot Backend Service...")
    try:
        await init_db()
    except Exception as e:
        logger.warning(f"Database init warning on startup: {e}")
    yield
    logger.info("Shutting down TestPilot Backend Service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler for uniform error JSON formatting
@app.exception_handler(Exception)
async def custom_exception_handler(request: Request, exc: Exception):
    status_code = getattr(exc, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
    detail = getattr(exc, "detail", str(exc))

    error_code = "INTERNAL_SERVER_ERROR"
    if status_code == 404:
        error_code = "RESOURCE_NOT_FOUND"
    elif status_code == 400:
        error_code = "BAD_REQUEST"
    elif status_code == 422:
        error_code = "VALIDATION_ERROR"

    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": error_code,
                "message": detail,
                "details": {},
            }
        },
    )

# Include all API routers with both /api and root prefixes for universal hosting compatibility
routers = [
    health.router,
    projects.router,
    specs.router,
    endpoints.router,
    test_generation.router,
    test_cases.router,
    execution.router,
    runs.router,
    evaluation.router,
    coverage.router,
]

for r in routers:
    app.include_router(r, prefix="")
    app.include_router(r, prefix="/api")
