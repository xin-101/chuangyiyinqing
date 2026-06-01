"""应用配置"""
import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

# 项目根目录
BASE_DIR = Path(__file__).resolve().parent.parent

# DashScope API 配置
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
QWEN_MODEL = os.getenv("QWEN_MODEL", "qwen-max")
WANXIANG_MODEL = os.getenv("WANXIANG_MODEL", "wanx-v1")

# 数据库
DATABASE_URL = f"sqlite+aiosqlite:///{BASE_DIR / 'app.db'}"

# 服务端口
HOST = "0.0.0.0"
PORT = int(os.getenv("PORT", "8000"))
