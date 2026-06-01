"""AI视觉创作工坊 - 业务逻辑"""
from app.services.ai_service import generate_image


IMAGE_STYLES = [
    "auto", "国风", "赛博朋克", "水彩", "油画", "3D渲染", "扁平插画"
]

DESIGN_TEMPLATES = ["海报", "封面图", "社交媒体配图", "PPT背景"]


async def create_text_to_image(
    prompt: str,
    style: str = "auto",
    size: str = "1024x1024",
) -> dict:
    """文生图"""
    urls = await generate_image(prompt, style=style, size=size, n=1)
    return {
        "prompt": prompt,
        "style": style,
        "image_urls": urls,
    }


async def create_design_layout(
    template: str,
    title: str,
    subtitle: str = "",
    style: str = "auto",
) -> dict:
    """智能设计排版"""
    prompt = (
        f"设计一张{template}风格的{template}：\n"
        f"标题：{title}\n"
        f"副标题：{subtitle}\n"
        f"风格：{style if style != 'auto' else '现代简约'}"
    )
    urls = await generate_image(prompt, style=style, size="1024x768", n=1)
    return {
        "template": template,
        "title": title,
        "subtitle": subtitle,
        "style": style,
        "image_urls": urls,
    }
