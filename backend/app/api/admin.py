"""管理控制台 API - AI 调用记录查看"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.models.ai_log import AICallLog

router = APIRouter(prefix="/api/admin", tags=["管理控制台"])


@router.get("/logs")
async def get_ai_logs(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页条数"),
    db: AsyncSession = Depends(get_db),
):
    """获取 AI 调用记录（分页，按时间倒序）"""
    count_stmt = select(AICallLog)
    total_result = await db.execute(count_stmt)
    total = len(total_result.scalars().all())

    stmt = (
        select(AICallLog)
        .order_by(desc(AICallLog.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()

    return {
        "success": True,
        "data": [log.to_dict() for log in logs],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/logs/stats")
async def get_logs_stats(db: AsyncSession = Depends(get_db)):
    """获取调用统计概览"""
    stmt_all = select(AICallLog)
    result = await db.execute(stmt_all)
    all_logs = result.scalars().all()

    total = len(all_logs)
    success_count = sum(1 for log in all_logs if log.success)
    fail_count = total - success_count

    type_counts = {}
    for log in all_logs:
        type_counts[log.call_type] = type_counts.get(log.call_type, 0) + 1

    return {
        "success": True,
        "total_calls": total,
        "success_count": success_count,
        "fail_count": fail_count,
        "success_rate": round(success_count / total * 100, 1) if total > 0 else 0,
        "by_type": type_counts,
    }
