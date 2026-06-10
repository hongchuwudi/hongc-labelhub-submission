# LabelHub API 文档

> 自动生成自 FastAPI OpenAPI Schema，含测试用例

## 接口总览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | Root |
| GET | `/api/ai-agents/` | List Agents |
| POST | `/api/ai-agents/` | Create Agent |
| GET | `/api/ai-agents/status` | Get Agents Status |
| PUT | `/api/ai-agents/{agent_id}` | Update Agent |
| DELETE | `/api/ai-agents/{agent_id}` | Delete Agent |
| GET | `/api/ai-configs/` | List Configs |
| POST | `/api/ai-configs/` | Create Config |
| GET | `/api/ai-configs/{config_id}` | Get Config |
| PUT | `/api/ai-configs/{config_id}` | Update Config |
| DELETE | `/api/ai-configs/{config_id}` | Delete Config |
| GET | `/api/ai-reviews/` | List Reviews |
| GET | `/api/ai-reviews/agent/{agent_id}/stats` | Agent Stats |
| GET | `/api/ai-reviews/agents-stats` | All Agent Stats |
| GET | `/api/ai-reviews/{review_id}` | Get Review |
| POST | `/api/ai-reviews/{review_id}/rerun` | Rerun Review |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Me |
| POST | `/api/auth/refresh` | Refresh |
| POST | `/api/auth/register` | Register |
| GET | `/api/dashboard/datasets-stats` | Get Datasets Stats |
| GET | `/api/dashboard/my-datasets-stats` | Get My Datasets Stats |
| GET | `/api/dashboard/stats` | Get Dashboard Stats |
| GET | `/api/dashboard/tasks-progress` | Get Tasks Progress |
| GET | `/api/datasets/` | List Datasets |
| POST | `/api/datasets/` | Create Dataset |
| GET | `/api/datasets/{dataset_id}` | Get Dataset |
| PATCH | `/api/datasets/{dataset_id}` | Update Dataset |
| DELETE | `/api/datasets/{dataset_id}` | Delete Dataset |
| GET | `/api/datasets/{dataset_id}/items` | List Items |
| POST | `/api/datasets/{dataset_id}/items` | Create Item |
| POST | `/api/datasets/{dataset_id}/items/batch` | Batch Create Items |
| POST | `/api/datasets/{dataset_id}/items/batch-delete` | Batch Delete Items |
| GET | `/api/datasets/{dataset_id}/items/{item_id}` | Get Item |
| PATCH | `/api/datasets/{dataset_id}/items/{item_id}` | Update Item |
| DELETE | `/api/datasets/{dataset_id}/items/{item_id}` | Delete Item |
| POST | `/api/llm-trigger/` | Llm Trigger |
| GET | `/api/schemas/` | List Schemas |
| POST | `/api/schemas/` | Create Schema |
| GET | `/api/schemas/{schema_id}` | Get Schema |
| PUT | `/api/schemas/{schema_id}` | Update Schema |
| DELETE | `/api/schemas/{schema_id}` | Delete Schema |
| GET | `/api/tasks/` | List Tasks |
| POST | `/api/tasks/` | Create Task |
| GET | `/api/tasks/exports/{job_id}` | Get Export |
| GET | `/api/tasks/exports/{job_id}/download` | Download Export |
| GET | `/api/tasks/{task_id}` | Get Task |
| PATCH | `/api/tasks/{task_id}` | Update Task |
| DELETE | `/api/tasks/{task_id}` | Delete Task |
| GET | `/api/tasks/{task_id}/audit-logs` | List Audit Logs |
| POST | `/api/tasks/{task_id}/claim` | Claim Task |
| POST | `/api/tasks/{task_id}/exports` | Create Export |
| GET | `/api/tasks/{task_id}/exports` | List Exports |
| GET | `/api/tasks/{task_id}/items` | List Task Items |
| GET | `/api/tasks/{task_id}/items/{item_id}` | Get Task Item |
| POST | `/api/tasks/{task_id}/items/{item_id}/skip` | Skip Task Item |
| GET | `/api/tasks/{task_id}/my-results` | List My Results |
| GET | `/api/tasks/{task_id}/my-stats` | Get My Stats |
| GET | `/api/tasks/{task_id}/results` | List Results |
| POST | `/api/tasks/{task_id}/results` | Create Result |
| POST | `/api/tasks/{task_id}/results/batch-review` | Batch Review |
| PATCH | `/api/tasks/{task_id}/results/{result_id}` | Review Result |
| POST | `/api/upload/` | Upload File |
| POST | `/api/users/` | Create Agent |
| GET | `/api/users/` | List Users |
| GET | `/health` | Health |

---

## 接口详情

### GET /

分组: Other
说明: Root

---

### GET /api/ai-agents/

分组: ai-agents
说明: List Agents

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| page | query | integer | 否 |  |
| page_size | query | integer | 否 |  |

---

### POST /api/ai-agents/

分组: ai-agents
说明: Create Agent

**请求示例**:
```json
{
  "name": "文本审核Agent",
  "email": "text-reviewer@ai.labelhub.com",
  "password": "agent123",
  "system_prompt": "你是一个专业的数据标注审核专家。请根据以下信息对标注结果进行评分：\n\n【评分维度】\n{dimensions}\n\n【任务信息】\n{task}\n\n【原始数据】\n{item}\n\n【标注结果】\n{result}\n\n请严格按照评分维度逐一评分，给出 0-1 之间的分数。",
  "scoring_dimensions": [
    {
      "name": "accuracy",
      "label": "准确性",
      "weight": 0.4
    },
    {
      "name": "format",
      "label": "格式合规",
      "weight": 0.3
    },
    {
      "name": "completeness",
      "label": "完整性",
      "weight": 0.3
    }
  ],
  "llm_model": "gpt-4o"
}
```

---

### GET /api/ai-agents/status

分组: ai-agents
说明: Get Agents Status

---

### DELETE /api/ai-agents/{agent_id}

分组: ai-agents
说明: Delete Agent

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| agent_id | path | integer | 是 |  |

---

### PUT /api/ai-agents/{agent_id}

分组: ai-agents
说明: Update Agent

**请求示例**:
```json
{
  "name": "文本审核Agent v2",
  "system_prompt": "更新后的 Prompt 模板...",
  "scoring_dimensions": [
    {
      "name": "accuracy",
      "label": "准确性",
      "weight": 0.5
    },
    {
      "name": "format",
      "label": "格式合规",
      "weight": 0.2
    },
    {
      "name": "completeness",
      "label": "完整性",
      "weight": 0.2
    },
    {
      "name": "safety",
      "label": "安全性",
      "weight": 0.1
    }
  ]
}
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| agent_id | path | integer | 是 |  |

---

### GET /api/ai-configs/

分组: ai-configs
说明: List Configs

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| page | query | integer | 否 |  |
| page_size | query | integer | 否 |  |

---

### POST /api/ai-configs/

分组: ai-configs
说明: Create Config

---

### DELETE /api/ai-configs/{config_id}

分组: ai-configs
说明: Delete Config

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| config_id | path | integer | 是 |  |

---

### GET /api/ai-configs/{config_id}

分组: ai-configs
说明: Get Config

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| config_id | path | integer | 是 |  |

---

### PUT /api/ai-configs/{config_id}

分组: ai-configs
说明: Update Config

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| config_id | path | integer | 是 |  |

---

### GET /api/ai-reviews/

分组: ai-reviews
说明: List Reviews

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | query |  | 否 |  |
| agent_id | query |  | 否 |  |
| verdict | query |  | 否 |  |
| status | query |  | 否 |  |
| page | query | integer | 否 |  |
| page_size | query | integer | 否 |  |

---

### GET /api/ai-reviews/agent/{agent_id}/stats

分组: ai-reviews
说明: Agent Stats

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| agent_id | path | integer | 是 |  |

---

### GET /api/ai-reviews/agents-stats

分组: ai-reviews
说明: All Agent Stats

---

### GET /api/ai-reviews/{review_id}

分组: ai-reviews
说明: Get Review

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| review_id | path | integer | 是 |  |

---

### POST /api/ai-reviews/{review_id}/rerun

分组: ai-reviews
说明: Rerun Review

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| review_id | path | integer | 是 |  |

---

### POST /api/auth/login

分组: auth
说明: Login

**请求示例**:
```json
{
  "email": "admin@labelhub.com",
  "password": "admin123"
}
```

---

### GET /api/auth/me

分组: auth
说明: Me

---

### POST /api/auth/refresh

分组: auth
说明: Refresh

**请求示例**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImp0aSI6InNhbXBsZSIsImV4cCI6OTk5OTk5OTk5OX0.sample"
}
```

---

### POST /api/auth/register

分组: auth
说明: Register

**请求示例**:
```json
{
  "name": "张三",
  "email": "zhangsan@test.com",
  "password": "123456",
  "role": "labeler"
}
```

---

### GET /api/dashboard/datasets-stats

分组: dashboard
说明: Get Datasets Stats

---

### GET /api/dashboard/my-datasets-stats

分组: dashboard
说明: Get My Datasets Stats

---

### GET /api/dashboard/stats

分组: dashboard
说明: Get Dashboard Stats

---

### GET /api/dashboard/tasks-progress

分组: dashboard
说明: Get Tasks Progress

---

### GET /api/datasets/

分组: datasets
说明: List Datasets

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| page | query | integer | 否 |  |
| page_size | query | integer | 否 |  |

---

### POST /api/datasets/

分组: datasets
说明: Create Dataset

**请求示例**:
```json
{
  "name": "图片分类样本 v1",
  "description": "包含 1000 张图片的多分类标注数据",
  "format": "json"
}
```

---

### DELETE /api/datasets/{dataset_id}

分组: datasets
说明: Delete Dataset

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| dataset_id | path | integer | 是 |  |

---

### GET /api/datasets/{dataset_id}

分组: datasets
说明: Get Dataset

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| dataset_id | path | integer | 是 |  |

---

### PATCH /api/datasets/{dataset_id}

分组: datasets
说明: Update Dataset

**请求示例**:
```json
{
  "name": "图片分类样本 v2",
  "description": "新增 200 条数据后的更新版本"
}
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| dataset_id | path | integer | 是 |  |

---

### GET /api/datasets/{dataset_id}/items

分组: items
说明: List Items

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| dataset_id | path | integer | 是 |  |
| page | query | integer | 否 |  |
| page_size | query | integer | 否 |  |

---

### POST /api/datasets/{dataset_id}/items

分组: items
说明: Create Item

**请求示例**:
```json
{
  "index": 0,
  "data": {
    "text": "今天天气真好，适合出去散步。",
    "label": "positive"
  }
}
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| dataset_id | path | integer | 是 |  |

---

### POST /api/datasets/{dataset_id}/items/batch

分组: items
说明: Batch Create Items

**请求示例**:
```json
{
  "items": [
    {
      "index": 0,
      "data": {
        "text": "产品非常好用，推荐购买。",
        "label": "positive"
      }
    },
    {
      "index": 1,
      "data": {
        "text": "物流太慢了，包装也破损了。",
        "label": "negative"
      }
    }
  ]
}
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| dataset_id | path | integer | 是 |  |

---

### POST /api/datasets/{dataset_id}/items/batch-delete

分组: items
说明: Batch Delete Items

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| dataset_id | path | integer | 是 |  |

---

### DELETE /api/datasets/{dataset_id}/items/{item_id}

分组: items
说明: Delete Item

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| dataset_id | path | integer | 是 |  |
| item_id | path | integer | 是 |  |

---

### GET /api/datasets/{dataset_id}/items/{item_id}

分组: items
说明: Get Item

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| dataset_id | path | integer | 是 |  |
| item_id | path | integer | 是 |  |

---

### PATCH /api/datasets/{dataset_id}/items/{item_id}

分组: items
说明: Update Item

**请求示例**:
```json
{
  "data": {
    "text": "更新后的文本内容",
    "label": "neutral"
  }
}
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| dataset_id | path | integer | 是 |  |
| item_id | path | integer | 是 |  |

---

### POST /api/llm-trigger/

分组: llm
说明: Llm Trigger

**请求示例**:
```json
{
  "task_id": 1,
  "item_id": 42,
  "field_key": "summary",
  "field_title": "内容摘要"
}
```

---

### GET /api/schemas/

分组: schemas
说明: List Schemas

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| page | query | integer | 否 |  |
| page_size | query | integer | 否 |  |

---

### POST /api/schemas/

分组: schemas
说明: Create Schema

**请求示例**:
```json
{
  "name": "文本分类标注模板",
  "schema": {
    "type": "object",
    "properties": {
      "category": {
        "type": "string",
        "enum": [
          "科技",
          "体育",
          "娱乐"
        ],
        "title": "分类"
      },
      "sentiment": {
        "type": "string",
        "enum": [
          "positive",
          "negative",
          "neutral"
        ],
        "title": "情感"
      }
    }
  }
}
```

---

### DELETE /api/schemas/{schema_id}

分组: schemas
说明: Delete Schema

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| schema_id | path | integer | 是 |  |

---

### GET /api/schemas/{schema_id}

分组: schemas
说明: Get Schema

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| schema_id | path | integer | 是 |  |

---

### PUT /api/schemas/{schema_id}

分组: schemas
说明: Update Schema

**请求示例**:
```json
{
  "name": "文本分类标注模板 v2",
  "schema": {
    "type": "object",
    "properties": {
      "category": {
        "type": "string",
        "enum": [
          "科技",
          "体育",
          "娱乐",
          "财经"
        ],
        "title": "分类"
      }
    }
  }
}
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| schema_id | path | integer | 是 |  |

---

### GET /api/tasks/

分组: tasks
说明: List Tasks

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| dataset_id | query |  | 否 |  |
| assignee_id | query |  | 否 |  |
| status | query |  | 否 |  |
| tags | query |  | 否 |  |
| page | query | integer | 否 |  |
| page_size | query | integer | 否 |  |

---

### POST /api/tasks/

分组: tasks
说明: Create Task

**请求示例**:
```json
{
  "title": "文本情感分类标注任务",
  "description": "对用户评论进行情感极性标注，包含 1000 条数据",
  "tags": "情感分析,NLP",
  "dataset_id": 1,
  "schema_id": 1,
  "quota": 100,
  "distribution_strategy": "first_come",
  "reward_per_item": 0.5,
  "reward_cap": 200.0,
  "deadline": "2026-12-31T23:59:59"
}
```

---

### GET /api/tasks/exports/{job_id}

分组: tasks
说明: Get Export

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| job_id | path | integer | 是 |  |

---

### GET /api/tasks/exports/{job_id}/download

分组: tasks
说明: Download Export

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| job_id | path | integer | 是 |  |

---

### DELETE /api/tasks/{task_id}

分组: tasks
说明: Delete Task

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |

---

### GET /api/tasks/{task_id}

分组: tasks
说明: Get Task

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |

---

### PATCH /api/tasks/{task_id}

分组: tasks
说明: Update Task

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |

---

### GET /api/tasks/{task_id}/audit-logs

分组: tasks
说明: List Audit Logs

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |
| limit | query | integer | 否 |  |

---

### POST /api/tasks/{task_id}/claim

分组: tasks
说明: Claim Task

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |
| count | query |  | 否 |  |

---

### GET /api/tasks/{task_id}/exports

分组: tasks
说明: List Exports

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |

---

### POST /api/tasks/{task_id}/exports

分组: tasks
说明: Create Export

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |
| format | query | string | 否 | json / jsonl / csv / xlsx |
| field_mapping | query | string | 否 | JSON: {fields:[...], rename:{...}, include_review:bool} |

---

### GET /api/tasks/{task_id}/items

分组: tasks
说明: List Task Items

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |
| status | query |  | 否 | 按状态筛选: pending / labeled / skipped |

---

### GET /api/tasks/{task_id}/items/{item_id}

分组: tasks
说明: Get Task Item

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |
| item_id | path | integer | 是 |  |

---

### POST /api/tasks/{task_id}/items/{item_id}/skip

分组: tasks
说明: Skip Task Item

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |
| item_id | path | integer | 是 |  |

---

### GET /api/tasks/{task_id}/my-results

分组: tasks
说明: List My Results

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |

---

### GET /api/tasks/{task_id}/my-stats

分组: tasks
说明: Get My Stats

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |

---

### GET /api/tasks/{task_id}/results

分组: tasks
说明: List Results

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |

---

### POST /api/tasks/{task_id}/results

分组: tasks
说明: Create Result

**请求示例**:
```json
{
  "item_id": 1,
  "data": {
    "category": "科技",
    "sentiment": "positive",
    "keywords": [
      "AI",
      "芯片",
      "创新"
    ]
  },
  "round": 1
}
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |

---

### POST /api/tasks/{task_id}/results/batch-review

分组: tasks
说明: Batch Review

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |
| result_ids | query | array | 是 | 要审核的结果 ID 列表 |
| target_status | query | string | 是 | final_review / warehouse / rejected |
| comment | query | string | 否 | 驳回时必填理由 |

---

### PATCH /api/tasks/{task_id}/results/{result_id}

分组: tasks
说明: Review Result

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| task_id | path | integer | 是 |  |
| result_id | path | integer | 是 |  |
| target_status | query | string | 是 | final_review(初审通过) / warehouse(终审通过) / rejected(打回) |
| comment | query | string | 否 | 驳回时必填理由 |

---

### POST /api/upload/

分组: upload
说明: Upload File

---

### GET /api/users/

分组: users
说明: List Users

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| role | query |  | 否 | 按角色筛选: labeler / reviewer / ai_agent |

---

### POST /api/users/

分组: users
说明: Create Agent

**请求示例**:
```json
{
  "name": "AI标注员Bot",
  "email": "bot@ai.labelhub.com",
  "password": "bot123456"
}
```

---

### GET /health

分组: Other
说明: Health

---
