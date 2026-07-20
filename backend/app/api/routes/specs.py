from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import APISpec, Endpoint, Project
from app.parsers.openapi_parser import OpenAPIParser
from app.schemas import APISpecCreate, APISpecResponse

router = APIRouter(tags=["API Specifications"])


@router.post("/projects/{project_id}/specs", response_model=APISpecResponse, status_code=status.HTTP_201_CREATED)
async def upload_spec(project_id: str, payload: APISpecCreate, db: AsyncSession = Depends(get_db)):
    # Verify project exists
    p_stmt = select(Project).where(Project.id == project_id)
    p_res = await db.execute(p_stmt)
    project = p_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    # Parse spec using OpenAPIParser
    try:
        parser = OpenAPIParser(raw_content=payload.raw_spec, spec_format=payload.format)
        title = parser.get_title()
        version = parser.get_version()
        base_url = parser.get_base_url()
        endpoints_data = parser.parse_endpoints()
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))

    if not project.base_url and base_url:
        project.base_url = base_url
        await db.commit()

    # Save APISpec entity
    api_spec = APISpec(
        project_id=project_id,
        title=title,
        version=version,
        spec_format=payload.format,
        raw_spec=payload.raw_spec,
    )
    db.add(api_spec)
    await db.commit()
    await db.refresh(api_spec)

    # Save extracted Endpoints
    for ep in endpoints_data:
        db_ep = Endpoint(
            spec_id=api_spec.id,
            project_id=project_id,
            path=ep.path,
            method=ep.method,
            summary=ep.summary,
            description=ep.description,
            parameters=[p.model_dump(by_alias=True) for p in ep.parameters],
            request_body=ep.request_body.model_dump() if ep.request_body else None,
            responses={str(r.status_code): r.model_dump() for r in ep.responses},
            security=ep.security,
        )
        db.add(db_ep)

    await db.commit()

    return APISpecResponse(
        id=api_spec.id,
        project_id=api_spec.project_id,
        title=api_spec.title,
        version=api_spec.version,
        spec_format=api_spec.spec_format,
        created_at=api_spec.created_at,
        endpoint_count=len(endpoints_data),
    )


@router.get("/projects/{project_id}/specs", response_model=list[APISpecResponse])
async def list_project_specs(project_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(APISpec).where(APISpec.project_id == project_id).order_by(APISpec.created_at.desc())
    res = await db.execute(stmt)
    specs = list(res.scalars().all())

    output = []
    for s in specs:
        ep_stmt = select(Endpoint).where(Endpoint.spec_id == s.id)
        ep_res = await db.execute(ep_stmt)
        ep_count = len(list(ep_res.scalars().all()))

        output.append(
            APISpecResponse(
                id=s.id,
                project_id=s.project_id,
                title=s.title,
                version=s.version,
                spec_format=s.spec_format,
                created_at=s.created_at,
                endpoint_count=ep_count,
            )
        )

    return output


@router.get("/specs/{spec_id}", response_model=APISpecResponse)
async def get_spec(spec_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(APISpec).where(APISpec.id == spec_id)
    res = await db.execute(stmt)
    spec = res.scalar_one_or_none()
    if not spec:
        raise HTTPException(status_code=404, detail=f"API Spec '{spec_id}' not found.")

    ep_stmt = select(Endpoint).where(Endpoint.spec_id == spec_id)
    ep_res = await db.execute(ep_stmt)
    ep_count = len(list(ep_res.scalars().all()))

    return APISpecResponse(
        id=spec.id,
        project_id=spec.project_id,
        title=spec.title,
        version=spec.version,
        spec_format=spec.spec_format,
        created_at=spec.created_at,
        endpoint_count=ep_count,
    )
