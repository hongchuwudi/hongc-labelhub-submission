/** types.ts — 字段组件通用类型定义
 * Author: hongchuwudi
 * Description: 定义字段渲染组件的通用 props 类型
 */
import type { FieldConfig } from '../types'
import type React from 'react'

/** 字段渲染组件的通用 props 接口 */
export interface FieldLabelProps {
  field: FieldConfig
  label?: React.ReactNode
}
