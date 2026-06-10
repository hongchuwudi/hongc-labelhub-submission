/**
 * task.ts — 标注任务相关类型定义
 * Author: hongchuwudi
 * Description: 定义 LabelTask / LabelResult 等前端 camelCase 类型及后端 API 原始 snake_case 类型
 */

/** 标注任务（前端 camelCase 版） */
export interface LabelTask {
  id: number
  title: string
  description: string
  tags: string
  datasetId: number
  schemaId: number
  ownerId: number
  assigneeId: number | null
  assigneeType: 'labeler' | 'ai_agent'
  deadline: string | null
  quota: number
  distributionStrategy: 'first_come' | 'assigned' | 'quota_grab'
  status: 'draft' | 'published' | 'paused' | 'ended'
  totalItems: number
  completedItems: number
  progress: number
  createdAt: string
  updatedAt: string
}

/** 标注结果——单条数据的标注记录（前端 camelCase 版） */
export interface LabelResult {
  id: number
  taskId: number
  itemId: number
  labelerId: number
  labelerType: 'human' | 'ai'
  data: Record<string, unknown>
  round: number
  status: 'submitted' | 'ai_reviewing' | 'review' | 'final_review' | 'warehouse' | 'rejected'
  comment: string
  reviewerId: number | null
  reviewedAt: string | null
  aiScores: Record<string, number> | null
  createdAt: string
}

// ── 以下为后端 API 原始 snake_case 类型 ──

/** 任务列表项（API 原始格式） */
export interface TaskListItem {
  id: number
  title: string
  description: string
  tags: string
  status: string
  dataset_id: number
  schema_id: number
  ai_agent_id: number | null
  owner_id: number
  assignee_id: number | null
  assignee_type: string
  distribution_strategy: string
  grab_limit: number | null
  quota: number
  reward_per_item: number | null
  reward_cap: number | null
  total_items: number
  completed_items: number
  claimed_items: number
  progress: number
  deadline: string | null
  schema_snapshot: Record<string, unknown> | null
  schema_version: number
  created_at: string
  updated_at: string
}

/** 任务详情 */
export type TaskDetail = TaskListItem

/** 创建任务请求 */
export interface CreateTaskData {
  title: string
  description?: string
  tags?: string
  dataset_id: number
  schema_id: number
  assignee_id?: number | null
  distribution_strategy?: string
  grab_limit?: number | null
  quota?: number
  reward_per_item?: number | null
  reward_cap?: number | null
  deadline?: string | null
}

/** 更新任务请求 */
export interface UpdateTaskData {
  title?: string
  description?: string
  tags?: string
  dataset_id?: number
  schema_id?: number
  ai_agent_id?: number | null
  assignee_id?: number | null
  assignee_type?: string
  status?: string
  quota?: number
  reward_per_item?: number | null
  reward_cap?: number | null
  deadline?: string | null
  distribution_strategy?: string
  grab_limit?: number | null
}

/** 提交标注结果请求 */
export interface SubmitResultData {
  item_id: number
  data: Record<string, unknown>
  round?: number
}

/** 标注任务条目（API 原始格式） */
export interface TaskItemResponse {
  id: number
  index: number
  data: Record<string, unknown>
  status: 'pending' | 'labeled' | 'skipped'
  flow_history: FlowEntry[]
  labeler_id: number | null
  last_result?: {
    id: number
    task_id: number
    item_id: number
    labeler_id: number
    data: Record<string, unknown>
    round: number
    status: string
    comment: string
    ai_scores?: {
      verdict: string
      summary: string
      dimensions: { name: string; score: number; reason?: string }[]
      overall_score: number
    } | null
  } | null
}

/** 流转历史条目 */
export interface FlowEntry {
  status: string
  time: string
  actor: string
  actor_name: string
  round: number
  detail: string
}

/** 标注任务条目详情 */
export interface TaskItemDetail extends TaskItemResponse {
  last_result: {
    id: number
    task_id: number
    item_id: number
    labeler_id: number
    labeler_type: string
    data: Record<string, unknown>
    round: number
    status: 'submitted' | 'ai_reviewing' | 'review' | 'final_review' | 'warehouse' | 'rejected'
    comment: string
    reviewer_id: number | null
    reviewed_at: string | null
    ai_scores: {
      verdict: string
      summary: string
      dimensions: { name: string; score: number; reason?: string }[]
      overall_score: number
    } | null
    created_at: string
  } | null
}

/** 标注员统计数据 */
export interface LabelerStats {
  pending: number
  in_review: number
  rejected: number
  done: number
  total: number
}

/** 标注结果条目（API 原始格式） */
export interface LabelResultItem {
  id: number
  task_id: number
  item_id: number
  labeler_id: number
  labeler_type: string
  data: Record<string, unknown>
  round: number
  status: 'submitted' | 'ai_reviewing' | 'review' | 'final_review' | 'warehouse' | 'rejected'
  comment: string
  reviewer_id: number | null
  reviewed_at: string | null
  ai_scores: Record<string, unknown> | null
  created_at: string
}

/** 审计日志条目 */
export interface AuditLogEntry {
  id: number
  actor_id: number
  actor_name: string
  actor_role: string
  entity_type: string
  entity_id: number
  task_id: number
  action: string
  from_status: string
  to_status: string
  detail: string
  created_at: string
}

/** 导出任务 */
export interface ExportJob {
  id: number
  task_id: number
  format: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  file_name: string
  item_count: number
  field_mapping: string | null
  error_message: string | null
  created_at: string
  finished_at: string | null
}
