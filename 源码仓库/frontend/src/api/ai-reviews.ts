/**
 * ai-reviews.ts — AI 审核 API
 * Author: hongchuwudi
 * Description: 提供 AI 审核记录的查询、重跑及 Agent 统计接口
 */

import apiClient from './client'
import type { AiReviewListResponse, AiReviewDetail, AgentStats } from '@/types/models/ai-review'

/** 获取 AI 审核列表 */
export function listAiReviewsApi(params: {
  task_id?: number
  agent_id?: number
  verdict?: string
  status?: string
  page?: number
  page_size?: number
}) {
  return apiClient.get<AiReviewListResponse>('/ai-reviews/', { params })
}

/** 获取 AI 审核详情 */
export function getAiReviewApi(id: number) {
  return apiClient.get<AiReviewDetail>(`/ai-reviews/${id}`)
}

/** 重跑 AI 审核 */
export function rerunAiReviewApi(id: number) {
  return apiClient.post(`/ai-reviews/${id}/rerun`)
}

/** 获取指定 Agent 的统计 */
export function getAgentStatsApi(agentId: number) {
  return apiClient.get<AgentStats>(`/ai-reviews/agent/${agentId}/stats`)
}

/** 获取所有 Agent 的统计 */
export function getAllAgentStatsApi() {
  return apiClient.get<Record<number, AgentStats>>('/ai-reviews/agents-stats')
}
