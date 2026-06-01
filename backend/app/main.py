"""FastAPI 主入口"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import HOST, PORT
from app.db.database import init_db

# ── 注册路由 ──
from app.api import writing, visual, fusion, inspiration, projects, collaboration, admin

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("正在初始化数据库...")
    await init_db()
    logger.info("数据库初始化完成")
    yield


app = FastAPI(
    title="创艺引擎 API",
    description="多模态AI创意生成智能体 - 后端服务",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(writing.router)
app.include_router(visual.router)
app.include_router(fusion.router)
app.include_router(inspiration.router)
app.include_router(projects.router)
app.include_router(collaboration.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {
        "name": "创艺引擎 API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
