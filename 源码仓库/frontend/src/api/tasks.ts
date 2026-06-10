/**
 * tasks.ts — 标注任务 API
 * Author: hongchuwudi
 * Description: 提供任务的 CRUD、标注结果提交/审核、标注工作台及数据导出接口
 */

import apiClient from './client'
import type { ApiResponse, PageData } from '@/types'
import type {
  TaskListItem,
  TaskDetail,
  CreateTaskData,
  UpdateTaskData,
  SubmitResultData,
  LabelResultItem,
  TaskItemResponse,
  TaskItemDetail,
  LabelerStats,
  AuditLogEntry,
  ExportJob,
  FlowEntry,
} from '@/types/models/task'

// Re-export for backward compat (page code imports these from api/)
export type {
  TaskListItem,
  TaskDetail,
  CreateTaskData,
  UpdateTaskData,
  SubmitResultData,
  LabelResultItem,
  TaskItemResponse,
  TaskItemDetail,
  LabelerStats,
  AuditLogEntry,
  ExportJob,
  FlowEntry,
}

/** GET /tasks/ */
export function listTasksApi(params?: {
  dataset_id?: number
  assignee_id?: number
  status?: string
  tags?: string
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageData<TaskListItem>>> {
  return apiClient.get('/tasks/', { params })
}

/** GET /tasks/:id */
export function getTaskApi(id: number): Promise<ApiResponse<TaskDetail>> {
  return apiClient.get(`/tasks/${id}`)
}

/** POST /tasks/ */
export function createTaskApi(data: CreateTaskData): Promise<ApiResponse<TaskDetail>> {
  return apiClient.post('/tasks/', data)
}

/** PATCH /tasks/:id */
export function updateTaskApi(id: number, data: UpdateTaskData): Promise<ApiResponse<TaskDetail>> {
  return apiClient.patch(`/tasks/${id}`, data)
}

/** POST /tasks/:id/claim */
export function claimTaskApi(id: number, count?: number): Promise<ApiResponse<TaskDetail>> {
  const params = count ? { count } : {}
  return apiClient.post(`/tasks/${id}/claim`, null, { params })
}

/** DELETE /tasks/:id */
export function deleteTaskApi(id: number): Promise<ApiResponse<unknown>> {
  return apiClient.delete(`/tasks/${id}`)
}

/** POST /tasks/:id/results */
export function submitResultApi(taskId: number, data: SubmitResultData): Promise<ApiResponse<unknown>> {
  return apiClient.post(`/tasks/${taskId}/results`, data)
}

/** GET /tasks/:id/results */
export function listResultsApi(taskId: number): Promise<ApiResponse<LabelResultItem[]>> {
  return apiClient.get(`/tasks/${taskId}/results`)
}

/** PATCH /tasks/:id/results/:result_id */
export function reviewResultApi(
  taskId: number,
  resultId: number,
  targetStatus: string,
  comment?: string,
): Promise<ApiResponse<LabelResultItem>> {
  return apiClient.patch(`/tasks/${taskId}/results/${resultId}`, null, {
    params: { target_status: targetStatus, comment: comment || '' },
  })
}

/** POST /tasks/:id/results/batch-review */
export function batchReviewApi(
  taskId: number,
  resultIds: number[],
  targetStatus: string,
  comment?: string,
): Promise<ApiResponse<{ reviewed: number; errors: { result_id: number; error: string }[] }>> {
  return apiClient.post(`/tasks/${taskId}/results/batch-review`, null, {
    params: { result_ids: resultIds, target_status: targetStatus, comment: comment || '' },
  })
}

/** GET /tasks/:id/audit-logs */
export function listAuditLogsApi(taskId: number, limit?: number): Promise<ApiResponse<AuditLogEntry[]>> {
  return apiClient.get(`/tasks/${taskId}/audit-logs`, { params: { limit: limit || 50 } })
}

// ── 标注工作台 ──

/** GET /tasks/:id/items */
export function listTaskItemsApi(taskId: number, status?: string): Promise<ApiResponse<TaskItemResponse[]>> {
  return apiClient.get(`/tasks/${taskId}/items`, { params: status ? { status } : undefined })
}

/** GET /tasks/:id/items/:item_id */
export function getTaskItemApi(taskId: number, itemId: number): Promise<ApiResponse<TaskItemDetail>> {
  return apiClient.get(`/tasks/${taskId}/items/${itemId}`)
}

/** POST /tasks/:id/items/:item_id/skip */
export function skipTaskItemApi(taskId: number, itemId: number): Promise<ApiResponse<unknown>> {
  return apiClient.post(`/tasks/${taskId}/items/${itemId}/skip`)
}

/** GET /tasks/:id/my-results */
export function listMyResultsApi(taskId: number): Promise<ApiResponse<LabelResultItem[]>> {
  return apiClient.get(`/tasks/${taskId}/my-results`)
}

/** GET /tasks/:id/my-stats */
export function getMyStatsApi(taskId: number): Promise<ApiResponse<LabelerStats>> {
  return apiClient.get(`/tasks/${taskId}/my-stats`)
}

// ── 数据导出 ──

/** POST /tasks/:id/exports */
export function createExportApi(taskId: number, format: string, fieldMapping?: Record<string, unknown>): Promise<ApiResponse<ExportJob>> {
  const params: Record<string, string> = { format }
  if (fieldMapping) params.field_mapping = JSON.stringify(fieldMapping)
  return apiClient.post(`/tasks/${taskId}/exports`, null, { params })
}

/** GET /tasks/:id/exports */
export function listExportsApi(taskId: number): Promise<ApiResponse<ExportJob[]>> {
  return apiClient.get(`/tasks/${taskId}/exports`)
}
