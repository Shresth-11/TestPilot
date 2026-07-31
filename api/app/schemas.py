from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field, ConfigDict


# --- OpenAPI Normalized Domain Schemas ---

class APIParameter(BaseModel):
    name: str
    location: str = Field(alias="in", default="query")
    required: bool = False
    param_type: str = "string"
    description: str | None = None
    schema_def: dict[str, Any] | None = None

    model_config = ConfigDict(populate_by_name=True)


class RequestSchema(BaseModel):
    content_type: str = "application/json"
    schema_def: dict[str, Any] = Field(default_factory=dict)
    example: Any | None = None


class ResponseSchema(BaseModel):
    status_code: int
    description: str = ""
    schema_def: dict[str, Any] = Field(default_factory=dict)


class SecurityScheme(BaseModel):
    type: str = "apiKey"
    scheme: str | None = None
    bearer_format: str | None = None


class APIEndpoint(BaseModel):
    path: str
    method: str
    summary: str | None = None
    description: str | None = None
    parameters: list[APIParameter] = Field(default_factory=list)
    request_body: RequestSchema | None = None
    responses: list[ResponseSchema] = Field(default_factory=list)
    security: list[dict[str, Any]] = Field(default_factory=list)


# --- AI Test Generation Schemas ---

class Assertion(BaseModel):
    type: Literal["status_code", "header_exists", "json_field_equals", "json_field_exists", "response_time_below", "json_field_type"]
    target: str = ""
    operator: str = "equals"
    expected_value: Any = None


class GeneratedTestCase(BaseModel):
    name: str
    description: str = ""
    category: Literal["functional", "negative", "edge", "security"]
    method: str
    endpoint: str
    headers: dict[str, Any] = Field(default_factory=dict)
    query_params: dict[str, Any] = Field(default_factory=dict)
    path_params: dict[str, Any] = Field(default_factory=dict)
    body: dict[str, Any] | None = None
    expected_status_code: int = 200
    expected_response_schema: dict[str, Any] | None = None
    assertions: list[Assertion] = Field(default_factory=list)
    priority: Literal["low", "medium", "high"] = "medium"


class GeneratedTestCasesPayload(BaseModel):
    tests: list[GeneratedTestCase]


# --- TestCase Schemas ---

class TestCaseCreate(GeneratedTestCase):
    project_id: str
    endpoint_id: str | None = None


class TestCaseUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    headers: dict[str, Any] | None = None
    query_params: dict[str, Any] | None = None
    path_params: dict[str, Any] | None = None
    body: dict[str, Any] | None = None
    expected_status_code: int | None = None
    assertions: list[Assertion] | None = None
    priority: Literal["low", "medium", "high"] | None = None
    status: str | None = None


class TestCaseResponse(GeneratedTestCase):
    id: str
    project_id: str
    endpoint_id: str | None = None
    endpoint: str = Field(default="", validation_alias="endpoint_path")
    endpoint_path: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# --- Execution Schemas ---

class TestExecutionResult(BaseModel):
    test_id: str
    run_id: str | None = None
    status: Literal["passed", "failed", "skipped", "error"]
    actual_status_code: int | None = None
    expected_status_code: int
    response_time_ms: float = 0.0
    response_headers: dict[str, Any] | None = None
    response_body: Any | None = None
    assertions_passed: int = 0
    assertions_failed: int = 0
    error: str | None = None
    screenshot_path: str | None = None
    executed_at: datetime = Field(default_factory=datetime.now)


class TestRunResponse(BaseModel):
    id: str
    project_id: str
    status: str
    total_tests: int
    passed: int
    failed: int
    skipped: int
    duration_ms: float
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    results: list[TestExecutionResult] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# --- Evaluation & Coverage Schemas ---

class EvaluationScores(BaseModel):
    test_id: str
    correctness: float
    consistency: float
    coverage: float
    usability: float
    overall_score: float
    feedback: dict[str, Any] = Field(default_factory=dict)


class CoverageMetrics(BaseModel):
    total_endpoints: int = 0
    tested_endpoints: int = 0
    endpoint_coverage_pct: float = 0.0

    total_methods: int = 0
    tested_methods: int = 0
    method_coverage_pct: float = 0.0

    total_parameters: int = 0
    tested_parameters: int = 0
    parameter_coverage_pct: float = 0.0

    response_schema_coverage_pct: float = 0.0
    negative_test_coverage_pct: float = 0.0


# --- Project & Spec Schemas ---

class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    base_url: str | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    base_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class APISpecCreate(BaseModel):
    raw_spec: str
    format: Literal["json", "yaml"] = "json"


class APISpecResponse(BaseModel):
    id: str
    project_id: str
    title: str
    version: str
    spec_format: str
    created_at: datetime
    endpoint_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class EndpointResponse(BaseModel):
    id: str
    spec_id: str
    project_id: str
    path: str
    method: str
    summary: str | None = None
    description: str | None = None
    parameters: list[dict[str, Any]] = Field(default_factory=list)
    request_body: dict[str, Any] | None = None
    responses: dict[str, Any] = Field(default_factory=dict)
    security: list[dict[str, Any]] = Field(default_factory=list)
    test_case_count: int = 0

    model_config = ConfigDict(from_attributes=True)
