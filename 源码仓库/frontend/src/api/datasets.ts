/**
 * datasets.ts — 数据集 API
 * Author: hongchuwudi
 * Description: 提供数据集的 CRUD 及数据集条目（数据行）的增删改查与批量导入
 */

import apiClient from './client'
import type { ApiResponse } from '@/types'
import type { DatasetRecord, ApiDatasetItem } from '@/types/models/dataset'

interface PageData<T> { total: number; page: number; page_size: number; items: T[] }

// Re-export for backward compat (page code imports these from api/)
export type { DatasetRecord, ApiDatasetItem as DatasetItem }

/** GET /datasets/ */
export function listDatasetsApi(page = 1, pageSize = 50): Promise<ApiResponse<PageData<DatasetRecord>>> {
  return apiClient.get('/datasets/', { params: { page, page_size: pageSize } })
}

/** POST /datasets/ */
export function createDatasetApi(data: { name: string; description?: string; format?: string }): Promise<ApiResponse<DatasetRecord>> {
  return apiClient.post('/datasets/', data)
}

/** PATCH /datasets/:id */
export function updateDatasetApi(id: number, data: { name?: string; description?: string }): Promise<ApiResponse<DatasetRecord>> {
  return apiClient.patch(`/datasets/${id}`, data)
}

/** DELETE /datasets/:id */
export function deleteDatasetApi(id: number): Promise<ApiResponse<null>> {
  return apiClient.delete(`/datasets/${id}`)
}

/** GET /datasets/:id/items */
export function listItemsApi(datasetId: number, params?: { page?: number; page_size?: number }): Promise<ApiResponse<PageData<ApiDatasetItem>>> {
  return apiClient.get(`/datasets/${datasetId}/items`, { params })
}

/** POST /datasets/:id/items/batch */
export function batchImportApi(datasetId: number, items: { data: Record<string, unknown> }[]): Promise<ApiResponse<ApiDatasetItem[]>> {
  return apiClient.post(`/datasets/${datasetId}/items/batch`, { items })
}

/** PATCH /datasets/:datasetId/items/:itemId */
export function updateItemApi(datasetId: number, itemId: number, data: { data: Record<string, unknown> }): Promise<ApiResponse<ApiDatasetItem>> {
  return apiClient.patch(`/datasets/${datasetId}/items/${itemId}`, data)
}

/** DELETE /datasets/:datasetId/items/:itemId */
export function deleteItemApi(datasetId: number, itemId: number): Promise<ApiResponse<null>> {
  return apiClient.delete(`/datasets/${datasetId}/items/${itemId}`)
}

/** POST /datasets/:datasetId/items/batch-delete */
export function batchDeleteItemsApi(datasetId: number, ids: number[]): Promise<ApiResponse<null>> {
  return apiClient.post(`/datasets/${datasetId}/items/batch-delete`, { ids })
}
