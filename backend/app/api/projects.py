"""项目管理 API 路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.models.project import Project
from app.models.version import Version

router = APIRouter(prefix="/api/projects", tags=["项目管理"])


class CreateProjectRequest(BaseModel):
    title: str = Field(default="未命名项目")
    description: str = Field(default="")
    source_idea: str = Field(default="")
    style: str = Field(default="general")


class UpdateProjectRequest(BaseModel):
    title: str = Field(default=None)
    description: str = Field(default=None)
    style: str = Field(default=None)


class CreateVersionRequest(BaseModel):
    label: str = Field(default="")
    content_type: str = Field(default="text")
    content: str = Field(default="")


# ── 项目 CRUD ──

@router.get("")
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.updated_at.desc()))
    projects = result.scalars().all()
    return {"success": True, "projects": [p.to_dict() for p in projects]}


@router.post("")
async def create_project(req: CreateProjectRequest, db: AsyncSession = Depends(get_db)):
    project = Project(
        title=req.title,
        description=req.description,
        source_idea=req.source_idea,
        style=req.style,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return {"success": True, "project": project.to_dict()}


@router.get("/{project_id}")
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return {"success": True, "project": project.to_dict()}


@router.put("/{project_id}")
async def update_project(project_id: int, req: UpdateProjectRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    if req.title is not None:
        project.title = req.title
    if req.description is not None:
        project.description = req.description
    if req.style is not None:
        project.style = req.style
    await db.commit()
    await db.refresh(project)
    return {"success": True, "project": project.to_dict()}


@router.delete("/{project_id}")
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    await db.delete(project)
    await db.commit()
    return {"success": True, "message": "已删除"}


# ── 版本管理 ──

@router.get("/{project_id}/versions")
async def list_versions(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Version).where(Version.project_id == project_id).order_by(Version.created_at.desc())
    )
    versions = result.scalars().all()
    return {"success": True, "versions": [v.to_dict() for v in versions]}


@router.post("/{project_id}/versions")
async def create_version(project_id: int, req: CreateVersionRequest, db: AsyncSession = Depends(get_db)):
    ver = Version(
        project_id=project_id,
        label=req.label,
        content_type=req.content_type,
        content=req.content,
    )
    db.add(ver)
    await db.commit()
    await db.refresh(ver)
    return {"success": True, "version": ver.to_dict()}


@router.get("/versions/{version_id}")
async def get_version(version_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Version).where(Version.id == version_id))
    ver = result.scalar_one_or_none()
    if not ver:
        raise HTTPException(status_code=404, detail="版本不存在")
    return {"success": True, "version": ver.to_dict()}


@router.get("/versions/{vid1}/compare")
async def compare_versions(vid1: int, with_vid2: int = None, db: AsyncSession = Depends(get_db)):
    if with_vid2 is None:
        raise HTTPException(status_code=400, detail="需要 with_vid2 参数")
    r1 = await db.execute(select(Version).where(Version.id == vid1))
    r2 = await db.execute(select(Version).where(Version.id == with_vid2))
    v1 = r1.scalar_one_or_none()
    v2 = r2.scalar_one_or_none()
    if not v1 or not v2:
        raise HTTPException(status_code=404, detail="版本不存在")
    return {"success": True, "version_a": v1.to_dict(), "version_b": v2.to_dict()}
