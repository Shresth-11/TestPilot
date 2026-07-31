import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models import TestCase, TestResult, TestRun
from app.runners.http_runner import HTTPTestRunner
from app.runners.selenium_runner import SeleniumTestRunner

logger = logging.getLogger(__name__)


async def execute_test_run(run_id: str, base_url: str) -> None:
    """Executes a full test run in the background, updating run status and storing test results."""
    async with AsyncSessionLocal() as db:
        run_stmt = select(TestRun).where(TestRun.id == run_id)
        res = await db.execute(run_stmt)
        test_run = res.scalar_one_or_none()

        if not test_run:
            logger.error(f"TestRun {run_id} not found for background execution.")
            return

        test_run.status = "running"
        test_run.started_at = datetime.now(timezone.utc)
        await db.commit()

        # Fetch all test cases for project
        tests_stmt = select(TestCase).where(TestCase.project_id == test_run.project_id)
        tests_res = await db.execute(tests_stmt)
        test_cases = list(tests_res.scalars().all())

        test_run.total_tests = len(test_cases)
        await db.commit()

        http_runner = HTTPTestRunner()
        selenium_runner = SeleniumTestRunner()

        passed_count = 0
        failed_count = 0
        skipped_count = 0
        total_duration = 0.0

        for test in test_cases:
            if test.category == "ui":
                result = await selenium_runner.run(test, base_url)
            else:
                result = await http_runner.run(test, base_url)

            total_duration += result.response_time_ms

            if result.status == "passed":
                passed_count += 1
                test.status = "passed"
            elif result.status == "skipped":
                skipped_count += 1
            else:
                failed_count += 1
                test.status = "failed"

            # Create TestResult record
            db_result = TestResult(
                run_id=run_id,
                test_id=test.id,
                status=result.status,
                actual_status_code=result.actual_status_code,
                expected_status_code=result.expected_status_code,
                response_time_ms=result.response_time_ms,
                response_headers=result.response_headers,
                response_body=result.response_body,
                assertions_passed=result.assertions_passed,
                assertions_failed=result.assertions_failed,
                error_message=result.error,
                screenshot_path=result.screenshot_path,
            )
            db.add(db_result)
            await db.commit()

        test_run.status = "completed" if failed_count == 0 else "failed"
        test_run.passed = passed_count
        test_run.failed = failed_count
        test_run.skipped = skipped_count
        test_run.duration_ms = round(total_duration, 1)
        test_run.completed_at = datetime.now(timezone.utc)
        await db.commit()
        logger.info(f"TestRun {run_id} completed. Passed: {passed_count}, Failed: {failed_count}.")
