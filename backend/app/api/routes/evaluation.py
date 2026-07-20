from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.evaluators.quality import QualityEvaluator
from app.models import TestCase, TestEvaluation
from app.schemas import EvaluationScores, TestCaseResponse

router = APIRouter(tags=["Test Evaluation"])


@router.post("/tests/{test_id}/evaluate", response_model=EvaluationScores)
async def evaluate_test(test_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(TestCase).where(TestCase.id == test_id)
    res = await db.execute(stmt)
    tc = res.scalar_one_or_none()
    if not tc:
        raise HTTPException(status_code=404, detail=f"Test case '{test_id}' not found.")

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
    return scores


@router.get("/tests/{test_id}/evaluation", response_model=EvaluationScores)
async def get_test_evaluation(test_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(TestEvaluation).where(TestEvaluation.test_id == test_id)
    res = await db.execute(stmt)
    existing_eval = res.scalar_one_or_none()

    if not existing_eval:
        tc_stmt = select(TestCase).where(TestCase.id == test_id)
        tc_res = await db.execute(tc_stmt)
        tc = tc_res.scalar_one_or_none()
        if not tc:
            raise HTTPException(status_code=404, detail=f"Test case '{test_id}' not found.")

        evaluator = QualityEvaluator()
        tc_resp = TestCaseResponse.model_validate(tc)
        return evaluator.evaluate_test(tc_resp)

    return EvaluationScores(
        test_id=existing_eval.test_id,
        correctness=existing_eval.correctness_score,
        consistency=existing_eval.consistency_score,
        coverage=existing_eval.coverage_score,
        usability=existing_eval.usability_score,
        overall_score=existing_eval.overall_score,
        feedback=existing_eval.feedback,
    )
