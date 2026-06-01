"""多模态融合 API 路由"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.fusion_service import match_text_with_image, create_video_script, full_pipeline
from app.services.fusion_service import full_pipeline_stream

router = APIRouter(prefix="/api/fusion", tags=["多模态融合创作"])


class MatchRequest(BaseModel):
    text: str = Field(..., description="文章/文案内容")
    style: str = Field(default="auto", description="配图风格")
    composition: str = Field(default="", description="构图要求")


class VideoScriptRequest(BaseModel):
    topic: str = Field(..., description="视频主题")
    duration: str = Field(default="60秒", description="视频时长")


class FullPipelineRequest(BaseModel):
    idea: str = Field(..., description="创意灵感/一句话需求")


@router.post("/match")
async def api_match(req: MatchRequest):
    result = await match_text_with_image(text=req.text, style=req.style, composition=req.composition)
    return {"success": True, **result}


@router.post("/video-script")
async def api_video_script(req: VideoScriptRequest):
    result = await create_video_script(topic=req.topic, duration=req.duration)
    return {"success": True, **result}


@router.post("/full-pipeline")
async def api_full_pipeline(req: FullPipelineRequest):
    result = await full_pipeline(idea=req.idea)
    return {"success": True, **result}


@router.post("/full-pipeline/stream")
async def api_full_pipeline_stream(req: FullPipelineRequest):
    """全链路流式输出（SSE）"""
    return StreamingResponse(
        full_pipeline_stream(idea=req.idea),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
