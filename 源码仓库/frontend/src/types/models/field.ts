/**
 * field.ts — Schema 字段 / Tab / 分组类型定义
 * Author: hongchuwudi
 * Description: 定义 FieldDef（运行时）、SchemaField（设计态）、SchemaTab、SchemaGroup
 */

/** Schema 字段定义——前端渲染器运行时 */
export interface FieldDef {
  id: string
  key: string
  title: string
  type: string
  required: boolean
  options?: { label: string; value: string }[]
  multiple?: boolean
  placeholder?: string
  maxLength?: number
  rows?: number
  accept?: string
  maxCount?: number
  colSpan?: number
  textAlign?: 'left' | 'center' | 'right'
  rules?: { type: string; value?: string | number; message: string }[]
  linkage?: { targetField: string; condition: string; value: unknown; action: string }[]
}

/** Schema 字段——设计态（字段可选） */
export interface SchemaField {
  id: string
  key: string
  title?: string
  type?: string
  required?: boolean
  options?: { label: string; value: string }[]
  multiple?: boolean
  placeholder?: string
  maxLength?: number
  rows?: number
  accept?: string
  maxCount?: number
  colSpan?: number
  textAlign?: 'left' | 'center' | 'right'
  rules?: { type: string; value?: string | number; message: string }[]
  linkage?: { targetField: string; condition: string; value: unknown; action: string }[]
}

/** Schema Tab */
export interface SchemaTab {
  id: string
  title: string
  fieldIds: string[]
  groupIds: string[]
}

/** Schema 分组 */
export interface SchemaGroup {
  id: string
  title: string
  fieldIds: string[]
}
