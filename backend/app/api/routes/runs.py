from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import TestResult, TestRun
from app.schemas import TestExecutionResult, TestRunResponse

router = APIRouter(tags=["Test Runs"])


@router.get("/projects/{project_id}/runs", response_model=list[TestRunResponse])
async def list_project_runs(project_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(TestRun).where(TestRun.project_id == project_id).order_by(TestRun.created_at.desc())
    res = await db.execute(stmt)
    runs = list(res.scalars().all())

    output = []
    for run in runs:
        output.append(
            TestRunResponse(
                id=run.id,
                project_id=run.project_id,
                status=run.status,
                total_tests=run.total_tests,
                passed=run.passed,
                failed=run.failed,
                skipped=run.skipped,
                duration_ms=run.duration_ms,
                started_at=run.started_at,
                completed_at=run.completed_at,
                created_at=run.created_at,
                results=[],
            )
        )

    return output


@router.get("/runs/{run_id}", response_model=TestRunResponse)
async def get_run(run_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(TestRun).where(TestRun.id == run_id)
    res = await db.execute(stmt)
    run = res.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail=f"Test run '{run_id}' not found.")

    # Fetch results
    r_stmt = select(TestResult).where(TestResult.run_id == run_id).order_by(TestResult.executed_at.asc())
    r_res = await db.execute(r_stmt)
    db_results = list(r_res.scalars().all())

    results = [
        TestExecutionResult(
            test_id=r.test_id,
            run_id=r.run_id,
            status=r.status,  # type: ignore
            actual_status_code=r.actual_status_code,
            expected_status_code=r.expected_status_code,
            response_time_ms=r.response_time_ms,
            response_headers=r.response_headers,
            response_body=r.response_body,
            assertions_passed=r.assertions_passed,
            assertions_failed=r.assertions_failed,
            error=r.error_message,
            screenshot_path=r.screenshot_path,
            executed_at=r.executed_at,
        )
        for r in db_results
    ]

    return TestRunResponse(
        id=run.id,
        project_id=run.project_id,
        status=run.status,
        total_tests=run.total_tests,
        passed=run.passed,
        failed=run.failed,
        skipped=run.skipped,
        duration_ms=run.duration_ms,
        started_at=run.started_at,
        completed_at=run.completed_at,
        created_at=run.created_at,
        results=results,
    )


@router.get("/runs/{run_id}/results", response_model=list[TestExecutionResult])
async def get_run_results(run_id: str, db: AsyncSession = Depends(get_db)):
    r_stmt = select(TestResult).where(TestResult.run_id == run_id).order_by(TestResult.executed_at.asc())
    r_res = await db.execute(r_stmt)
    db_results = list(r_res.scalars().all())

    return [
        TestExecutionResult(
            test_id=r.test_id,
            run_id=r.run_id,
            status=r.status,  # type: ignore
            actual_status_code=r.actual_status_code,
            expected_status_code=r.expected_status_code,
            response_time_ms=r.response_time_ms,
            response_headers=r.response_headers,
            response_body=r.response_body,
            assertions_passed=r.assertions_passed,
            assertions_failed=r.assertions_failed,
            error=r.error_message,
            screenshot_path=r.screenshot_path,
            executed_at=r.executed_at,
        )
        for r in db_results
    ]
