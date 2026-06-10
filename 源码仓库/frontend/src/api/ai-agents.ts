/**
 * ai-agents.ts — AI 标注员 API
 * Author: hongchuwudi
 * Description: 提供 AI Agent 的 CRUD 接口
 */

import apiClient from './client'
import type { ApiResponse, PageData } from '@/types'
import type { AiAgentItem, CreateAgentData, UpdateAgentData } from '@/types/models/agent'

// Re-export for backward compat
export type { AiAgentItem }

/** GET /ai-agents/ */
export function listAgentsApi(page = 1, pageSize = 50): Promise<ApiResponse<PageData<AiAgentItem>>> {
  return apiClient.get('/ai-agents/', { params: { page, page_size: pageSize } })
}

/** POST /ai-agents/ */
export function createAgentApi(data: CreateAgentData): Promise<ApiResponse<AiAgentItem>> {
  return apiClient.post('/ai-agents/', data)
}

/** PUT /ai-agents/:id */
export function updateAgentApi(id: number, data: UpdateAgentData): Promise<ApiResponse<AiAgentItem>> {
  return apiClient.put(`/ai-agents/${id}`, data)
}

/** DELETE /ai-agents/:id */
export function deleteAgentApi(id: number): Promise<ApiResponse<AiAgentItem>> {
  return apiClient.delete(`/ai-agents/${id}`)
}
