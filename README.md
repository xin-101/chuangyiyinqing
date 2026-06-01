# 创艺引擎 — 多模态AI创意生成智能体

> 参赛项目：AI智能体创新大赛
> 研发单位：创艺引擎团队 · 2026年6月

## 项目简介

**创艺引擎** 是一款全链路 AI 创意生成平台，深度融合大语言模型、扩散模型与多模态理解技术，让创作者通过自然语言对话即可一站式完成文案撰写、图像生成、设计排版、视频脚本创作等多元创意任务。

核心理念：**一个灵感，全案生成**。

## 技术架构

```
Frontend: React + TypeScript + Vite + Tailwind CSS + Framer Motion
Backend:  Python FastAPI + SQLAlchemy + SQLite
AI Engine: 阿里云 DashScope API (通义千问 Qwen + 通义万相 Wanxiang)
```

## 功能模块

| 模块 | 说明 |
|------|------|
| 创作工作台 | 灵感输入 → "一键全案生成"文案+配图+视频脚本 |
| 智能写作工坊 | 6种文体 · 语气/篇幅控制 · AI 智能生成 |
| AI视觉创作工坊 | 文生图（7种风格）· 智能设计排版（4种模板） |
| 多模态融合创作 | 图文自动匹配 · 视频脚本生成 · 全案生成 |
| 创意灵感图谱 | 可视化的知识图谱 · AI 发散联想 · 双击探索 |
| 项目管理 | 项目 CRUD · 版本历史 · 版本对比 |
| 团队协作 | 成员列表 · 评论讨论 |

## 快速开始

### 前置要求

- Node.js >= 18
- Python >= 3.10
- 阿里云 DashScope API Key（[申请地址](https://dashscope.aliyun.com)）

### 1. 启动后端

```bash
cd backend
pip install -r requirements.txt

# 配置 API Key（编辑 .env 文件）
# DASHSCOPE_API_KEY=your_key_here

uvicorn app.main:app --reload --port 8000
```

API 文档自动生成：http://localhost:8000/docs

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

### 3. 使用

- 无需 API Key 时系统会使用模拟数据展示完整功能
- 配置 API Key 后自动切换为真实 AI 生成

## 项目结构

```
创艺引擎/
├── frontend/            # React + TypeScript 前端
│   ├── src/
│   │   ├── pages/       # 7个功能页面
│   │   ├── api/         # API 调用封装
│   │   ├── store/       # 状态管理 (zustand)
│   │   └── components/  # 公共组件
│   └── ...
├── backend/             # Python FastAPI 后端
│   ├── app/
│   │   ├── api/         # REST API 路由
│   │   ├── services/    # 业务逻辑层
│   │   ├── models/      # 数据模型
│   │   └── db/          # 数据库
│   └── ...
└── README.md
```
