import json
import logging
import time
from typing import Any
import httpx

from app.config import settings
from app.runners.base import BaseRunner
from app.schemas import Assertion, TestCaseResponse, TestExecutionResult
from app.security import validate_target_url

logger = logging.getLogger(__name__)


class HTTPTestRunner(BaseRunner):
    """Executes HTTP API test cases using httpx, measuring performance and verifying assertions."""

    async def run(self, test_case: TestCaseResponse | Any, base_url: str) -> TestExecutionResult:
        # Build target URL by combining base_url and path_params
        endpoint_path = getattr(test_case, "endpoint_path", getattr(test_case, "endpoint", ""))
        headers = dict(getattr(test_case, "headers", {}) or {})
        query_params = dict(getattr(test_case, "query_params", {}) or {})
        path_params = dict(getattr(test_case, "path_params", {}) or {})
        body = getattr(test_case, "body", None)
        method = getattr(test_case, "method", "GET").upper()
        expected_status = getattr(test_case, "expected_status_code", 200)
        assertions: list[Assertion] = [
            a if isinstance(a, Assertion) else Assertion(**a)
            for a in (getattr(test_case, "assertions", []) or [])
        ]
        test_id = getattr(test_case, "id", "adhoc_test")

        # Interpolate path params into endpoint path
        target_path = endpoint_path
        for k, v in path_params.items():
            target_path = target_path.replace(f"{{{k}}}", str(v))

        full_url = base_url.rstrip("/") + "/" + target_path.lstrip("/")

        # Validate URL for SSRF protection
        try:
            validate_target_url(full_url)
        except ValueError as err:
            return TestExecutionResult(
                test_id=test_id,
                status="error",
                expected_status_code=expected_status,
                error=f"SSRF Prevention: {str(err)}",
            )

        start_time = time.perf_counter()
        actual_status = None
        response_headers = None
        response_body = None
        error_msg = None

        try:
            async with httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT_SECONDS) as client:
                res = await client.request(
                    method=method,
                    url=full_url,
                    headers=headers if headers else None,
                    params=query_params if query_params else None,
                    json=body if body and isinstance(body, (dict, list)) else None,
                    content=body if isinstance(body, str) else None,
                )
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                actual_status = res.status_code
                response_headers = dict(res.headers)

                try:
                    response_body = res.json()
                except Exception:
                    response_body = res.text

        except httpx.TimeoutException:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            error_msg = f"Test execution timed out after {settings.HTTP_TIMEOUT_SECONDS} seconds."
        except httpx.RequestError as err:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            error_msg = f"Connection error calling {full_url}: {str(err)}"
        except Exception as err:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            error_msg = f"Unexpected execution error: {str(err)}"

        if error_msg:
            return TestExecutionResult(
                test_id=test_id,
                status="failed",
                actual_status_code=actual_status,
                expected_status_code=expected_status,
                response_time_ms=elapsed_ms,
                response_headers=response_headers,
                response_body=response_body,
                assertions_passed=0,
                assertions_failed=len(assertions) or 1,
                error=error_msg,
            )

        # Assertion evaluation
        passed_count = 0
        failed_count = 0
        assertion_failures = []

        # Default status code check if no status_code assertion is present
        has_status_assertion = any(a.type == "status_code" for a in assertions)
        if not has_status_assertion:
            if actual_status == expected_status:
                passed_count += 1
            else:
                failed_count += 1
                assertion_failures.append(
                    f"Expected status code {expected_status}, but received {actual_status}."
                )

        for assertion in assertions:
            is_pass, reason = self._evaluate_assertion(assertion, actual_status, elapsed_ms, response_headers, response_body)
            if is_pass:
                passed_count += 1
            else:
                failed_count += 1
                assertion_failures.append(reason)

        overall_status = "passed" if failed_count == 0 else "failed"
        combined_error = "; ".join(assertion_failures) if assertion_failures else None

        return TestExecutionResult(
            test_id=test_id,
            status=overall_status,
            actual_status_code=actual_status,
            expected_status_code=expected_status,
            response_time_ms=elapsed_ms,
            response_headers=response_headers,
            response_body=response_body,
            assertions_passed=passed_count,
            assertions_failed=failed_count,
            error=combined_error,
        )

    def _evaluate_assertion(
        self,
        assertion: Assertion,
        actual_status: int | None,
        elapsed_ms: float,
        headers: dict | None,
        body: Any,
    ) -> tuple[bool, str]:
        a_type = assertion.type
        exp_val = assertion.expected_value

        if a_type == "status_code":
            if actual_status == int(exp_val):
                return True, ""
            return False, f"Assertion failed: expected status code {exp_val}, got {actual_status}."

        if a_type == "response_time_below":
            if elapsed_ms < float(exp_val):
                return True, ""
            return False, f"Assertion failed: response time {elapsed_ms:.1f}ms exceeded limit {exp_val}ms."

        if a_type == "header_exists":
            header_name = assertion.target.lower()
            if headers and any(h.lower() == header_name for h in headers.keys()):
                return True, ""
            return False, f"Assertion failed: header '{assertion.target}' was not present in response."

        if a_type in ("json_field_equals", "json_field_exists", "json_field_type"):
            if not isinstance(body, dict):
                return False, f"Assertion failed: response body is not a JSON object (got {type(body).__name__})."

            val = self._extract_json_field(body, assertion.target)
            if a_type == "json_field_exists":
                if val is not None:
                    return True, ""
                return False, f"Assertion failed: field '{assertion.target}' not found in response JSON."

            if a_type == "json_field_equals":
                if str(val) == str(exp_val):
                    return True, ""
                return False, f"Assertion failed: field '{assertion.target}' expected '{exp_val}', got '{val}'."

            if a_type == "json_field_type":
                expected_type = str(exp_val).lower()
                actual_type = type(val).__name__
                if actual_type == expected_type:
                    return True, ""
                return False, f"Assertion failed: field '{assertion.target}' expected type '{expected_type}', got '{actual_type}'."

        return True, ""

    def _extract_json_field(self, data: dict, field_path: str) -> Any:
        parts = field_path.split(".")
        curr = data
        for p in parts:
            if isinstance(curr, dict) and p in curr:
                curr = curr[p]
            else:
                return None
        return curr
