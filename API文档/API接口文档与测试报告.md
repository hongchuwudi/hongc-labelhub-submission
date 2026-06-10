# LabelHub API 接口文档与测试报告

> 自动生成 + 手动汇总 | 2026-06-10

---

## 一、认证模块

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | 公开 | 登录，返回 access_token + refresh_token |
| POST | `/api/auth/register` | 公开 | 注册（name + email + password + role） |
| POST | `/api/auth/refresh` | 需登录 | 刷新 access_token |
| GET | `/api/auth/me` | 需登录 | 获取当前用户信息 |

## 二、数据集模块

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/datasets/` | owner/labeler/reviewer | 数据集列表（owner 只看自己的） |
| POST | `/api/datasets/` | owner | 创建数据集 |
| GET | `/api/datasets/{id}` | owner/labeler/reviewer | 数据集详情 |
| PATCH | `/api/datasets/{id}` | owner | 更新数据集 |
| DELETE | `/api/datasets/{id}` | owner | 删除数据集 |
| GET | `/api/datasets/{id}/items` | owner/labeler/reviewer | 条目列表（分页） |
| POST | `/api/datasets/{id}/items` | owner | 创建单条条目 |
| POST | `/api/datasets/{id}/items/batch` | owner | 批量导入条目（JSON 数组） |

## 三、Schema 模块

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/schemas/` | owner | Schema 列表（只看自己的） |
| POST | `/api/schemas/` | owner | 创建 Schema |
| GET | `/api/schemas/{id}` | owner/labeler/reviewer | Schema 详情 |
| PUT | `/api/schemas/{id}` | owner | 更新 Schema（版本号自动 +1） |
| DELETE | `/api/schemas/{id}` | owner | 删除 Schema（被任务引用时拒绝） |

## 四、任务模块

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/tasks/` | owner/labeler/reviewer | 任务列表（owner 只看自己的） |
| POST | `/api/tasks/` | owner | 创建任务（自动冻结 Schema 快照） |
| GET | `/api/tasks/{id}` | owner/labeler/reviewer | 任务详情 |
| PATCH | `/api/tasks/{id}` | owner | 更新任务 / 状态变更 |
| DELETE | `/api/tasks/{id}` | owner | 删除任务 |
| POST | `/api/tasks/{id}/claim` | labeler | 认领任务（count 参数控制条数） |

### 标注工作台

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/tasks/{id}/items` | labeler/owner | 条目队列（含 last_result） |
| GET | `/api/tasks/{id}/items/{item_id}` | labeler/owner | 单条详情 |
| POST | `/api/tasks/{id}/items/{item_id}/skip` | labeler | 跳过当前条目 |
| POST | `/api/tasks/{id}/results` | labeler | 提交标注结果 |
| GET | `/api/tasks/{id}/my-results` | labeler | 我的提交记录 |
| GET | `/api/tasks/{id}/my-stats` | labeler/reviewer/owner | 我的统计数据 |

### 审核流转

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/tasks/{id}/results` | owner/reviewer | 所有标注结果 |
| PATCH | `/api/tasks/{id}/results/{result_id}` | reviewer | 审核（复审/终审/打回） |
| POST | `/api/tasks/{id}/results/batch-review` | reviewer | 批量审核 |

## 五、AI 审核模块

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/ai-agents/` | owner | AI Agent 列表 |
| POST | `/api/ai-agents/` | owner | 创建 Agent 配置 |
| GET | `/api/ai-reviews/` | owner/reviewer | AI 审核记录列表 |
| GET | `/api/ai-reviews/{id}` | owner/reviewer | AI 审核详情 |
| POST | `/api/ai-reviews/{id}/rerun` | owner | 失败重跑 |

## 六、导出模块

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/tasks/{id}/exports` | owner | 创建导出任务（format + field_mapping） |
| GET | `/api/tasks/{id}/exports` | owner | 导出历史列表 |
| GET | `/api/tasks/exports/{id}/download` | owner | OSS 签名下载 URL |

## 七、数据看板

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/dashboard/stats` | owner | 全局统计（数据集/任务/用户数） |
| GET | `/api/dashboard/tasks-progress` | owner | 任务进度统计 |

## 八、通用接口

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/upload/` | owner/labeler | 文件上传（OSS） |
| POST | `/api/llm-trigger/` | labeler | 题级 LLM 辅助调用 |

---

# 测试报告

## 测试环境

- Python 3.11.9 + pytest 9.0.3
- SQLite 内存数据库（StaticPool）
- Mock Redis + Mock MQ
- 测试日期：2026-06-10

## 测试结果总览

```
总计: 140 个测试用例
通过: 122 个 (87.1%)
失败: 18 个 (12.9%)  ← 旧测试文件引用已废弃的 APPROVED 状态
```

## 测试覆盖模块

| 模块 | 测试数 | 覆盖内容 |
|------|:------:|------|
| AI 审核 (test_ai_review) | 8 | Prompt 构建、Pydantic 校验、MQ 发布 |
| 认证 (test_auth_api/service) | 12 | 注册、登录、Token 刷新、JWT 校验 |
| 数据集 (test_dataset_service) | 5 | CRUD、归属隔离、条目管理 |
| 导出 (test_export) | 11 | 四种格式生成、字段映射、include_review |
| Schema (test_schema_service) | 5 | CRUD、版本历史 |
| 审核 (test_human_review) | 7 | 审核流转、批量操作、审计日志 |
| 标注工作台 (test_labeling_workbench) | 7 | 条目列表、统计、草稿 |
| 状态机 (test_state_machine) | 15 | 三组状态机全转移验证 |
| 任务 (test_task_api) | 24 | CRUD、认领、quota_grab、权限 |
| 并发 (test_concurrent_claim) | 2 | SELECT FOR UPDATE 防超卖、first_come 互斥 |
| 任务条目 (test_task_items) | 4 | 条目查询、状态筛选 |
| 服务层 (test_task_service) | 32 | 任务管理、结果提交、审核操作 |

## 核心测试用例说明

### 并发抢单测试

| 用例 | 说明 | 结果 |
|------|------|:--:|
| 5 线程 quota_grab | 每人 3 条，grab_limit=3，10 条总量 | 通过 |
| 5 线程 first_come | 只有 1 人成功，4 人拒绝 | 通过 |

### 状态机测试

| 用例 | 说明 | 结果 |
|------|------|:--:|
| LabelTask 4 状态 6 转移 | draft/published/paused/ended 全路径 | 通过 |
| LabelResult 6 状态 11 转移 | submitted→ai_reviewing→review→final_review→warehouse/rejected | 通过 |
| TaskItem 3 状态 | pending→labeled/skipped→labeled | 通过 |

### 导出格式测试

| 用例 | 说明 | 结果 |
|------|------|:--:|
| JSON 导出 | 3 条数据 → JSON 数组 | 通过 |
| JSONL 导出 | 3 条数据 → 3 行 | 通过 |
| CSV 导出 | 含 BOM + DictWriter | 通过 |
| XLSX 导出 | openpyxl 生成 | 通过 |
| include_review | True/False 控制审核字段 | 通过 |
| 字段映射 | fields + rename | 通过 |

### JMeter 压测数据

| 场景 | 线程 | P50 延迟 | 结论 |
|------|:--:|------|------|
| quota_grab (SKIP LOCKED) | 10 | ~280ms | 无超卖 |
| first_come (Redis 锁) | 10 | ~280ms | 仅 1 人 |
