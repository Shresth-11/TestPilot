from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Endpoint, TestCase
from app.schemas import EndpointResponse

router = APIRouter(tags=["Endpoints"])


@router.get("/specs/{spec_id}/endpoints", response_model=list[EndpointResponse])
async def list_spec_endpoints(spec_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Endpoint).where(Endpoint.spec_id == spec_id).order_by(Endpoint.path.asc(), Endpoint.method.asc())
    res = await db.execute(stmt)
    endpoints = list(res.scalars().all())

    output = []
    for ep in endpoints:
        tc_stmt = select(TestCase).where(TestCase.endpoint_id == ep.id)
        tc_res = await db.execute(tc_stmt)
        tc_count = len(list(tc_res.scalars().all()))

        output.append(
            EndpointResponse(
                id=ep.id,
                spec_id=ep.spec_id,
                project_id=ep.project_id,
                path=ep.path,
                method=ep.method,
                summary=ep.summary,
                description=ep.description,
                parameters=ep.parameters or [],
                request_body=ep.request_body,
                responses=ep.responses or {},
                security=ep.security or [],
                test_case_count=tc_count,
            )
        )

    return output


@router.get("/endpoints/{endpoint_id}", response_model=EndpointResponse)
async def get_endpoint(endpoint_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Endpoint).where(Endpoint.id == endpoint_id)
    res = await db.execute(stmt)
    ep = res.scalar_one_or_none()
    if not ep:
        raise HTTPException(status_code=404, detail=f"Endpoint '{endpoint_id}' not found.")

    tc_stmt = select(TestCase).where(TestCase.endpoint_id == ep.id)
    tc_res = await db.execute(tc_stmt)
    tc_count = len(list(tc_res.scalars().all()))

    return EndpointResponse(
        id=ep.id,
        spec_id=ep.spec_id,
        project_id=ep.project_id,
        path=ep.path,
        method=ep.method,
        summary=ep.summary,
        description=ep.description,
        parameters=ep.parameters or [],
        request_body=ep.request_body,
        responses=ep.responses or {},
        security=ep.security or [],
        test_case_count=tc_count,
    )
