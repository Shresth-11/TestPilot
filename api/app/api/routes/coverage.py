from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.evaluators.coverage import CoverageCalculator
from app.models import Endpoint, Project, TestCase
from app.schemas import CoverageMetrics

router = APIRouter(tags=["API Coverage"])


@router.get("/projects/{project_id}/coverage", response_model=CoverageMetrics)
async def get_project_coverage(project_id: str, db: AsyncSession = Depends(get_db)):
    p_stmt = select(Project).where(Project.id == project_id)
    p_res = await db.execute(p_stmt)
    project = p_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    ep_stmt = select(Endpoint).where(Endpoint.project_id == project_id)
    ep_res = await db.execute(ep_stmt)
    endpoints = list(ep_res.scalars().all())

    tc_stmt = select(TestCase).where(TestCase.project_id == project_id)
    tc_res = await db.execute(tc_stmt)
    test_cases = list(tc_res.scalars().all())

    calculator = CoverageCalculator()
    return calculator.calculate_coverage(endpoints, test_cases)
