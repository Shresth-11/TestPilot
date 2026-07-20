import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Project, TestCase, TestRun
from app.runners.http_runner import HTTPTestRunner
from app.runners.selenium_runner import SeleniumTestRunner
from app.schemas import TestCaseResponse, TestExecutionResult, TestRunResponse
from app.worker import execute_test_run

router = APIRouter(tags=["Test Execution"])


@router.post("/tests/{test_id}/run", response_model=TestExecutionResult)
async def run_single_test(test_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(TestCase).where(TestCase.id == test_id)
    res = await db.execute(stmt)
    tc = res.scalar_one_or_none()
    if not tc:
        raise HTTPException(status_code=404, detail=f"Test case '{test_id}' not found.")

    p_stmt = select(Project).where(Project.id == tc.project_id)
    p_res = await db.execute(p_stmt)
    project = p_res.scalar_one_or_none()
    base_url = project.base_url if project and project.base_url else "http://localhost:8000"

    tc_response = TestCaseResponse.model_validate(tc)

    if tc.category == "ui":
        runner = SeleniumTestRunner()
    else:
        runner = HTTPTestRunner()

    result = await runner.run(tc_response, base_url)

    # Update status on test case
    tc.status = result.status
    await db.commit()

    return result


@router.post("/projects/{project_id}/run", response_model=TestRunResponse, status_code=status.HTTP_202_ACCEPTED)
async def run_project_tests(project_id: str, db: AsyncSession = Depends(get_db)):
    p_stmt = select(Project).where(Project.id == project_id)
    p_res = await db.execute(p_stmt)
    project = p_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    base_url = project.base_url if project.base_url else "http://localhost:8000"

    # Count test cases
    tc_stmt = select(TestCase).where(TestCase.project_id == project_id)
    tc_res = await db.execute(tc_stmt)
    test_cases = list(tc_res.scalars().all())

    test_run = TestRun(
        project_id=project_id,
        status="pending",
        total_tests=len(test_cases),
    )
    db.add(test_run)
    await db.commit()
    await db.refresh(test_run)

    # Launch non-blocking background task
    asyncio.create_task(execute_test_run(test_run.id, base_url))

    return TestRunResponse(
        id=test_run.id,
        project_id=test_run.project_id,
        status=test_run.status,
        total_tests=test_run.total_tests,
        passed=0,
        failed=0,
        skipped=0,
        duration_ms=0.0,
        created_at=test_run.created_at,
        results=[],
    )
