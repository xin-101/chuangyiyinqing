"""智能写作工坊 - 业务逻辑"""
from app.services.ai_service import generate_text


# 文体对应的系统提示词
STYLE_PROMPTS = {
    "新闻报道": "你是一位资深新闻记者。请以客观、专业的口吻撰写一篇新闻报道。",
    "营销文案": "你是一位顶尖广告文案撰稿人。请创作富有感染力和传播力的营销文案。",
    "故事小说": "你是一位小说家。请创作一段引人入胜的叙事文本，注意人物塑造和情节推进。",
    "剧本脚本": "你是一位编剧。请撰写格式规范的剧本脚本，包含场景描述和对话。",
    "学术论文": "你是一位学术研究者。请撰写结构严谨、逻辑清晰的学术文本。",
    "社交媒体": "你是一位社交媒体运营专家。请创作适合社交媒体传播的短文案。",
}

GENRES = list(STYLE_PROMPTS.keys())


async def generate_writing(
    genre: str,
    prompt: str,
    tone: str = "neutral",
    style_pref: str = "balanced",
    length: str = "medium",
) -> str:
    """生成文案"""
    system = STYLE_PROMPTS.get(genre, STYLE_PROMPTS["新闻报道"])

    tone_map = {"positive": "请使用积极向上的语气。", "neutral": "请保持中立客观的语气。", "negative": "请使用深沉内敛的语气。"}
    length_map = {"short": "请控制在200字以内。", "medium": "请控制在500-800字。", "long": "请控制在1000-1500字。"}

    full_prompt = (
        f"【文体】{genre}\n"
        f"【语气】{tone_map.get(tone, '')}\n"
        f"【篇幅】{length_map.get(length, '')}\n"
        f"【要求】{prompt}"
    )

    result = await generate_text(full_prompt, system_prompt=system, temperature=0.8)
    return result


async def transform_text(
    text: str,
    mode: str = "expand",
    target_style: str = "",
    target_lang: str = "",
) -> str:
    """扩写/缩写/风格迁移/翻译"""
    mode_prompts = {
        "expand": f"请扩写以下文本，使其内容更丰富、细节更充实：\n\n{text}",
        "shorten": f"请缩写以下文本，保留核心信息，使其更简洁：\n\n{text}",
        "restyle": f"请将以下文本改写成{target_style}风格：\n\n{text}",
        "translate": f"请将以下文本翻译成{target_lang}：\n\n{text}",
    }

    system = "你是一位专业的文字编辑，擅长文本改写和优化。"
    prompt = mode_prompts.get(mode, mode_prompts["expand"])

    result = await generate_text(prompt, system_prompt=system, temperature=0.7)
    return result
