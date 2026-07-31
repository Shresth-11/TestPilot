from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.evaluators.quality import QualityEvaluator
from app.models import TestCase, TestEvaluation
from app.schemas import TestCaseResponse, TestCaseUpdate

router = APIRouter(tags=["Test Cases"])


@router.get("/projects/{project_id}/tests", response_model=list[TestCaseResponse])
async def list_project_tests(project_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(TestCase).where(TestCase.project_id == project_id).order_by(TestCase.created_at.desc())
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/tests/{test_id}", response_model=TestCaseResponse)
async def get_test(test_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(TestCase).where(TestCase.id == test_id)
    res = await db.execute(stmt)
    tc = res.scalar_one_or_none()
    if not tc:
        raise HTTPException(status_code=404, detail=f"Test case '{test_id}' not found.")
    return tc


@router.put("/tests/{test_id}", response_model=TestCaseResponse)
async def update_test(test_id: str, payload: TestCaseUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(TestCase).where(TestCase.id == test_id)
    res = await db.execute(stmt)
    tc = res.scalar_one_or_none()
    if not tc:
        raise HTTPException(status_code=404, detail=f"Test case '{test_id}' not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if field == "assertions" and val is not None:
            setattr(tc, field, [a.model_dump() if hasattr(a, "model_dump") else a for a in val])
        else:
            setattr(tc, field, val)

    # When user edits test, change status to validated if still in review
    if tc.status == "generated_needs_review":
        tc.status = "validated"

    await db.commit()
    await db.refresh(tc)

    # Re-run quality evaluation
    evaluator = QualityEvaluator()
    tc_resp = TestCaseResponse.model_validate(tc)
    scores = evaluator.evaluate_test(tc_resp)

    eval_stmt = select(TestEvaluation).where(TestEvaluation.test_id == test_id)
    eval_res = await db.execute(eval_stmt)
    existing_eval = eval_res.scalar_one_or_none()

    if existing_eval:
        existing_eval.correctness_score = scores.correctness
        existing_eval.consistency_score = scores.consistency
        existing_eval.coverage_score = scores.coverage
        existing_eval.usability_score = scores.usability
        existing_eval.overall_score = scores.overall_score
        existing_eval.feedback = scores.feedback
    else:
        new_eval = TestEvaluation(
            test_id=test_id,
            correctness_score=scores.correctness,
            consistency_score=scores.consistency,
            coverage_score=scores.coverage,
            usability_score=scores.usability,
            overall_score=scores.overall_score,
            feedback=scores.feedback,
        )
        db.add(new_eval)

    await db.commit()
    return tc


@router.delete("/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test(test_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(TestCase).where(TestCase.id == test_id)
    res = await db.execute(stmt)
    tc = res.scalar_one_or_none()
    if not tc:
        raise HTTPException(status_code=404, detail=f"Test case '{test_id}' not found.")
    await db.delete(tc)
    await db.commit()
    return None
