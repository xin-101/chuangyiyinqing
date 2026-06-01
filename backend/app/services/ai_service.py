"""DashScope AI 服务统一封装"""
import json
import logging
from typing import Optional

from app.config import DASHSCOPE_API_KEY, QWEN_MODEL, WANXIANG_MODEL

logger = logging.getLogger(__name__)


async def _log_ai_call(call_type: str, input_text: str, model: str, success: bool, response_summary: str = ""):
    """后台记录 AI 调用日志，失败不影响主流程"""
    try:
        from app.db.database import async_session
        from app.models.ai_log import AICallLog
        async with async_session() as session:
            session.add(AICallLog(
                call_type=call_type,
                input_text=input_text[:1000],
                model=model,
                success=success,
                response_summary=response_summary[:500],
            ))
            await session.commit()
    except Exception:
        pass


def _check_api_key():
    if not DASHSCOPE_API_KEY:
        raise RuntimeError("DASHSCOPE_API_KEY 未配置，请在 .env 文件中设置")


# ── 文本生成（通义千问 Qwen）──

async def generate_text(
    prompt: str,
    system_prompt: str = "你是一个专业的创意写作助手，名叫创艺引擎。",
    model: str = None,
    temperature: float = 0.8,
    max_tokens: int = 2048,
    stream: bool = False,
) -> str:
    """调用通义千问生成文本"""
    try:
        _check_api_key()
        model = model or QWEN_MODEL

        import dashscope
        dashscope.api_key = DASHSCOPE_API_KEY

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ]

        resp = dashscope.Generation.call(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            result_format="message",
        )

        if resp.status_code == 200:
            result = resp.output.choices[0].message.content
            await _log_ai_call("text", prompt, model, True, result[:200])
            logger.info(f"[AI] text | {model} | success | input={prompt[:60]}...")
            return result

        # API 返回错误，返回具体原因
        err_msg = f"【API {resp.status_code}】{resp.message}"
        logger.warning(err_msg)
        await _log_ai_call("text", prompt, model, False, err_msg)
        return err_msg

    except (ImportError, RuntimeError):
        err_msg = "【配置错误】DASHSCOPE_API_KEY 未配置"
        logger.warning(err_msg)
        await _log_ai_call("text", prompt, model or QWEN_MODEL, False, "no API key")
        return err_msg
    except Exception as e:
        err_msg = f"【生成失败】{str(e)}"
        logger.exception(f"AI text generation failed: {e}")
        await _log_ai_call("text", prompt, model or QWEN_MODEL, False, f"exception: {str(e)[:100]}")
        return err_msg


async def generate_text_stream(
    prompt: str,
    system_prompt: str = "你是一个专业的创意写作助手，名叫创艺引擎。",
    model: str = None,
    temperature: float = 0.8,
    max_tokens: int = 2048,
):
    """流式调用通义千问，逐个 token 产出（async generator）"""
    full_text = ""
    api_ok = True
    try:
        _check_api_key()
        model = model or QWEN_MODEL

        import dashscope
        dashscope.api_key = DASHSCOPE_API_KEY

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ]

        responses = dashscope.Generation.call(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
            incremental_output=True,
        )

        for resp in responses:
            if resp.status_code == 200:
                chunk = resp.output.choices[0].message.content
                if chunk:
                    full_text += chunk
                    yield chunk
            else:
                logger.warning(f"DashScope stream error ({resp.status_code}): {resp.message}")
                err_msg = f"【API {resp.status_code}】{resp.message}"
                yield err_msg
                api_ok = False
                break

    except (ImportError, RuntimeError):
        logger.warning("流式调用失败：API Key 未配置")
        yield "【配置错误】DASHSCOPE_API_KEY 未配置"
        return
    except Exception as e:
        logger.exception(f"AI streaming failed: {e}")
        yield f"【流式生成失败】{str(e)}"
        return

    if api_ok and full_text:
        await _log_ai_call("text", prompt, model, True, full_text[:200])
        logger.info(f"[AI] text | {model} | stream success | input={prompt[:60]}...")


# ── 图片生成（通义万相 Wanxiang）──

async def generate_image(
    prompt: str,
    style: str = "auto",
    size: str = "1024*1024",
    n: int = 1,
) -> list:
    """调用通义万相生成图像，返回图片 URL 列表"""
    try:
        _check_api_key()

        import dashscope
        dashscope.api_key = DASHSCOPE_API_KEY
        # 尺寸格式统一：1024x1024 -> 1024*1024
        size = size.replace("x", "*").replace("\u00d7", "*")

        style_prompt = prompt
        if style and style != "auto":
            style_map = {
                "国风": "中国传统水墨画风格，意境深远",
                "赛博朋克": "cyberpunk style, neon lights, dark atmosphere",
                "水彩": "watercolor painting style, soft and flowing",
                "油画": "oil painting style, rich textures",
                "3D渲染": "3D render style, realistic lighting",
                "扁平插画": "flat illustration style, vector art",
            }
            if style in style_map:
                style_prompt = f"{prompt}，{style_map[style]}"

        resp = dashscope.ImageSynthesis.call(
            model=WANXIANG_MODEL,
            prompt=style_prompt,
            size=size,
            n=n,
        )

        if resp.status_code == 200:
            urls = [r.url for r in resp.output.results]
            await _log_ai_call("image", prompt, WANXIANG_MODEL, True, f"generated {len(urls)} image(s)")
            logger.info(f"[AI] image | {WANXIANG_MODEL} | success | prompt={prompt[:60]}...")
            return urls

        # API 返回错误，返回空列表
        logger.warning(f"Image API error ({resp.status_code}): {resp.message}")
        await _log_ai_call("image", prompt, WANXIANG_MODEL, False, f"API error {resp.status_code}")
    # API 返回错误，使用占位图
        return _mock_image_urls(prompt, style, n)

    except (ImportError, RuntimeError):
        logger.warning("图片生成失败：API Key 未配置")
        await _log_ai_call("image", prompt, WANXIANG_MODEL, False, "no API key")
        return _mock_image_urls(prompt, style, n)
    except Exception as e:
        logger.warning(f"Image generation failed: {type(e).__name__}: {str(e)[:100]}")
        await _log_ai_call("image", prompt, WANXIANG_MODEL, False, f"exception: {str(e)[:100]}")
        return _mock_image_urls(prompt, style, n)


# ── 多模态理解（Qwen-VL）──

async def analyze_image(image_url: str, question: str = "请描述这张图片") -> str:
    """调用 Qwen-VL 分析图片内容"""
    try:
        _check_api_key()

        import dashscope
        dashscope.api_key = DASHSCOPE_API_KEY

        messages = [
            {
                "role": "user",
                "content": [
                    {"image": image_url},
                    {"text": question},
                ],
            }
        ]

        resp = dashscope.MultiModalConversation.call(
            model="qwen-vl-plus",
            messages=messages,
        )

        if resp.status_code == 200:
            return resp.output.choices[0].message.content[0]["text"]
        else:
            return f"【图片分析失败】{resp.message}"

    except (ImportError, RuntimeError):
        return "【配置错误】DASHSCOPE_API_KEY 未配置"
    except Exception as e:
        return f"【分析失败】{str(e)}"
def _mock_image_urls(prompt: str, style: str, n: int) -> list:
    """生成内嵌 SVG 占位图（无需外部请求，兼容国内网络）"""
    import base64
    import urllib.parse
    urls = []
    for i in range(n):
        svg = (
            '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">'
            '<rect width="600" height="400" fill="#1a1a2e"/>'
            f'<text x="300" y="180" text-anchor="middle" fill="#00d4ff" font-size="28" font-family="sans-serif">创艺引擎 {i+1}</text>'
            '<text x="300" y="230" text-anchor="middle" fill="#ffffff" font-size="14" font-family="sans-serif" opacity="0.5">AI 生成占位图（未配置 API Key）</text>'
            '</svg>'
        )
        b64 = base64.b64encode(svg.encode("utf-8")).decode("ascii")
        urls.append(f"data:image/svg+xml;base64,{b64}")
    return urls
