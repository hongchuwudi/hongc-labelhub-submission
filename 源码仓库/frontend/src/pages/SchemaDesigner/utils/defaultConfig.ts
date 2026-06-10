/** defaultConfig.ts — 字段默认配置
 * Author: hongchuwudi
 * Description: 定义各字段类型的默认属性和创建函数
 */
import type { FieldConfig, FieldType } from '../types'

const FIELD_DEFAULTS: Record<FieldType, Partial<FieldConfig>> = {
  text:     { title: '单行文本', placeholder: '请输入', required: false, colSpan: 12 },
  textarea: { title: '多行文本', placeholder: '请输入', required: false, rows: 4, colSpan: 24 },
  radio:    { title: '单选', required: false, options: [{ label: '选项1', value: '1' }, { label: '选项2', value: '2' }] },
  checkbox: { title: '多选', required: false, options: [{ label: '选项A', value: 'A' }, { label: '选项B', value: 'B' }] },
  select:   { title: '下拉选择', placeholder: '请选择', required: false, options: [{ label: '选项1', value: '1' }] },
  upload:   { title: '文件上传', required: false, accept: 'image/*', maxCount: 1 },
  richtext: { title: '富文本', required: false, colSpan: 24 },
  json:     { title: 'JSON 数据', required: false, colSpan: 24 },
  llm:      { title: 'LLM 辅助', required: false, colSpan: 24 },
  showitem: { title: '展示项', required: false, colSpan: 24 },
}

/** 根据字段类型和标识创建默认字段配置 */
export function createDefaultConfig(type: FieldType, key: string, id: string): FieldConfig {
  return {
    id,
    key,
    type,
    title: FIELD_DEFAULTS[type].title ?? '',
    placeholder: FIELD_DEFAULTS[type].placeholder,
    required: FIELD_DEFAULTS[type].required ?? false,
    options: FIELD_DEFAULTS[type].options ? [...FIELD_DEFAULTS[type].options!] : undefined,
    rows: FIELD_DEFAULTS[type].rows,
    accept: FIELD_DEFAULTS[type].accept,
    maxCount: FIELD_DEFAULTS[type].maxCount,
    colSpan: FIELD_DEFAULTS[type].colSpan ?? 12,
    textAlign: FIELD_DEFAULTS[type].textAlign ?? 'left',
    multiple: type === 'select' ? false : undefined,
  }
}
