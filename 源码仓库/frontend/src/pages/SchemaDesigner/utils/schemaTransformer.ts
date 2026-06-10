/** schemaTransformer.ts — Schema 设计器转 Formily JSON Schema
 * Author: hongchuwudi
 * Description: 将 SchemaDesign 转换为 Formily 兼容的 JSON Schema 格式
 */
import type { SchemaDesign, FieldConfig } from '../types'

const COMPONENT_MAP: Record<string, string> = {
  text: 'Input', textarea: 'Input.TextArea', radio: 'Radio.Group',
  checkbox: 'Checkbox.Group', select: 'Select', upload: 'Upload',
  richtext: 'RichText', json: 'JsonEditor', llm: 'LLMInteraction', showitem: 'ShowItem',
}

function fieldSchemaType(type: FieldConfig['type']): string {
  switch (type) {
    case 'radio': case 'checkbox': case 'select': return 'string'
    case 'upload': return 'array'
    case 'json': return 'object'
    default: return 'string'
  }
}

function buildFieldProp(field: FieldConfig): Record<string, unknown> {
  const prop: Record<string, unknown> = {
    type: fieldSchemaType(field.type),
    title: field.title,
    'x-component': COMPONENT_MAP[field.type] || 'Input',
    'x-decorator': 'FormItem',
  }

  if (field.description) prop.description = field.description
  if (field.placeholder) prop['x-component-props'] = { placeholder: field.placeholder }
  if (field.defaultValue !== undefined) prop.default = field.defaultValue
  if (field.required) prop['x-validator'] = [{ required: true, message: `请填写${field.title}` }]

  if (field.options && field.options.length > 0) {
    prop.enum = field.options.map((o) => ({ label: o.label, value: o.value }))
  }

  if (field.type === 'upload') {
    prop['x-component-props'] = { ...(prop['x-component-props'] as object || {}), accept: field.accept, maxCount: field.maxCount }
  }
  if (field.type === 'textarea' && field.rows) {
    prop['x-component-props'] = { ...(prop['x-component-props'] as object || {}), rows: field.rows }
  }
  if (field.type === 'showitem') {
    prop['x-pattern'] = 'readPretty'
  }

  if (field.colSpan && field.colSpan !== 24) {
    prop['x-decorator-props'] = { ...(prop['x-decorator-props'] as object || {}), gridSpan: field.colSpan }
  }
  if (field.textAlign && field.textAlign !== 'left') {
    prop['x-decorator-props'] = { ...(prop['x-decorator-props'] as object || {}), style: { textAlign: field.textAlign } }
  }

  return prop
}

function buildContainerProp(group: { id: string; title: string; fieldIds: string[] }, design: SchemaDesign): Record<string, unknown> {
  const groupProps: Record<string, unknown> = {}
  for (const fid of group.fieldIds) {
    const field = design.fields.find((f) => f.id === fid)
    if (field) groupProps[field.key] = buildFieldProp(field)
  }
  return {
    type: 'void',
    title: group.title,
    'x-component': 'FormLayout',
    'x-component-props': {
      title: group.title,
      style: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 },
    },
    properties: groupProps,
  }
}

/** SchemaDesign → Formily ISchema */
export function toFormilySchema(design: SchemaDesign): Record<string, unknown> {
  const properties: Record<string, unknown> = {}
  const allGroupFieldIds = new Set(design.groups.flatMap((g) => g.fieldIds))
  const allTabFieldIds = new Set(design.tabs.flatMap((t) => t.fieldIds))
  const tabledGroupIds = new Set(design.tabs.flatMap((t) => t.groupIds))

  // 1. Tabs
  for (const tab of design.tabs) {
    const tabProperties: Record<string, unknown> = {}

    for (const fid of tab.fieldIds) {
      const field = design.fields.find((f) => f.id === fid)
      if (field) tabProperties[field.key] = buildFieldProp(field)
    }

    for (const gid of tab.groupIds) {
      const group = design.groups.find((g) => g.id === gid)
      if (group) tabProperties[group.id] = buildContainerProp(group, design)
    }

    if (Object.keys(tabProperties).length > 0) {
      properties[tab.id] = {
        type: 'void',
        'x-component': 'FormTab',
        properties: {
          [tab.id + '_pane']: {
            type: 'void',
            title: tab.title,
            'x-component': 'FormTab.TabPane',
            properties: tabProperties,
          },
        },
      }
    }
  }

  // 2. Containers not in any tab
  for (const group of design.groups) {
    if (tabledGroupIds.has(group.id)) continue
    properties[group.id] = buildContainerProp(group, design)
  }

  // 3. Unassigned fields (not in any group AND not directly in any tab)
  for (const field of design.fields) {
    if (allGroupFieldIds.has(field.id) || allTabFieldIds.has(field.id)) continue
    properties[field.key] = buildFieldProp(field)
  }

  return { type: 'object', properties }
}
