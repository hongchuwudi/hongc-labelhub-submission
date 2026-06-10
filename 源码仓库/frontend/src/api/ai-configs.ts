/**
 * ai-configs.ts — AI 审核配置 API（已废弃）
 * Author: hongchuwudi
 * Description: 提供 AI 审核配置的 CRUD 接口，保留用于旧数据兼容
 */

import apiClient from './client'
import type { ApiResponse, PageData } from '@/types'
import type { AiConfigItem } from '@/types/models/ai-config'

// Re-export for backward compat
export type { AiConfigItem }

/** GET /ai-configs/ */
export function listAiConfigsApi(page = 1, pageSize = 50): Promise<ApiResponse<PageData<AiConfigItem>>> {
  return apiClient.get('/ai-configs/', { params: { page, page_size: pageSize } })
}

/** GET /ai-configs/:id */
export function getAiConfigApi(id: number): Promise<ApiResponse<AiConfigItem>> {
  return apiClient.get(`/ai-configs/${id}`)
}

/** POST /ai-configs/ */
export function createAiConfigApi(data: {
  name: string
  system_prompt: string
  scoring_dimensions: { name: string; label: string; weight: number }[]
  llm_model?: string
  created_by: number
}): Promise<ApiResponse<AiConfigItem>> {
  return apiClient.post('/ai-configs/', data)
}

/** PUT /ai-configs/:id */
export function updateAiConfigApi(id: number, data: {
  name?: string
  system_prompt?: string
  scoring_dimensions?: { name: string; label: string; weight: number }[]
  llm_model?: string
}): Promise<ApiResponse<AiConfigItem>> {
  return apiClient.put(`/ai-configs/${id}`, data)
}

/** DELETE /ai-configs/:id */
export function deleteAiConfigApi(id: number): Promise<ApiResponse<unknown>> {
  return apiClient.delete(`/ai-configs/${id}`)
}
