# 创艺引擎 · 技术架构报告

> 多模态 AI 创意生成智能体  
> 山东职业学院 · 2026年6月  
> 版本：1.0.0

---

## 一、系统架构总览

创艺引擎采用经典的 **前后端分离 + AI 服务层** 三层架构，前端通过 REST API 和 SSE 流式协议与后端通信，后端统一封装 DashScope SDK 调用阿里云 AI 模型。架构设计遵循"高内聚、低耦合"原则，各功能模块独立路由、独立业务服务，便于扩展和维护。

```
┌──────────────────┐     REST/SSE     ┌──────────────────┐     DashScope     ┌──────────────────┐
│   Frontend       │ ◄──────────────► │   Backend        │ ◄──────────────► │   AI Engine      │
│   React 19       │                  │   FastAPI        │                  │   通义千问 Qwen   │
│   TypeScript     │                  │   SQLAlchemy     │                  │   通义万相 Wan    │
│   Vite 6         │                  │   SQLite         │                  │   Qwen-VL        │
└──────────────────┘                  └──────────────────┘                  └──────────────────┘
```

### 1.1 设计原则

- **模块化**：7 个 API 路由模块对应 7 个功能页面，互不依赖
- **异步优先**：后端全异步 (async/await)，AI 调用不阻塞请求线程
- **流式体验**：文本生成结果通过 SSE (Server-Sent Events) 实时推送
- **容错兜底**：AI 调用失败时返回具体错误信息或占位数据，不影响前端展示
- **可观测性**：所有 AI 调用记录入库，后台可追溯

---

## 二、前端架构

### 2.1 技术选型

| 技术 | 版本 | 选型理由 |
|------|------|----------|
| React | 19 | 最新版支持 React Compiler，性能更好 |
| TypeScript | 5.8 | 类型安全，减少运行时错误 |
| Vite | 6 | 极速 HMR，开发体验好 |
| Tailwind CSS | 3 | 原子化 CSS，快速构建现代 UI |
| Framer Motion | 12 | 声明式动画，页面过渡流畅 |
| zustand | 5 | 轻量状态管理，无 boilerplate |
| vis-network | 9 | 知识图谱可视化，力导向布局 |
| react-router-dom | 7 | SPA 路由，支持布局嵌套 |

### 2.2 路由设计

使用 `react-router-dom` 的嵌套路由模式（`<Outlet>`），统一通过 `AppLayout` 组件提供侧边栏导航和页面框架。

```typescript
<Route element={<AppLayout />}>
  <Route path="/"              element={<Dashboard />} />
  <Route path="/writing"       element={<WritingWorkshop />} />
  <Route path="/visual"        element={<VisualWorkshop />} />
  <Route path="/fusion"        element={<FusionCreation />} />
  <Route path="/inspiration"   element={<InspirationGraph />} />
  <Route path="/projects"      element={<Projects />} />
  <Route path="/collaboration" element={<Collaboration />} />
  <Route path="/admin"         element={<AdminConsole />} />
</Route>
```

### 2.3 状态管理

使用 **zustand** 管理全局状态，包括：

- **`showNotification`** — 全局消息通知
- **`recentIdeas`** / **`addRecentIdea`** — 创作工作台的灵感历史
- 页面级状态使用 React 的 `useState` / `useReducer` 管理

### 2.4 SSE 流式渲染

创作工作台是全项目的核心入口，采用 **SSE (Server-Sent Events)** 实现流式输出：

```typescript
// 前端通过 Fetch API + ReadableStream 消费 SSE
const abortRef = useRef<AbortController>(null);

const controller = new AbortController();
abortRef.current = controller;

const response = await fetch(url, {
  method: 'POST',
  body: JSON.stringify(payload),
  signal: controller.signal,
});

const reader = response.body.getReader();
// 逐个 data: 块解析，dispatch 更新 UI
```

后端对应的 SSE 端点使用 Python async generator，逐个 token 产出：

```python
async def full_pipeline_stream(idea: str):
    async for chunk in generate_text_stream(prompt):
        yield f"data: {{\"type\": \"writing\", \"content\": {json.dumps(chunk)}}}\n\n"
    # → 图片提示词 → 图片URL → 视频脚本 ...
    yield "data: {\"type\": \"done\"}\n\n"
```

**流式渲染的状态机**使用 `useReducer` 管理四种数据类型（writing / image_prompt / image / video_outline），每次 SSE 事件分发相应的 action 更新 UI。

---

## 三、后端架构

### 3.1 目录结构

```
app/
├── main.py              # FastAPI 应用入口，CORS 配置，路由注册
├── config.py            # 环境变量加载（.env）
├── api/                 # 7 个 REST API 路由模块
│   ├── writing.py       # 写作工坊 (生成/改写/文体列表)
│   ├── visual.py        # 视觉创作 (文生图/设计排版/风格列表)
│   ├── fusion.py        # 融合创作 (图文匹配/视频脚本/全案生成)
│   ├── inspiration.py   # 灵感图谱 (展开/联想)
│   ├── projects.py      # 项目管理 (CRUD/版本管理)
│   ├── collaboration.py # 团队协作 (评论/成员)
│   └── admin.py         # 管理后台 (AI日志/状态)
├── services/            # 业务逻辑层
│   ├── ai_service.py    # DashScope AI 统一封装
│   ├── writing_service.py
│   ├── visual_service.py
│   ├── fusion_service.py
│   └── inspiration_service.py
├── models/              # SQLAlchemy 数据模型
│   ├── project.py
│   ├── version.py
│   ├── image.py
│   ├── comment.py
│   └── ai_log.py
└── db/
    └── database.py      # 数据库引擎与会话管理
```

### 3.2 AI 服务层设计

`ai_service.py` 是后端核心，统一封装了三种 AI 能力：

#### 文本生成 — `generate_text()`

```python
async def generate_text(prompt, system_prompt, model, temperature, max_tokens, stream=False) -> str:
    import dashscope
    dashscope.api_key = DASHSCOPE_API_KEY

    resp = dashscope.Generation.call(
        model=model or QWEN_MODEL,  # 默认 qwen-plus
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
        result_format="message",
    )
    # → 校验 status_code → 返回内容 / 错误信息
    # → 异步记录 AI 日志
```

#### 流式文本生成 — `generate_text_stream()`

使用 `dashscope.Generation.call(stream=True, incremental_output=True)` 获取迭代器，逐个 token yield。

#### 图片生成 — `generate_image()`

```python
async def generate_image(prompt, style, size, n) -> list:
    # 尺寸格式统一: 1024x1024 → 1024*1024
    # 风格映射: 国风 → 提示词追加风格描述
    resp = dashscope.ImageSynthesis.call(
        model=WANXIANG_MODEL,  # 默认 wanx2.1-t2i-turbo
        prompt=style_prompt,
        size=size,
        n=n,
    )
    # → 返回图片 URL 列表 / 占位图
```

#### 多模态理解 — `analyze_image()`

使用 `dashscope.MultiModalConversation.call()` 调用 Qwen-VL 分析图片内容。

### 3.3 异常处理策略

- **API Key 未配置**：返回具体错误信息（如 `【配置错误】DASHSCOPE_API_KEY 未配置`）
- **API 返回错误**：返回 `【API 状态码】错误描述`，图片生成时返回内嵌 SVG 占位图
- **网络/运行时异常**：捕获所有 Exception，记录日志，返回 `【生成失败】错误详情`

### 3.4 数据库设计

使用 **SQLite + aiosqlite + SQLAlchemy async**，支持异步操作，零配置即可运行。

```mermaid
erDiagram
    Project ||--o{ Version : contains
    Project ||--o{ Comment : has
    Project ||--o{ Image : includes
    AICallLog ||--|| : standalone

    Project {
        int id PK
        string title
        string description
        string source_idea
        string style
        datetime created_at
        datetime updated_at
    }
    Version {
        int id PK
        int project_id FK
        string label
        string content_type
        text content
        datetime created_at
    }
    Image {
        int id PK
        int project_id FK
        text prompt
        string style
        string image_url
        datetime created_at
    }
    Comment {
        int id PK
        int project_id FK
        string author
        text content
        datetime created_at
    }
    AICallLog {
        int id PK
        string call_type
        text input_text
        string model
        bool success
        string response_summary
        datetime created_at
    }
```

---

## 四、AI 模型配置

### 4.1 当前模型选择

| 能力 | 模型 | 说明 |
|------|------|------|
| 文本生成 | `qwen-plus` | 通义千问，效果稳定 |
| 图片生成 | `wanx2.1-t2i-turbo` | 快速版文生图 (~9s) |
| 图片生成（高质量） | `wanx2.1-t2i-plus` | 增强版，质量更高 (~22s) |
| 多模态理解 | `qwen-vl-plus` | 图片分析理解 |

### 4.2 配置方式

所有模型名称通过 `.env` 文件配置：

```
DASHSCOPE_API_KEY=sk-xxxxxxxxxxx
QWEN_MODEL=qwen-plus
WANXIANG_MODEL=wanx2.1-t2i-turbo
PORT=8000
```

如需更换模型，修改对应的 `QWEN_MODEL` 或 `WANXIANG_MODEL` 值即可。

**已测试的有效图片模型：**
- `wanx2.1-t2i-turbo`（推荐，速度与质量均衡）
- `wanx2.1-t2i-plus`（高质量，速度较慢）

**无效模型（返回 400 错误）：**
- `qwen-image-2.0-pro`
- `wan2.7-image`

---

## 五、API 接口清单

### 写作工坊
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/writing/generate` | 根据文体/语气/篇幅生成文案 |
| POST | `/api/writing/transform` | 扩写/缩写/风格迁移/翻译 |
| GET | `/api/writing/genres` | 获取支持的文体列表 |

### 视觉创作
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/visual/text-to-image` | 文生图 |
| POST | `/api/visual/design` | 智能设计排版 |
| GET | `/api/visual/styles` | 获取支持的风格列表 |
| GET | `/api/visual/templates` | 获取支持的模板列表 |

### 融合创作
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/fusion/match-image` | 图文自动匹配 |
| POST | `/api/fusion/video-script` | 视频脚本生成 |
| POST | `/api/fusion/full-pipeline` | 全案生成（非流式） |
| POST | `/api/fusion/full-pipeline/stream` | 全案生成（SSE 流式） |

### 灵感图谱
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/inspiration/expand` | 从核心概念展开图谱 |
| POST | `/api/inspiration/associate` | 从节点进一步联想 |

### 项目管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/` | 项目列表 |
| POST | `/api/projects/` | 创建项目 |
| GET | `/api/projects/{id}` | 项目详情 |
| PUT | `/api/projects/{id}` | 更新项目 |
| DELETE | `/api/projects/{id}` | 删除项目 |
| GET | `/api/projects/{id}/versions` | 版本列表 |
| POST | `/api/projects/{id}/versions` | 创建版本 |
| GET | `/api/projects/versions/{vid}/diff` | 版本对比 |

### 协作
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/collaboration/members` | 成员列表 |
| GET | `/api/collaboration/comments/{project_id}` | 评论列表 |
| POST | `/api/collaboration/comments` | 添加评论 |
| DELETE | `/api/collaboration/comments/{id}` | 删除评论 |

### 管理后台
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/stats` | 系统统计 |
| GET | `/api/admin/logs` | AI 调用日志列表 |

---

## 六、全链路创作流程

创作工作台 (`Dashboard.tsx`) 是核心交互入口，实现"一个灵感，全案生成"：

```
用户输入灵感
     │
     ▼
┌────────────────────────────────────────────┐
│  STEP 1: 文案生成 (SSE 流式)               │
│  prompt = "根据灵感创作完整创意文案..."      │
│  → generate_text_stream()                   │
│  → 前端逐个 chunk 追加显示 (打字机效果)     │
└────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────┐
│  STEP 2: 提取配图提示词                    │
│  将文案发给 AI 提取核心视觉意象            │
│  → generate_text()                         │
│  → 得到文生图提示词                        │
└────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────┐
│  STEP 3: 生成配图                           │
│  提示词 → generate_image()                  │
│  → 返回图片 URL 列表                       │
└────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────┐
│  STEP 4: 视频脚本梗概 (SSE 流式)           │
│  → generate_text_stream()                  │
│  → 前端实时显示                            │
└────────────────────────────────────────────┘
     │
     ▼
  全案完成 → 复制 / 导出 Markdown
```

---

## 七、安全与性能考量

### 安全
- API Key 仅存储在 `.env` 文件中，不提交到版本控制
- CORS 开放所有来源（开发阶段），生产环境应限制域名
- AI 调用日志记录输入/输出，便于审计

### 性能
- 全异步 I/O，不阻塞请求线程
- SSE 流式输出减少首字节等待时间
- SQLite 适合单机部署，无需额外数据库服务
- Frontend 使用 Vite 构建，Tree-shaking 优化产物体积

---

## 八、开发路线

### 已完成
- 全链路创作工作台（流式全案生成）
- 智能写作工坊（6种文体 + 智能改写）
- AI视觉创作工坊（文生图 + 设计排版）
- 多模态融合创作（图文匹配 + 视频脚本）
- 创意灵感图谱（vis-network 可视化）
- 项目管理（CRUD + 版本控制 + 版本对比）
- 团队协作（评论 + 讨论）
- 管理后台（AI 日志监控 + 系统统计）

### 规划中
- 移动端适配优化
- 用户登录认证（JWT）
- 多供应商 AI 模型切换（OpenAI / Anthropic / 本地模型）
- 云端部署（Docker 打包）
- 音视频创作能力扩展

---

<p align="center">
  山东职业学院 · 2026年6月
</p>
