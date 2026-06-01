"""创意灵感图谱 API 路由"""
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.inspiration_service import expand_graph, associate_from_node

router = APIRouter(prefix="/api/inspiration", tags=["创意灵感图谱"])


class ExpandRequest(BaseModel):
    concept: str = Field(..., description="核心概念")
    depth: int = Field(default=1, description="展开深度")


class AssociateRequest(BaseModel):
    node_label: str = Field(..., description="当前节点标签")


@router.post("/expand")
async def api_expand(req: ExpandRequest):
    result = await expand_graph(central_concept=req.concept, depth=req.depth)
    return {"success": True, **result}


@router.post("/associate")
async def api_associate(req: AssociateRequest):
    result = await associate_from_node(node_label=req.node_label)
    return {"success": True, **result}
