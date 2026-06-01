"""多模态融合创作 - 业务逻辑"""
from app.services.ai_service import generate_text, generate_image


async def match_text_with_image(
    text: str,
    style: str = "auto",
    composition: str = "",
) -> dict:
    """根据文本内容自动生成配套插图"""
    # 先用 AI 提取关键词并生成图片提示词
    prompt_for_image = (
        f"我有一段文字，请你提取核心意象和视觉关键词，生成一段适合文生图（text-to-image）的英文提示词。\n\n"
        f"文字内容：\n{text}\n\n"
        f"请只输出提示词本身，不要解释。"
    )
    image_prompt = await generate_text(
        prompt_for_image,
        system_prompt="你是视觉创意总监，擅长将文字转化为视觉语言。",
        temperature=0.7,
        max_tokens=300,
    )

    # 生成图片
    urls = await generate_image(image_prompt, style=style, size="1024x1024", n=1)

    return {
        "original_text": text[:200],
        "image_prompt": image_prompt,
        "style": style,
        "image_urls": urls,
    }


async def create_video_script(topic: str, duration: str = "60秒") -> dict:
    """视频创作辅助：生成脚本 + 分镜头 + 配音文案 + 封面方案"""
    script_prompt = (
        f"请为一则{duration}的短视频创作完整的制作方案，主题是：{topic}\n\n"
        f"请包含以下内容：\n"
        f"1. 视频标题\n"
        f"2. 核心创意/卖点\n"
        f"3. 分镜头脚本（按时间线，每个镜头描述画面 + 台词/旁白）\n"
        f"4. 配音文案（完整的旁白稿）\n"
        f"5. 封面设计方案"
    )
    script = await generate_text(
        script_prompt,
        system_prompt="你是资深视频编导，擅长短视频策划和脚本创作。",
        temperature=0.8,
        max_tokens=2048,
    )

    # 为封面生成配图提示词
    cover_prompt_text = (
        f"为视频主题「{topic}」设计一个封面图的视觉描述，"
        f"包括构图、色彩、主要视觉元素。请只输出视觉描述。"
    )
    cover_desc = await generate_text(
        cover_prompt_text,
        system_prompt="你是平面设计师，擅长封面设计。",
        temperature=0.7,
        max_tokens=200,
    )
    cover_urls = await generate_image(cover_desc, style="auto", size="1024x768", n=1)

    return {
        "topic": topic,
        "duration": duration,
        "script": script,
        "cover_design": cover_desc,
        "cover_urls": cover_urls,
    }


async def full_pipeline(idea: str) -> dict:
    """一个灵感，全案生成"""
    # 并行：文案 + 图片提示词
    writing = await generate_text(
        f"根据以下灵感，创作一篇完整的创意文案（包括标题和正文）：\n\n{idea}",
        system_prompt="你是全能创意总监，可以将任何灵感转化为完整的创作方案。",
        temperature=0.8,
        max_tokens=1500,
    )

    # 从文案提取关键词用于配图
    image_prompt_text = (
        f"以下是基于一个灵感生成的文案。请提取最核心的视觉意象，"
        f"生成一段用于文生图的提示词（中文）。\n\n灵感：{idea}\n\n文案：{writing}\n\n提示词："
    )
    img_prompt = await generate_text(
        image_prompt_text,
        system_prompt="你是视觉创意专家。",
        temperature=0.7,
        max_tokens=200,
    )

    urls = await generate_image(img_prompt, style="auto", size="1024x1024", n=1)

    # 生成视频脚本梗概
    video_outline = await generate_text(
        f"根据以下灵感，生成一个30秒短视频的脚本梗概（3-5个分镜头）：\n\n{idea}",
        system_prompt="你是短视频编导。",
        temperature=0.7,
        max_tokens=500,
    )

    return {
        "idea": idea,
        "writing": writing,
        "image_prompt": img_prompt,
        "image_urls": urls,
        "video_outline": video_outline,
    }


import json
from app.services.ai_service import generate_text_stream

async def full_pipeline_stream(idea: str):
    """全链路流式输出（SSE async generator）"""
    # 1. 流式输出文案
    writing = ""
    writing_prompt = f"根据以下灵感，创作一篇完整的创意文案（包括标题和正文）：\n\n{idea}"
    async for chunk in generate_text_stream(
        writing_prompt,
        system_prompt="你是全能创意总监，可以将任何灵感转化为完整的创作方案。",
        temperature=0.8,
        max_tokens=1500,
    ):
        writing += chunk
        yield f"data: {{\"type\": \"writing\", \"content\": {json.dumps(chunk)}}}\n\n"

    yield "data: {\"type\": \"writing_done\"}\n\n"

    # 2. 提取图片提示词（非流式，直接返回）
    image_prompt_text = (
        f"以下是基于一个灵感生成的文案。请提取最核心的视觉意象，"
        f"生成一段用于文生图的提示词（中文）。\n\n灵感：{idea}\n\n文案：{writing}\n\n提示词："
    )
    img_prompt = await generate_text(
        image_prompt_text,
        system_prompt="你是视觉创意专家。",
        temperature=0.7,
        max_tokens=200,
    )
    yield f"data: {{\"type\": \"image_prompt\", \"content\": {json.dumps(img_prompt)}}}\n\n"

    # 3. 生成图片
    urls = await generate_image(img_prompt, style="auto", size="1024x1024", n=1)
    yield f"data: {{\"type\": \"image\", \"urls\": {json.dumps(urls)}}}\n\n"

    # 4. 流式输出视频脚本梗概
    video_outline = ""
    video_prompt = f"根据以下灵感，生成一个30秒短视频的脚本梗概（3-5个分镜头）：\n\n{idea}"
    async for chunk in generate_text_stream(
        video_prompt,
        system_prompt="你是短视频编导。",
        temperature=0.7,
        max_tokens=500,
    ):
        video_outline += chunk
        yield f"data: {{\"type\": \"video_outline\", \"content\": {json.dumps(chunk)}}}\n\n"

    yield "data: {\"type\": \"done\"}\n\n"
