"""生成所有教程 MD 文件"""
import os

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CONTENT = os.path.join(BASE, "frontend", "src", "pages", "Tutorial", "content")

FILES = {
    # ── 快速入门 ──
    "getting-started/intro.md": """# 平台简介

LabelHub 是一套覆盖**数据标注全生命周期**的 Web 平台，支持从任务创建到数据导出的完整链路。

## 核心能力

- **可视化 Schema 搭建** — 拖拽组件动态搭建标注表单
- **AI 自动预审** — 可配置评分维度的智能质检 Agent
- **多角色审核流转** — 复审 / 终审 / 入库，完整审计追溯
- **多格式数据导出** — JSON / JSONL / CSV / Excel

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Ant Design + Zustand + dnd-kit |
| 后端 | Python FastAPI + SQLAlchemy + Pydantic V2 |
| 数据库 | MySQL 8.0 |
| AI Agent | OpenAI 兼容 API + Function Calling |
| 中间件 | Redis + RabbitMQ |
| 存储 | 阿里云 OSS |

## 三端架构

```text
[Owner]    建任务 → 搭模板 → 发布 → 看结果 → 导出
[Labeler]  浏览广场 → 认领 → 作答 → 提交 → 看打回 → 修改
[Agent]    MQ 拉取 → LLM 评分 → 写回
[Reviewer] 审核列表 → 通过/打回 → 批量操作
```
""",

    "getting-started/roles.md": """# 角色与权限

LabelHub 支持四种角色，每种角色有不同的操作权限和数据访问范围。

## 任务负责人 (Owner)

- 创建和管理数据集
- 使用 Schema Designer 搭建标注模板
- 创建任务并配置三种分发策略
- 关联 AI Agent 启用自动预审
- 查看数据看板和导出标注结果
- 数据隔离：Owner 只能看到和操作自己创建的数据集、任务和 Schema

## 标注员 (Labeler)

- 浏览任务大厅，查看所有已发布任务
- 认领任务（先到先得 / 配额抢单）
- 在线标注作答，草稿自动保存防丢失
- 使用题级 LLM 辅助功能
- 查看打回原因并修改重新提交
- 数据隔离："我的任务"中只能看到已认领或指派的

## 审核员 (Reviewer)

- 查看所有需要审核的标注结果
- 执行复审和终审操作
- 批量通过 / 打回，提升审核效率
- 查看 AI 预审评分和完整审计日志
- 驳回时必须填写驳回理由

## AI Agent (System)

- 后台异步自动运行
- 拉取已提交数据 → 调 LLM → 多维评分 → 写回
- 具备独立系统账号视角
- 审核记录可追溯
""",

    "getting-started/workflow.md": """# 工作流概览

LabelHub 完整标注流程从任务创建到数据导出，贯穿三端角色。

## 端到端流程

```text
1. [Owner]   创建数据集（导入 CSV/JSON/JSONL/Excel）
2. [Owner]   Schema Designer 拖拽搭建标注模板
3. [Owner]   创建任务 + 选数据集/Schema + 配置策略 + 发布
4. [Labeler] 任务大厅浏览 + 认领任务
5. [Labeler] 标注工作台逐条作答（支持草稿自动保存）
6. [Labeler] 提交 → 触发 AI 预审（如配置了 AI Agent）
7. [Agent]   MQ 异步队列 → 调 LLM → 维度评分 → 写回
8. [Reviewer] 审核台查看 AI 评分 + 复审 + 终审
9. [Owner]   数据看板 + 导出中心下载结果
```

## 关键设计

- **Schema 快照**：任务发布时冻结 Schema，后续修改不影响已发布任务
- **AI 预审**：提交后自动入 MQ 队列，异步处理不阻塞标注
- **审核流转**：6 状态机，合法转移由状态机引擎校验
- **打回重提**：驳回后标注员修改重新提交，旧记录保留为审计历史
""",

    # ── Schema 设计器 ──
    "schema-designer/overview.md": """# 功能概述

Schema Designer 是 LabelHub 的可视化标注表单搭建工具。三栏布局（物料区 / 画布 / 属性面板），拖拽式操作，无需代码即可定义标注字段结构。

## 核心设计

- **Designer / Renderer 解耦** — 搭建产出为可序列化 JSON Schema，同一份 Schema 在 Designer 预览和 Workbench 运行时渲染
- **JSON Schema 驱动** — 字段定义、校验规则、联动关系全部 JSON 存储
- **版本管理** — 每次保存自动 +1，历史版本可追溯

## 核心能力

- 10+ 种物料类型（单行/多行文本、单选/多选、下拉选择、文件上传、JSON 编辑器、LLM 触发、ShowItem 等）
- 字段校验规则（必填、长度、正则、最小/最大值）
- 字段联动（条件显示/隐藏，多字段级联）
- 分组容器（GroupConfig）+ Tab 多标签布局（TabConfig）
- 实时表单预览 + JSON Schema 查看 + 校验模拟
""",

    "schema-designer/palette.md": """# 物料面板

物料面板在 Schema Designer 左侧，集中展示所有可用字段类型。

## 物料类型

| 物料 | 字段类型 | 说明 |
|------|------|------|
| 单行文本 | `text` | 基础文本输入 |
| 多行文本 | `textarea` | 长文本，可设行数和最大长度 |
| 单选 | `radio` | 按钮样式选项组 |
| 多选 | `checkbox` | 多选框组 |
| 下拉选择 | `select` | 支持多选 / 标签模式 |
| 富文本编辑器 | `richtext` | React Quill 编辑器 |
| JSON 编辑器 | `json` | 语法高亮 + 字体设置 |
| 文件上传 | `upload` | 支持图片/文件，OSS 存储 |
| LLM 触发 | `llm` | 题级 AI 辅助调用 |
| 展示项 | `showitem` | 只读展示原始数据，不提交 |

## 使用

从物料区将字段拖入中间画布即完成添加。拖入分组容器内自动归属。拖入 Tab 区域自动分配到对应 Tab。
""",

    "schema-designer/canvas.md": """# 画布操作

画布是 Schema Designer 中间区域，字段在此排列、编辑和管理。

## 字段操作

- **拖拽排序** — 字段在画布内自由拖拽调整顺序
- **放入容器** — 拖入分组框内自动归属到该容器
- **拖入 Tab** — 拖入 Tab 内自动分配到对应 Tab
- **点击选中** — 右侧属性面板同步显示配置项
- **复制 / 删除** — 每个字段卡片支持按钮操作

## 布局规则

- 字段按 24 列网格布局，`colSpan` 控制宽度
- `colSpan=12` 半宽，`colSpan=24` 全宽
- 字段通过 `flexWrap: wrap` 自动换行

## Tab + 容器

- 工具栏 [Tab] 按钮创建标签页
- 工具栏 [分组] 按钮创建分组容器
- 字段可分配到 Tab 或容器（互斥）
- 未分配字段在有 Tab 时显示在虚线分隔的"未分配区域"
""",

    "schema-designer/props.md": """# 属性配置

属性面板在 Schema Designer 右侧，选中字段/容器后显示对应配置。

## 字段属性

| 属性 | 说明 |
|------|------|
| 字段 Key | 表单提交时的字段标识（必填） |
| 标题 | 显示在表单上的名称 |
| 必填 | 标注时是否强制填写 |
| 占位符 | 输入框内默认提示文字 |
| 列宽 (colSpan) | 24 列网格中的列宽 |
| 文本对齐 (textAlign) | left / center / right |
| 选项列表 | 单选/多选/下拉枚举值 |
| 最大长度 | 文本字数上限（带计数显示） |
| 行数 | 多行文本可见行数 |
| 多选 | 下拉是否开启多选标签模式 |

## 校验规则

支持添加多条规则，每条含类型、值和错误提示：
- `required` — 必填
- `minLength` / `maxLength` — 长度限制
- `pattern` — 正则匹配
- `min` / `max` — 数值范围

## 字段联动

字段 A 上定义联动规则，监视目标字段 B 的值变化：
- `targetField` — 被监视的字段
- `condition` — equals / notEquals / in
- `action` — visible（满足时显示）/ hidden（满足时隐藏）
- `value` — 触发值
""",

    # ── 任务管理 ──
    "task-management/create.md": """# 创建任务

任务是标注工作的基本单元。Owner 选择数据集和 Schema，配置策略后发布。

## 创建步骤

1. 进入任务管理页面，点击"新建任务"
2. 填写任务名称、标签（逗号分隔）、描述（富文本）
3. 选择关联的数据集（需预先导入数据）
4. 选择关联的 Schema（标注模板）
5. 选择分发策略（first_come / assigned / quota_grab）
6. 设置配额（需标注条数，不超过数据集总量）
7. 可选：配置奖励（元/条 + 月封顶）、截止时间
8. 可选：关联 AI Agent（启用 AI 预审）

## 数据来源

配额 = N 表示按 `index` 升序取数据集前 N 条生成 TaskItem。总任务条目数 = 配额。

## Schema 快照

创建时自动将当前 Schema 冻结保存到 `schema_snapshot` 列。即使后续 Schema 多次修改，已发布任务不受影响。

## 发布

创建后状态为 `draft`。需点击"发布"使状态变为 `published`，标注员才能在任务大厅看到此任务。
""",

    "task-management/strategy.md": """# 分发策略

分发策略决定标注任务如何分配给标注员。LabelHub 支持三种策略。

## 先到先得 (first_come)

谁先认领，整个任务归谁。

- 适用：单一标注员的小型任务
- 防并发：Redis SETNX 分布式锁（TTL 30s），同一时刻仅一人成功
- 其他人再请求收到"任务已被认领"错误
- 认领后 `assignee_id` 设置为该标注员

## 指派 (assigned)

Owner 创建任务时直接指定标注员。

- 适用：明确知道谁来做
- 被指派人无需认领，"我的任务"中直接可见
- `claim()` 返回"指派任务无需认领"
- 可编辑任务更换指派人

## 配额抢单 (quota_grab)

任务按条目分配，多标注员并行抢不同条目。

- 适用：大规模多人协作
- 抢单接口：`POST /tasks/{id}/claim?count=N`
- `grab_limit` 控制单人累计上限（不设则不限制）
- 防并发：`SELECT FOR UPDATE SKIP LOCKED`，不同条目可并行

## 三种策略对比

| 策略 | 粒度 | 独占 | 并发控制 | 适用场景 |
|------|:---:|:---:|------|------|
| first_come | 整任务 | 是 | Redis SETNX | 单人小型任务 |
| assigned | 整任务 | 是 | 无需 | Owner 精确指派 |
| quota_grab | 按条目 | 否 | SKIP LOCKED | 多人协作大任务 |
""",

    "task-management/status.md": """# 任务状态

LabelHub 任务具有完整的生命周期状态机（4 状态 + 6 条合法转移）。

## 状态流转图

```text
draft ──→ published ──→ paused
  │          │             │
  └──────────┼─────────────┘
             ↓
           ended
```

## 状态说明

| 状态 | 含义 | 允许操作 |
|------|------|------|
| draft | 草稿，未发布 | 编辑、发布、删除 |
| published | 已发布，标注员可认领 | 暂停、结束 |
| paused | 已暂停 | 恢复为 published、结束 |
| ended | 已结束（最终态） | 仅删除 |

## 状态机

后端 `state_machine/task.py` 定义合法转移表：

```python
TASK_TRANSITIONS = {
    draft:     {published, ended},
    published: {paused, ended},
    paused:    {published, ended},
    ended:     set(),
}
```

所有状态变更前必须通过 `transit()` 校验，非法转移直接抛出 `BadRequestException`。
""",

    # ── 标注工作台 ──
    "labeling-workbench/square.md": """# 任务大厅

任务大厅是标注员进入标注工作的入口，展示所有可供认领的已发布任务。

## 两个标签页

- **任务大厅** — 所有 `status=published` 且不属于当前用户的任务
- **我的任务** — 当前用户已认领或被指派的任务

## 过滤逻辑

- 任务大厅：`pubRes.data.items.filter(t => t.assignee_id !== user.id)`
- 已认领 quota_grab 任务通过 `listTasksApi({ assignee_id })` 查询
- 已认领 quota_grab 任务显示黄色`(已认领数)`标签

## 任务卡片

桌面端展示：任务名称 / 标签 / 策略 / 进度条 / 截止时间
移动端仅显示任务名称和操作按钮，其他信息通过详情 Modal 查看。
""",

    "labeling-workbench/claim.md": """# 认领任务

标注员在任务大厅看到感兴趣的任务后，需先认领才能进入标注。

## 三种认领方式

### 先到先得
点击"认领"即完成。并发场景下 Redis SETNX 锁保证仅一人成功。其他人立即收到"已被认领"提示。

### 指派
无需认领操作。被 Owner 指派后直接在"我的任务"中出现。主动调用认领会返回"指派任务无需认领"。

### 配额抢单
点击"认领"弹出数量选择器：
- 默认每次领取 10 条，受 grab_limit 约束
- 超过 grab_limit 会提示"你已认领 X 条，已达上限"
- `FOR UPDATE SKIP LOCKED` 跳过已被其他事务锁定的行

## 认领后

认领成功 → 出现在"我的任务" → 点击"进入标注"打开工作台
""",

    "labeling-workbench/workbench.md": """# 标注界面

标注工作台是 Labeler 的核心操作区域，采用三栏布局。

## 三栏布局

- **左侧条目队列**：按 `index` 排序的任务条目列表，显示 pending / labeled / skipped 状态
- **中间表单区**：基于 Schema 快照渲染的标注表单，字段联动和校验规则实时生效
- **右侧统计面板**：已提交 / 审核中 / 打回 / 已完成数量统计

## 表单特性

- 动态渲染：表单控件由 Schema 定义的 FieldConfig 数组驱动
- 支持全部物料类型：文本、单选、多选、富文本、JSON、上传、LLM 触发、ShowItem
- 字段联动：可见性联动规则实时生效（如选择 A 显示 B，输入 C 隐藏 D）
- 校验提交：提交前逐字段校验（必填 + 长度 + 正则等），不通过会提示具体错误项

## 操作

- 上一题 / 下一题导航
- 跳过条目（标记 skipped，可回头重做）
- 提交前校验 + 确认弹窗
- 草稿自动保存（3s debounce → localStorage）
""",

    "labeling-workbench/autosave.md": """# 草稿自动保存

标注过程中系统自动将填写进度保存到本地，防止意外关闭或网络波动导致数据丢失。

## 实现机制

1. 每次表单值变更触发 3 秒 debounce
2. 序列化当前表单值为 JSON
3. 存入 `localStorage`，key 含 taskId + itemId
4. 提交成功后清除对应草稿

## 恢复流程

1. 打开标注页面时检测是否有对应条目的草稿数据
2. 有则弹出恢复提示
3. 选"恢复" → 回填上次填写的内容
4. 选"放弃" → 清除草稿，重新开始

> 草稿仅存储在本地浏览器 `localStorage` 中，清除浏览器数据会导致草稿丢失。
""",

    # ── AI 预审 ──
    "ai-review/config.md": """# 配置 AI Agent

LabelHub 的 AI 预审由可配置的 Agent 驱动。Owner 在 AI 配置页面管理 Agent，在创建任务时关联。

## Agent 配置项

- **名称**：Agent 标识（如"商品标注质检 Agent"）
- **系统 Prompt**：指导 LLM 审核行为，支持占位符注入实时数据
- **评分维度**：JSON 数组，定义评估维度（名称 + 描述 + 权重）
- **LLM 模型**：使用的模型标识（如 doubao-pro-32k）

## Prompt 模板

系统 Prompt 中使用占位符，运行时替换为实际数据：
- `{task}` → 任务信息
- `{item}` → 数据集原始内容
- `{result}` → 标注员提交结果
- `{dimensions}` → 评分维度列表

使用 `str.replace()` 安全替换，避免 `str.format()` 的注入风险。

## Agent 池管理

- 后端启动时从 DB 加载所有 Agent 到 `AgentPool`
- 线程池大小由 `.env` 中的 `AGENT_POOL_SIZE` 控制（默认 7）
- API `GET /ai-agents/status` 可查看池状态（空闲 / 繁忙 / 排队数）
""",

    "ai-review/flow.md": """# AI 预审流程

标注员提交后 AI 预审自动触发，全程异步后台执行，不阻塞标注和审核流程。

## 处理流程

```text
1. create_result()     → Labeler 提交标注
2. 检测 ai_agent_id     → 如果有 → 发布 MQ 消息到 labelhub.ai.review
3. ai_worker.py         → 消费 MQ 消息
4. AgentPool.submit()   → 提交到线程池（ThreadPoolExecutor）
5. Agent.run()          → 查 DB 获取 task + item + result
6. 构建 Prompt          → 替换占位符 + 拼接 dimensions 表格
7. POST LLM API         → temperature=0，Function Calling
8. Pydantic 校验        → ReviewResult schema，失败则重试
9. 写 ai_reviews        → 维度分 + 总体分 + 判定 + Prompt 原文
10. 更新 result         → status → review (通过) 或 rejected (打回)
```

## 纠错机制

- temperature=0 减少随机性
- JSON 解析失败时重试（最多 3 次），每次追加错误信息到 prompt
- 3 次重试后仍失败 → ai_review.status = failed，记录 error_message

## 性能特性

- Agent 池并发数：AGENT_POOL_SIZE (可配，默认 7)
- MQ 异步解耦：提交不阻塞，审核结果实时可见
- 审核延迟：取决于 LLM API 响应时间（通常 2-5 秒）
""",

    "ai-review/dimensions.md": """# 评分维度

评分维度定义了 AI 从哪些角度评估标注质量，是预审配置的核心。

## 维度结构

每个维度为一个 JSON 对象：
```json
{
  "name": "准确性",
  "description": "标注是否与原始数据一致，无事实错误",
  "weight": 1.0
}
```

## 常用维度

| 维度 | 检查要点 |
|------|------|
| 相关性 | 标注是否准确回应用户需求，是否答非所问 |
| 准确性 | 标注内容是否正确，无事实错误、数据错误 |
| 格式合规 | 标注格式是否符合规范要求，必填是否完整 |
| 安全性 | 标注是否涉及违规信息、隐私泄露等安全问题 |
| 完整性 | 标注是否覆盖全部要求，有无遗漏字段 |

## LLM 输出格式

使用 Function Calling 确保输出结构化 JSON：

```json
{
  "verdict": "pass",
  "overall_score": 0.85,
  "dimensions": [
    {"name": "准确性", "score": 0.9, "reason": "标注与原始数据一致"},
    {"name": "完整性", "score": 0.8, "reason": "缺少关键词字段"}
  ],
  "summary": "整体质量较好，建议补充关键词"
}
```

- `verdict`: pass（通过）/ reject（打回）/ human_review（人工复核）
- `overall_score`: 0-1 归一化得分
""",

    # ── 人工审核 ──
    "human-review/flow.md": """# 审核流程

人工审核是保证标注质量的最终环节，Reviewer 对标注结果逐条或批量操作。

## 审核状态机

```text
submitted → ai_reviewing → review → final_review → warehouse
                 ↓            ↓           ↓
              rejected ← ← ← ← ← ← ← ← ← ←
```

## 审核节点

| 状态 | 进入条件 | 可执行操作 |
|------|------|------|
| review | AI 审核通过或可疑 | 通过 (final_review) / 打回 (rejected) |
| final_review | 复审通过 | 入库 (warehouse) / 打回 (rejected) |
| warehouse | 终审通过 | 终态，可导出 |
| rejected | 被驳回 | 标注员修改后重新创建提交 (round+1) |

## 审核界面

- **左侧列表**：标注结果列表，按 AI 判定分组（通过/打回/复核）
- **中间表单**：标注内容多轮对比视图 + 评论区
- **右侧面板**：AI 评分进度条 + 审核操作按钮

## 操作约束

- 打回必须填写驳回理由（comment 为空则拦截）
- 状态变更由状态机 `transit()` 校验
- 每次操作记录 AuditLog + flow_history
- REJECTED 可回到 REVIEW（审核员重新打开）
""",

    "human-review/batch.md": """# 批量操作

提升审核效率的关键功能，支持一次性处理多条标注结果。

## 使用流程

1. 在审核列表勾选多个标注条目（Checkbox）
2. 点击"批量通过"或"批量打回"
3. 打回时填写驳回理由
4. 确认执行

## 后端实现

`POST /tasks/{id}/results/batch-review` 接收：
```json
{
  "result_ids": [1, 2, 3],
  "target_status": "final_review",
  "comment": ""
}
```

逐条执行 `review_result()`：
- 单条失败不影响其他条
- 返回汇总结果：`{reviewed: 3, errors: []}`

## 注意事项

- 批量操作同样经过状态机校验
- 打回时必须填 comment
- 全部成功时前端提示"已处理 N 条"
""",

    "human-review/audit.md": """# 审计追溯

LabelHub 为每条标注数据维护完整的操作审计日志，保障全流程可追溯。

## 审计存储

`AuditLog` 表记录每次操作：
- 操作人（actor_id + actor_name + actor_role）
- 操作目标（entity_type + entity_id）
- 任务 ID + 操作前后状态 + 操作类型
- 详细描述 + 时间戳

`TaskItem.flow_history` 记录条目级流转：
```json
[
  {"status": "submitted", "time": "...", "actor": "labeler", "actor_name": "张三", "round": 1},
  {"status": "review", "time": "...", "actor": "reviewer", "actor_name": "李四", "round": 1}
]
```

## 前端展示

- `AuditTimeline` 组件：审核操作时间线
- `FlowTimeline` 组件：条目完整流转历史
- 审核工作台右侧面板展示当前条目的完整操作链路

## 设计特点

- 每次操作自动记录，无需开发者手动调用
- 记录原始状态变更轨迹，不可篡改
- 支持按任务 ID、操作人、操作类型等条件检索
""",

    # ── 数据导出 ──
    "data-export/formats.md": """# 导出格式

LabelHub 支持四种标注结果导出格式，满足不同下游系统需求。

## 四种格式

| 格式 | 扩展名 | 特点 | 适用场景 |
|------|:---:|------|------|
| JSON | `.json` | 结构化数组，`indent=2` | API 对接、程序处理 |
| JSONL | `.jsonl` | 每行一个 JSON 对象 | 大数据量、流式处理 |
| CSV | `.csv` | UTF-8 BOM 编码，Excel 友好 | 数据分析、表格查看 |
| Excel | `.xlsx` | openpyxl 生成，直接打开 | 非技术用户查看 |

## 数据来源

导出数据来自 `LabelResult` 表，筛选 `status IN ('warehouse', 'final_review')` 的结果。每条导出记录包含：
- 数据集原始字段（`original`）
- 标注结果字段（`result`）
- item_id、labeler_id、round
- 可选：reviewer_id、reviewed_at
""",

    "data-export/mapping.md": """# 字段映射

导出时支持自定义输出哪些字段及重命名。

## 功能

- **字段选择**：勾选需导出的字段，未勾选不出现
- **字段重命名**：`result.category` → `类目`
- **审核记录开关**：控制是否包含 reviewer_id、reviewed_at

## 使用方式

1. 选择导出格式
2. 勾选需要导出的字段（不选则导出全部）
3. 在重命名区域输入新列名
4. 打开/关闭"包含审核记录"
5. 点击"开始导出"

## 数据结构

前端传给后端的 `field_mapping` 参数：
```json
{
  "include_review": true,
  "fields": ["item_id", "result.category", "result.keywords"],
  "rename": {"result.category": "类目"}
}
```

后端 `_apply_mapping()` 先通过 `_flatten()` 展平嵌套为 `result.category` 格式，再按 `fields` 过滤、`rename` 重命名。
""",

    "data-export/async.md": """# 异步导出

大数据量导出采用异步处理，避免浏览器等待超时。

## 完整流程

1. 前端点击"开始导出" → POST `/tasks/{id}/exports`
2. 后端创建 ExportJob（status=pending）
3. 发布 MQ 消息到 `labelhub.export`
4. Export Worker 消费消息 → `process_job()`
5. 查询数据 → 生成文件 → 上传 OSS
6. ExportJob 更新：status=done + file_name + item_count
7. 前端每 2 秒轮询状态，完成后提示
8. 用户点击下载 → 后端生成 OSS 签名 URL（HTTPS，10 分钟有效）
9. 浏览器直接下载 OSS 文件

## 容错

- MQ 不可用时，降级为同步处理（API 请求线程完成）
- 导出失败时 `status=failed`，前端显示错误信息
- 组件卸载时自动清理定时器，防止内存泄漏

## 历史记录

- 单任务导出页显示该任务所有历史导出
- 全局导出中心汇总所有任务导出记录
- 支持按状态筛选，"已完成"的显示下载按钮
""",
}

def gen():
    for path, content in FILES.items():
        full = os.path.join(CONTENT, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, 'w', encoding='utf-8') as f:
            f.write(content)
    print(f"Generated {len(FILES)} tutorial files")

if __name__ == "__main__":
    gen()
