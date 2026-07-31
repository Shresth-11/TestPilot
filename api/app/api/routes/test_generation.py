from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.evaluators.quality import QualityEvaluator
from app.llm.generator import TestGenerator
from app.models import Endpoint, TestCase, TestEvaluation
from app.schemas import APIEndpoint, APIParameter, RequestSchema, ResponseSchema, TestCaseResponse

router = APIRouter(tags=["AI Test Generation"])


def _convert_db_endpoint_to_domain(ep: Endpoint) -> APIEndpoint:
    params = [APIParameter(**p) for p in (ep.parameters or [])]
    req_body = RequestSchema(**ep.request_body) if ep.request_body else None
    responses = []
    if ep.responses:
        for code, resp_def in ep.responses.items():
            responses.append(
                ResponseSchema(
                    status_code=int(code) if code.isdigit() else 200,
                    description=resp_def.get("description", ""),
                    schema_def=resp_def.get("schema_def", {}),
                )
            )

    return APIEndpoint(
        path=ep.path,
        method=ep.method,
        summary=ep.summary,
        description=ep.description,
        parameters=params,
        request_body=req_body,
        responses=responses,
        security=ep.security or [],
    )


@router.post("/endpoints/{endpoint_id}/generate-tests", response_model=list[TestCaseResponse], status_code=status.HTTP_201_CREATED)
async def generate_tests_for_endpoint(endpoint_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Endpoint).where(Endpoint.id == endpoint_id)
    res = await db.execute(stmt)
    ep = res.scalar_one_or_none()
    if not ep:
        raise HTTPException(status_code=404, detail=f"Endpoint '{endpoint_id}' not found.")

    domain_ep = _convert_db_endpoint_to_domain(ep)
    generator = TestGenerator()
    generated_cases = await generator.generate_tests(domain_ep)

    evaluator = QualityEvaluator()
    created_responses = []

    for gen_case in generated_cases:
        test_model = TestCase(
            endpoint_id=ep.id,
            project_id=ep.project_id,
            name=gen_case.name,
            description=gen_case.description,
            category=gen_case.category,
            method=gen_case.method,
            endpoint_path=gen_case.endpoint,
            headers=gen_case.headers,
            query_params=gen_case.query_params,
            path_params=gen_case.path_params,
            body=gen_case.body,
            expected_status_code=gen_case.expected_status_code,
            expected_response_schema=gen_case.expected_response_schema,
            assertions=[a.model_dump() for a in gen_case.assertions],
            priority=gen_case.priority,
            status="generated_needs_review",
        )
        db.add(test_model)
        await db.commit()
        await db.refresh(test_model)

        # Run quality evaluation immediately
        tc_resp = TestCaseResponse.model_validate(test_model)
        scores = evaluator.evaluate_test(tc_resp)
        eval_record = TestEvaluation(
            test_id=test_model.id,
            correctness_score=scores.correctness,
            consistency_score=scores.consistency,
            coverage_score=scores.coverage,
            usability_score=scores.usability,
            overall_score=scores.overall_score,
            feedback=scores.feedback,
        )
        db.add(eval_record)
        await db.commit()

        created_responses.append(tc_resp)

    return created_responses


@router.post("/specs/{spec_id}/generate-tests", response_model=list[TestCaseResponse], status_code=status.HTTP_201_CREATED)
async def generate_tests_for_spec(spec_id: str, db: AsyncSession = Depends(get_db)):
    ep_stmt = select(Endpoint).where(Endpoint.spec_id == spec_id)
    ep_res = await db.execute(ep_stmt)
    endpoints = list(ep_res.scalars().all())
    if not endpoints:
        raise HTTPException(status_code=404, detail=f"No endpoints found for spec '{spec_id}'.")

    all_created = []
    for ep in endpoints:
        domain_ep = _convert_db_endpoint_to_domain(ep)
        generator = TestGenerator()
        generated_cases = await generator.generate_tests(domain_ep)
        evaluator = QualityEvaluator()

        for gen_case in generated_cases:
            test_model = TestCase(
                endpoint_id=ep.id,
                project_id=ep.project_id,
                name=gen_case.name,
                description=gen_case.description,
                category=gen_case.category,
                method=gen_case.method,
                endpoint_path=gen_case.endpoint,
                headers=gen_case.headers,
                query_params=gen_case.query_params,
                path_params=gen_case.path_params,
                body=gen_case.body,
                expected_status_code=gen_case.expected_status_code,
                expected_response_schema=gen_case.expected_response_schema,
                assertions=[a.model_dump() for a in gen_case.assertions],
                priority=gen_case.priority,
                status="generated_needs_review",
            )
            db.add(test_model)
            await db.commit()
            await db.refresh(test_model)

            tc_resp = TestCaseResponse.model_validate(test_model)
            scores = evaluator.evaluate_test(tc_resp)
            eval_record = TestEvaluation(
                test_id=test_model.id,
                correctness_score=scores.correctness,
                consistency_score=scores.consistency,
                coverage_score=scores.coverage,
                usability_score=scores.usability,
                overall_score=scores.overall_score,
                feedback=scores.feedback,
            )
            db.add(eval_record)
            await db.commit()

            all_created.append(tc_resp)

    return all_created
