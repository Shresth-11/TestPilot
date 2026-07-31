import logging
from typing import Any
import httpx

from app.schemas import TestExecutionResult

logger = logging.getLogger(__name__)


class ReusableWorkflows:
    """Reusable API test workflows for Auth, CRUD, and critical user journeys."""

    @staticmethod
    async def run_auth_login_flow(
        base_url: str,
        login_path: str = "/auth/login",
        username: str = "admin@example.com",
        password: str = "password123",
    ) -> tuple[bool, str | None]:
        """Performs login and extracts access token."""
        full_url = base_url.rstrip("/") + "/" + login_path.lstrip("/")
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.post(full_url, json={"username": username, "password": password})
                if res.status_code == 200:
                    data = res.json()
                    token = data.get("access_token") or data.get("token")
                    return True, token
                return False, None
            except Exception as err:
                logger.error(f"Auth login workflow failed: {err}")
                return False, None

    @staticmethod
    async def run_crud_sequence(
        base_url: str,
        resource_path: str = "/users",
        create_payload: dict[str, Any] | None = None,
        update_payload: dict[str, Any] | None = None,
    ) -> list[TestExecutionResult]:
        """Executes a full CRUD sequence (Create -> Retrieve -> Update -> Delete)."""
        results: list[TestExecutionResult] = []
        payload = create_payload or {"name": "Test User", "email": "testuser@example.com"}
        up_payload = update_payload or {"name": "Updated Test User", "email": "updated@example.com"}

        created_id = None
        base_endpoint = base_url.rstrip("/") + "/" + resource_path.lstrip("/")

        async with httpx.AsyncClient(timeout=10.0) as client:
            # 1. CREATE
            try:
                c_res = await client.post(base_endpoint, json=payload)
                if c_res.status_code in (200, 201):
                    data = c_res.json()
                    created_id = data.get("id")
                    results.append(
                        TestExecutionResult(
                            test_id="crud_create",
                            status="passed",
                            actual_status_code=c_res.status_code,
                            expected_status_code=201,
                            assertions_passed=1,
                        )
                    )
                else:
                    results.append(
                        TestExecutionResult(
                            test_id="crud_create",
                            status="failed",
                            actual_status_code=c_res.status_code,
                            expected_status_code=201,
                            error=f"Create step failed with status {c_res.status_code}",
                        )
                    )
            except Exception as err:
                results.append(
                    TestExecutionResult(
                        test_id="crud_create",
                        status="error",
                        expected_status_code=201,
                        error=f"Create step request error: {str(err)}",
                    )
                )

            if not created_id:
                return results

            # 2. RETRIEVE
            try:
                r_res = await client.get(f"{base_endpoint}/{created_id}")
                status = "passed" if r_res.status_code == 200 else "failed"
                results.append(
                    TestExecutionResult(
                        test_id="crud_retrieve",
                        status=status,
                        actual_status_code=r_res.status_code,
                        expected_status_code=200,
                        assertions_passed=1 if status == "passed" else 0,
                        assertions_failed=0 if status == "passed" else 1,
                    )
                )
            except Exception as err:
                results.append(
                    TestExecutionResult(
                        test_id="crud_retrieve",
                        status="error",
                        expected_status_code=200,
                        error=f"Retrieve step error: {str(err)}",
                    )
                )

            # 3. UPDATE
            try:
                u_res = await client.put(f"{base_endpoint}/{created_id}", json=up_payload)
                status = "passed" if u_res.status_code in (200, 204) else "failed"
                results.append(
                    TestExecutionResult(
                        test_id="crud_update",
                        status=status,
                        actual_status_code=u_res.status_code,
                        expected_status_code=200,
                        assertions_passed=1 if status == "passed" else 0,
                    )
                )
            except Exception as err:
                results.append(
                    TestExecutionResult(
                        test_id="crud_update",
                        status="error",
                        expected_status_code=200,
                        error=f"Update step error: {str(err)}",
                    )
                )

            # 4. DELETE
            try:
                d_res = await client.delete(f"{base_endpoint}/{created_id}")
                status = "passed" if d_res.status_code in (200, 204) else "failed"
                results.append(
                    TestExecutionResult(
                        test_id="crud_delete",
                        status=status,
                        actual_status_code=d_res.status_code,
                        expected_status_code=200,
                        assertions_passed=1 if status == "passed" else 0,
                    )
                )
            except Exception as err:
                results.append(
                    TestExecutionResult(
                        test_id="crud_delete",
                        status="error",
                        expected_status_code=200,
                        error=f"Delete step error: {str(err)}",
                    )
                )

        return results
