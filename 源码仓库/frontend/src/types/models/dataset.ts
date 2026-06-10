/**
 * dataset.ts — 数据集相关类型定义
 * Author: hongchuwudi
 * Description: 定义 Dataset / DatasetItem 等前端 camelCase 类型及后端 API 原始 snake_case 类型
 */

/** 数据集（前端 camelCase 版） */
export interface Dataset {
  id: number
  name: string
  description: string
  format: 'json' | 'jsonl' | 'csv' | 'excel'
  itemCount: number
  labeledCount: number
  status: 'pending' | 'labeling' | 'reviewing' | 'completed'
  schemaId: number | null
  ownerId: number
  createdAt: string
  updatedAt: string
}

/** 数据集条目——待标注的原始数据行（前端 camelCase 版） */
export interface DatasetItem {
  id: number
  datasetId: number
  index: number
  data: Record<string, unknown>
  status: 'pending' | 'labeled' | 'skipped'
  createdAt: string
  updatedAt: string
}

// ── 以下为后端 API 原始 snake_case 类型 ──

/** 数据集列表项（API 原始格式） */
export interface DatasetRecord {
  id: number
  name: string
  description: string
  format: string
  item_count: number
  owner_id: number
  created_at: string
  updated_at: string
}

/** 数据集条目（API 原始格式） */
export interface ApiDatasetItem {
  id: number
  dataset_id: number
  index: number
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}
