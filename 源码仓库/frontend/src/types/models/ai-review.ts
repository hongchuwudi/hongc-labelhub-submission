/**
 * ai-review.ts — AI 审核类型定义
 * Author: hongchuwudi
 * Description: 定义 AiReviewItem / AiReviewDetail / AgentStats 等 AI 审核相关类型
 */

/** AI 审核记录条目 */
export interface AiReviewItem {
  id: number
  task_id: number
  item_id: number
  result_id: number
  agent_name: string
  verdict: string | null
  overall_score: number | null
  status: string
  duration_ms: number | null
  error_message: string | null
  created_at: string
  finished_at: string | null
  task_title: string | null
  item_summary: string | null
}

/** AI 审核详情 */
export interface AiReviewDetail {
  id: number
  task_id: number
  item_id: number
  result_id: number
  agent_id: number
  agent_name: string
  agent_model: string | null
  verdict: string | null
  summary: string | null
  dimensions: { name: string; score: number; reason?: string }[] | null
  overall_score: number | null
  model: string | null
  prompt_template: string | null
  prompt_vars: Record<string, unknown> | null
  status: string
  error_message: string | null
  duration_ms: number | null
  created_at: string
  finished_at: string | null
  task_title: string | null
  result_data: Record<string, unknown> | null
  item_data: Record<string, unknown> | null
}

/** AI 审核列表响应 */
export interface AiReviewListResponse {
  total: number
  page: number
  page_size: number
  items: AiReviewItem[]
}

/** AI Agent 统计数据 */
export interface AgentStats {
  total: number
  passed: number
  rejected: number
  failed: number
  avg_duration_ms: number
  pass_rate: number
}

/** AI 审核显示配置 */
export const AI_STATUS_CONFIG = {
  pending: { color: '#d1d5db', label: '等待中' },
  processing: { color: '#3b82f6', label: '审核中' },
  done: { color: '#10b981', label: '已完成' },
  failed: { color: '#ef4444', label: '失败' },
} as const

/** AI 审核 verdict 显示配置 */
export const AI_VERDICT_CONFIG = {
  pass: { color: '#10b981', label: '建议通过' },
  reject: { color: '#ef4444', label: '建议驳回' },
  human_review: { color: '#f59e0b', label: '转人工审核' },
} as const

/** AI 审核处理步骤常量 */
export const AI_PROCESS_STEPS = ['queued', 'calling', 'done', 'failed'] as const
/** AI 审核处理步骤类型 */
export type AiProcessStep = (typeof AI_PROCESS_STEPS)[number]
