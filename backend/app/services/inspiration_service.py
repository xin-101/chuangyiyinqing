"""创意灵感图谱 - 业务逻辑"""
from app.services.ai_service import generate_text


async def expand_graph(central_concept: str, depth: int = 1) -> dict:
    """从核心概念展开灵感图谱"""
    prompt = (
        f"「{central_concept}」是一个创意核心概念。请从以下维度进行发散联想，"
        f"生成一组关联创意节点。每个节点只需一个关键词或短语。\n\n"
        f"维度：\n"
        f"1. 相关主题（5个）：与核心概念密切相关的主题关键词\n"
        f"2. 风格参考（5个）：适合的艺术风格、视觉风格\n"
        f"3. 情感基调（5个）：可以表达的情感词汇\n"
        f"4. 衍生创意（5个）：由此概念可以衍生的具体创作方向\n\n"
        f"请以 JSON 格式输出，格式如下：\n"
        f'{{"related_themes": [...], "style_refs": [...], "emotions": [...], "derived_ideas": [...]}}'
    )

    result = await generate_text(
        prompt,
        system_prompt="你是创意灵感专家，擅长创意发散和概念联想。",
        temperature=0.9,
        max_tokens=1000,
    )

    # 尝试解析 JSON，失败则结构化文本
    import json
    import re

    try:
        data = json.loads(result)
    except json.JSONDecodeError:
        # 尝试从文本中提取 JSON
        match = re.search(r"\{.*\}", result, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
            except json.JSONDecodeError:
                data = _fallback_graph(central_concept)
        else:
            data = _fallback_graph(central_concept)

    nodes = [
        {"id": "root", "label": central_concept, "group": "core", "level": 0},
    ]
    edges = []

    for group_name, items in data.items():
        for i, item in enumerate(items):
            node_id = f"{group_name}_{i}"
            nodes.append({
                "id": node_id,
                "label": item,
                "group": group_name,
                "level": 1,
            })
            edges.append({
                "from": "root",
                "to": node_id,
                "label": group_name,
            })

    return {
        "central_concept": central_concept,
        "nodes": nodes,
        "edges": edges,
    }


async def associate_from_node(node_label: str, graph_context: list = None) -> dict:
    """从某个节点进一步联想发散"""
    prompt = (
        f"从创意概念「{node_label}」出发，进行进一步的灵感发散。"
        f"请生成8-12个与之相关的关键词或短语，可以是更细分的主题、"
        f"关联意象、创作手法或跨界灵感。\n\n"
        f"请以 JSON 数组格式输出：[\"关键词1\", \"关键词2\", ...]"
    )

    result = await generate_text(
        prompt,
        system_prompt="你是创意发散专家。",
        temperature=0.9,
        max_tokens=500,
    )

    import json
    import re

    try:
        items = json.loads(result)
    except json.JSONDecodeError:
        match = re.search(r"\[.*?\]", result, re.DOTALL)
        if match:
            try:
                items = json.loads(match.group())
            except (json.JSONDecodeError, TypeError):
                items = [f"{node_label}_衍生{i+1}" for i in range(6)]
        else:
            items = [f"{node_label}_衍生{i+1}" for i in range(6)]

    if not isinstance(items, list):
        items = [f"{node_label}_衍生{i+1}" for i in range(6)]

    new_nodes = []
    new_edges = []
    for i, item in enumerate(items):
        nid = f"assoc_{i}"
        new_nodes.append({"id": nid, "label": item, "group": "association", "level": 2})
        new_edges.append({"from": "clicked", "to": nid, "label": "联想"})

    return {
        "source_node": node_label,
        "nodes": new_nodes,
        "edges": new_edges,
    }


def _fallback_graph(concept: str) -> dict:
    """JSON 解析失败时的兜底数据"""
    return {
        "related_themes": [f"{concept}的起源", f"{concept}的未来", "相关技术", "应用场景", "文化影响"],
        "style_refs": ["现代简约", "科技感", "自然有机", "复古未来", "极简主义"],
        "emotions": ["好奇", "灵感", "期待", "震撼", "共鸣"],
        "derived_ideas": [f"{concept}×艺术", f"{concept}×教育", f"{concept}×商业", f"{concept}×娱乐", f"{concept}×公益"],
    }
