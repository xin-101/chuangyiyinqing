"""写作 API 路由"""
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.writing_service import generate_writing, transform_text, GENRES

router = APIRouter(prefix="/api/writing", tags=["写作工坊"])


class GenerateRequest(BaseModel):
    genre: str = Field(default="新闻报道", description="文体")
    prompt: str = Field(..., description="创作需求")
    tone: str = Field(default="neutral", description="情感基调")
    style_pref: str = Field(default="balanced", description="风格偏好")
    length: str = Field(default="medium", description="篇幅")


class TransformRequest(BaseModel):
    text: str = Field(..., description="原文")
    mode: str = Field(default="expand", description="模式：expand/shorten/restyle/translate")
    target_style: str = Field(default="", description="目标风格（restyle 时使用）")
    target_lang: str = Field(default="", description="目标语言（translate 时使用）")


@router.post("/generate")
async def api_generate(req: GenerateRequest):
    content = await generate_writing(
        genre=req.genre,
        prompt=req.prompt,
        tone=req.tone,
        style_pref=req.style_pref,
        length=req.length,
    )
    return {"success": True, "content": content, "genre": req.genre}


@router.post("/transform")
async def api_transform(req: TransformRequest):
    content = await transform_text(
        text=req.text,
        mode=req.mode,
        target_style=req.target_style,
        target_lang=req.target_lang,
    )
    return {"success": True, "content": content, "mode": req.mode}


@router.get("/genres")
async def api_genres():
    return {"success": True, "genres": GENRES}
