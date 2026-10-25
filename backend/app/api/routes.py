from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_roles
from app.models.entities import WorkflowRoute, UserRole

router = APIRouter(prefix="/workflow-routes", tags=["Workflow Engine Configuration"])

@router.get("")
async def get_workflow_routes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowRoute).order_by(WorkflowRoute.route_code.asc()))
    routes = result.scalars().all()
    return [
        {
            "id": r.id,
            "route_code": r.route_code,
            "name": r.name,
            "description": r.description,
            "version": r.version,
            "stages_config": r.stages_config,
            "is_active": r.is_active
        }
        for r in routes
    ]

@router.put("/{route_id}/config")
async def update_route_config(
    route_id: str,
    stages_config: dict,
    current_user = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(WorkflowRoute).where(WorkflowRoute.id == route_id))
    route = result.scalars().first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    route.stages_config = stages_config
    route.version += 1
    await db.commit()

    return {"message": "Route configuration version incremented and updated", "version": route.version}
