# API 接口设计

## 我的提示词

```
请为 LabelHub 数据标注平台设计 RESTful API 接口。

后端框架：Python FastAPI，统一前缀 /api

需要设计的接口组：
1. 认证 (auth) — 注册/登录/刷新Token/获取当前用户
2. 用户 (users) — 创建 AI Agent 用户/按角色查询用户
3. 数据集 (datasets) — CRUD + 条目批量导入/编辑/删除
4. Schema (schemas) — CRUD + 版本管理
5. 任务 (tasks) — CRUD + 领单 + 提交结果 + 查看结果 + 审核 + 批量审核 + 导出 + 审计日志
6. AI Agent (ai-agents) — CRUD + 池状态
7. AI 审核 (ai-reviews) — 列表/详情/重跑/统计
8. 看板 (dashboard) — 概览统计/任务进度/数据集统计
9. 文件上传 (upload) — OSS 上传
10. LLM 触发 (llm-trigger) — 工作台字段级 LLM 建议

要求：
1. 每个端点写出：Method + Path + 请求体/Query参数 + 响应体 + 权限要求
2. 统一响应格式：{ success: bool, data: T, message: string }
3. 分页接口统一用：{ items: T[], total: number, page: number, page_size: number }
4. 标注哪些端点需要角色守卫，哪种角色可以访问
5. 标注哪些端点涉及状态机流转

输出：Markdown 格式的 API 文档
```

---

## AI 的回答

# LabelHub API 接口文档

## 统一格式

```json
// 成功
{ "success": true, "data": { ... }, "message": "ok" }

// 失败
{ "success": false, "data": null, "message": "错误描述" }

// 分页
{ "success": true, "data": { "items": [...], "total": 100, "page": 1, "page_size": 20 } }
```

---

## 1. 认证 (auth)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | /api/auth/register | 公开 | 注册（默认 labeler 角色） |
| POST | /api/auth/login | 公开 | 登录，返回 access + refresh token |
| POST | /api/auth/refresh | 公开 | 用 refresh_token 换新 token pair |
| GET | /api/auth/me | 登录 | 获取当前用户信息 |

**POST /api/auth/login**
```json
// 请求体
{ "email": "owner@test.com", "password": "123456" }

// 响应体
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

## 2. 用户 (users)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | /api/users/ | owner | 创建 AI Agent 用户（role=ai_agent） |
| GET | /api/users/ | owner | 按角色查询用户列表 |

## 3. 数据集 (datasets)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/datasets | owner | 列表（分页，自动过滤 owner） |
| POST | /api/datasets | owner | 创建 |
| GET | /api/datasets/:id | owner | 详情 |
| PATCH | /api/datasets/:id | owner | 编辑 |
| DELETE | /api/datasets/:id | owner | 删除（级联删除 items） |

**题目条目 (datasets/:id/items)：**

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/datasets/:id/items | owner | 题目列表（分页） |
| POST | /api/datasets/:id/items/batch | owner | 批量导入 |
| PATCH | /api/datasets/:id/items/:itemId | owner | 编辑单条 |
| DELETE | /api/datasets/:id/items/:itemId | owner | 删除单条 |

## 4. Schema (schemas)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/schemas | owner | 列表（分页） |
| POST | /api/schemas | owner | 创建（version=1） |
| GET | /api/schemas/:id | owner | 详情（含完整 JSON Schema） |
| PUT | /api/schemas/:id | owner | 更新（version+1，旧版入 history） |
| DELETE | /api/schemas/:id | owner | 删除 |

## 5. 任务 (tasks) — 核心

| 方法 | 路径 | 权限 | 🔄状态机 | 说明 |
|------|------|------|---------|------|
| GET | /api/tasks | 登录 | — | 列表（beller 只看 published） |
| POST | /api/tasks | owner | — | 创建（draft） |
| GET | /api/tasks/:id | 登录 | — | 详情 |
| PATCH | /api/tasks/:id | owner | ✅ | 编辑/状态变更 |
| DELETE | /api/tasks/:id | owner | — | 删除 |
| POST | /api/tasks/:id/claim | labeler | ✅ | 领取任务 |
| GET | /api/tasks/:id/items | labeler | — | 我的待标注题目 |
| GET | /api/tasks/:id/items/:itemId | labeler | — | 单题详情 |
| POST | /api/tasks/:id/items/:itemId/skip | labeler | ✅ | 跳过题目 |
| POST | /api/tasks/:id/results | labeler | ✅ | 提交标注结果 |
| GET | /api/tasks/:id/results | reviewer | — | 提交结果列表 |
| GET | /api/tasks/:id/results/:resultId | reviewer | — | 单条结果详情 |
| PATCH | /api/tasks/:id/results/:resultId | reviewer | ✅ | 审核操作 |
| POST | /api/tasks/:id/results/batch-review | reviewer | ✅ | 批量审核 |
| GET | /api/tasks/:id/my-results | labeler | — | 我的提交列表 |
| GET | /api/tasks/:id/my-stats | labeler | — | 我的统计 |
| POST | /api/tasks/:id/exports | owner | — | 创建导出任务 |
| GET | /api/tasks/:id/exports | owner | — | 导出历史 |
| GET | /api/tasks/:id/audit-logs | owner | — | 审计日志 |

## 6. AI Agent (ai-agents)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/ai-agents | owner | Agent 列表 |
| POST | /api/ai-agents | owner | 创建 Agent（自动创建 ai_agent 角色 User） |
| PUT | /api/ai-agents/:id | owner | 更新配置（触发 pool.reload） |
| DELETE | /api/ai-agents/:id | owner | 删除 |
| GET | /api/ai-agents/status | owner | Agent 池实时状态 |

## 7. AI 审核 (ai-reviews)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/ai-reviews | reviewer+ | 审核列表（支持 agent/verdict/status 筛选） |
| GET | /api/ai-reviews/:id | reviewer+ | 详情 |
| POST | /api/ai-reviews/:id/rerun | reviewer+ | 失败重跑 |
| GET | /api/ai-reviews/agents-stats | reviewer+ | 全部 Agent 统计 |
| GET | /api/ai-reviews/agent/:id/stats | reviewer+ | 单 Agent 统计 |

## 8. 看板 (dashboard)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/dashboard/stats | owner | 概览统计 |
| GET | /api/dashboard/tasks-progress | owner | 任务进度 |
| GET | /api/dashboard/datasets-stats | owner | 数据集统计 |

## 9. 文件上传 (upload)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | /api/upload | 登录 | OSS 文件上传（multipart/form-data） |

## 10. LLM 触发 (llm-trigger)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | /api/llm-trigger | labeler | 工作台字段级 LLM 建议 |

**POST /api/llm-trigger**
```json
// 请求体
{
  "task_id": 1,
  "item_id": 5,
  "field_key": "summary"
}

// 响应体
{ "suggestion": "客户来电咨询流量包续费问题，语气焦急..." }
```
