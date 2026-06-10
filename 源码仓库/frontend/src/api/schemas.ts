/**
 * schemas.ts — 标注 Schema API
 * Author: hongchuwudi
 * Description: 提供 Schema 的 CRUD 及设计器兼容类型
 */

import apiClient from './client'
import type { ApiResponse, PageData } from '@/types'
import type { SchemaListItem, SchemaDetail as ModelSchemaDetail } from '@/types/models/schema'
import type { SchemaDesign } from '@/pages/SchemaDesigner/types'

/** Schema 详情（设计器兼容版，覆盖 schema 字段类型为 SchemaDesign） */
export type SchemaDetail = Omit<ModelSchemaDetail, 'schema'> & { schema: SchemaDesign }
export type { SchemaListItem }

/** GET /schemas/ */
export function listSchemasApi(page = 1, pageSize = 50): Promise<ApiResponse<PageData<SchemaListItem>>> {
  return apiClient.get('/schemas/', { params: { page, page_size: pageSize } })
}

/** GET /schemas/:id */
export function getSchemaApi(id: number): Promise<ApiResponse<SchemaDetail>> {
  return apiClient.get(`/schemas/${id}`)
}

/** POST /schemas/ */
export function createSchemaApi(data: { name: string; schema: SchemaDesign }): Promise<ApiResponse<SchemaDetail>> {
  return apiClient.post('/schemas/', data)
}

/** PUT /schemas/:id */
export function updateSchemaApi(id: number, data: { name?: string; schema?: SchemaDesign }): Promise<ApiResponse<SchemaDetail>> {
  return apiClient.put(`/schemas/${id}`, data)
}

/** DELETE /schemas/:id */
export function deleteSchemaApi(id: number): Promise<ApiResponse<unknown>> {
  return apiClient.delete(`/schemas/${id}`)
}
