/**
 * schema.ts — 标注 Schema 类型定义
 * Author: hongchuwudi
 * Description: 定义 LabelSchema 前端类型及后端 API 原始 snake_case 类型
 */

/** 标注 Schema——定义标注表单的 JSON Schema（前端 camelCase 版） */
export interface LabelSchema {
  id: number
  name: string
  version: number
  schema: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ── 以下为后端 API 原始 snake_case 类型 ──

/** Schema 列表项（API 原始格式） */
export interface SchemaListItem {
  id: number
  name: string
  version: number
  created_at: string
  updated_at: string
}

/** Schema 详情（API 原始格式） */
export interface SchemaDetail {
  id: number
  name: string
  version: number
  created_at: string
  updated_at: string
  schema: Record<string, unknown>
}
