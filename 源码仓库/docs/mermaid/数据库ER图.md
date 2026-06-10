# LabelHub 数据库 ER 图

```mermaid
erDiagram
    %% ============================================================
    %% 核心实体
    %% ============================================================

    users {
        int id PK
        string name
        string email UK
        string role "owner/labeler/reviewer/ai_agent"
        string password_hash
        string avatar
        datetime created_at
        datetime updated_at
    }

    datasets {
        int id PK
        string name
        text description
        string format "json/jsonl/csv/excel"
        int item_count
        int owner_id FK
        datetime created_at
        datetime updated_at
    }

    dataset_items {
        int id PK
        int dataset_id FK "CASCADE"
        int index
        json data
        datetime created_at
        datetime updated_at
    }

    label_schemas {
        int id PK
        string name
        int version
        json schema
        json version_history
        int owner_id FK
        datetime created_at
        datetime updated_at
    }

    %% ============================================================
    %% 任务核心
    %% ============================================================

    tasks {
        int id PK
        string title
        text description
        string tags
        int dataset_id FK
        int schema_id FK
        int ai_agent_id FK "nullable"
        int owner_id FK
        int assignee_id FK "nullable"
        string distribution_strategy "first_come/quota_grab/assigned"
        int grab_limit "nullable"
        int quota
        int total_items
        int completed_items
        float reward_per_item "nullable"
        float reward_cap "nullable"
        datetime deadline "nullable"
        string status "draft/published/paused/ended"
        datetime created_at
        datetime updated_at
    }

    task_items {
        int id PK
        int task_id FK "CASCADE"
        int dataset_item_id FK
        int labeler_id FK "nullable"
        string status "pending/labeled/skipped"
        json flow_history "nullable"
        datetime created_at
        datetime updated_at
    }

    results {
        int id PK
        int task_id FK "CASCADE"
        int item_id FK
        int labeler_id
        string labeler_type
        json data
        int round
        string status "submitted/ai_reviewing/review/final_review/warehouse/rejected"
        string comment
        int reviewer_id FK "nullable"
        datetime reviewed_at "nullable"
        json ai_scores "nullable"
        datetime created_at
    }

    %% ============================================================
    %% AI 相关
    %% ============================================================

    ai_agents {
        int id PK
        string name
        string email UK
        string password_hash
        text system_prompt
        json scoring_dimensions
        string llm_model
        int created_by FK
        datetime created_at
        datetime updated_at
    }

    ai_reviews {
        int id PK
        int task_id FK
        int item_id FK
        int result_id FK "UNIQUE"
        int agent_id FK
        string verdict "pass/reject/human_review"
        float overall_score
        json dimensions
        text summary
        text prompt_template
        json prompt_vars
        string status "pending/processing/done/failed"
        text error_message "nullable"
        int duration_ms "nullable"
        datetime created_at
        datetime finished_at "nullable"
    }

    %% ============================================================
    %% 辅助
    %% ============================================================

    audit_logs {
        int id PK
        int actor_id
        string actor_name
        string actor_role
        string entity_type
        int entity_id
        int task_id FK "CASCADE"
        string action
        string from_status
        string to_status
        text detail
        datetime created_at
    }

    export_jobs {
        int id PK
        int task_id FK "CASCADE"
        int requested_by FK
        string format "json/jsonl/csv/xlsx"
        string status "pending/processing/done/failed"
        string file_path "nullable"
        string file_name "nullable"
        text field_mapping "nullable"
        int item_count "nullable"
        text error_message "nullable"
        datetime created_at
        datetime finished_at "nullable"
    }

    %% ============================================================
    %% 关系
    %% ============================================================

    users ||--o{ datasets: "owner_id"
    users ||--o{ label_schemas: "owner_id"
    users ||--o{ tasks: "owner_id"
    users ||--o{ tasks: "assignee_id"
    users ||--o{ task_items: "labeler_id"
    users ||--o{ results: "reviewer_id"
    users ||--o{ ai_agents: "created_by"
    users ||--o{ export_jobs: "requested_by"

    datasets ||--o{ dataset_items: "dataset_id (CASCADE)"
    datasets ||--o{ tasks: "dataset_id"

    dataset_items ||--o{ task_items: "dataset_item_id"
    dataset_items ||--o{ results: "item_id"
    dataset_items ||--o{ ai_reviews: "item_id"

    label_schemas ||--o{ tasks: "schema_id"

    tasks ||--o{ task_items: "task_id (CASCADE)"
    tasks ||--o{ results: "task_id (CASCADE)"
    tasks ||--o{ ai_reviews: "task_id"
    tasks ||--o{ audit_logs: "task_id (CASCADE)"
    tasks ||--o{ export_jobs: "task_id (CASCADE)"
    tasks ||--o| ai_agents: "ai_agent_id"

    results ||--|| ai_reviews: "result_id (UNIQUE)"

    ai_agents ||--o{ ai_reviews: "agent_id"
```

## 核心关系链

```
主线: User(owner) ──→ Dataset ──→ DatasetItem
                        │                │
                        ▼                ▼
User(owner) → LabelSchema    Task ──→ TaskItem ──→ LabelResult ──1:1──→ AiReview ──→ AiAgent
                        │         │                │
                        │         ▼                ▼
                        │    User(labeler)    User(reviewer)
                        │
                        ├──→ AuditLog
                        └──→ ExportJob
```

## 关键索引

| 表 | 索引 |
|----|------|
| task_items | (task_id, labeler_id, status) |
| ai_reviews | (task_id), (agent_id) |
| tasks | (owner_id), (status) |
| ai_agents | (email) UNIQUE |
| ai_reviews | (result_id) UNIQUE |
