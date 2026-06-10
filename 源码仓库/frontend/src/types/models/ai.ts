/**
 * ai.ts — AI 评分数据类型定义
 * Author: hongchuwudi
 * Description: 定义 AiScoreData，描述 AI 审核返回的评分结果结构
 */

/** AI 评分数据 */
export interface AiScoreData {
  verdict: string
  summary?: string
  dimensions?: { name: string; score: number; reason?: string }[]
  overall_score?: number
  model?: string
  reviewed_at?: string
  reviewer_name?: string
  reviewer_type?: string
  prompt_template?: string
  prompt_vars?: Record<string, unknown>
}
