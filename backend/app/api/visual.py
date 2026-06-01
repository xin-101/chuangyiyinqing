"""视觉创作 API 路由"""
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.visual_service import create_text_to_image, create_design_layout, IMAGE_STYLES, DESIGN_TEMPLATES

router = APIRouter(prefix="/api/visual", tags=["视觉创作工坊"])


class TextToImageRequest(BaseModel):
    prompt: str = Field(..., description="图片描述")
    style: str = Field(default="auto", description="风格")
    size: str = Field(default="1024x1024", description="尺寸")


class DesignRequest(BaseModel):
    template: str = Field(..., description="模板类型")
    title: str = Field(..., description="标题")
    subtitle: str = Field(default="", description="副标题")
    style: str = Field(default="auto", description="风格")


@router.post("/text-to-image")
async def api_text_to_image(req: TextToImageRequest):
    result = await create_text_to_image(prompt=req.prompt, style=req.style, size=req.size)
    return {"success": True, **result}


@router.post("/design")
async def api_design(req: DesignRequest):
    result = await create_design_layout(template=req.template, title=req.title, subtitle=req.subtitle, style=req.style)
    return {"success": True, **result}


@router.get("/styles")
async def api_styles():
    return {"success": True, "styles": IMAGE_STYLES}


@router.get("/templates")
async def api_templates():
    return {"success": True, "templates": DESIGN_TEMPLATES}
