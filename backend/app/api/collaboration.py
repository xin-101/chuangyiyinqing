"""协作 API 路由"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.database import get_db
from app.models.comment import Comment

router = APIRouter(prefix="/api/collaboration", tags=["协作"])


class CommentCreateRequest(BaseModel):
    project_id: int
    author: str = "匿名"
    content: str


@router.get("/comments/{project_id}")
async def list_comments(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Comment).where(Comment.project_id == project_id).order_by(Comment.created_at.desc())
    )
    comments = result.scalars().all()
    return {"success": True, "comments": [c.to_dict() for c in comments]}


@router.post("/comments")
async def add_comment(req: CommentCreateRequest, db: AsyncSession = Depends(get_db)):
    comment = Comment(
        project_id=req.project_id,
        author=req.author,
        content=req.content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return {"success": True, "comment": comment.to_dict()}
