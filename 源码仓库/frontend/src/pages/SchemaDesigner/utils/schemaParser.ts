/** schemaParser.ts — Formily JSON Schema 转 Schema 设计器
 * Author: hongchuwudi
 * Description: 将 Formily JSON Schema 逆向解析为 SchemaDesign 格式
 */
import type { SchemaDesign, FieldConfig, GroupConfig } from '../types'

const COMPONENT_TO_TYPE: Record<string, FieldConfig['type']> = {
  Input: 'text', 'Input.TextArea': 'textarea', 'Radio.Group': 'radio',
  'Checkbox.Group': 'checkbox', Select: 'select', Upload: 'upload',
  RichText: 'richtext', JsonEditor: 'json', LLMInteraction: 'llm', ShowItem: 'showitem',
}



function parseFieldProp(key: string, prop: Record<string, unknown>): FieldConfig | null {
  const component = (prop['x-component'] as string) || 'Input'
  const type = COMPONENT_TO_TYPE[component]
  if (!type) return null

  const options = Array.isArray(prop.enum)
    ? (prop.enum as Array<{ label: string; value: unknown }>).map((e) => ({
        label: e.label || String(e.value),
        value: String(e.value ?? e.label ?? ''),
      }))
    : undefined

  const rules = Array.isArray(prop['x-validator'])
    ? (prop['x-validator'] as Array<Record<string, unknown>>).map((v) => ({
        type: (v.required ? 'required' : 'pattern') as FieldConfig['rules'] extends Array<infer R> ? R extends { type: infer T } ? T : never : never,
        message: (v.message as string) || '',
        value: v.value as string | number | undefined,
      }))
    : undefined

  const compProps = (prop['x-component-props'] as Record<string, unknown>) || {}
  const decoratorProps = (prop['x-decorator-props'] as Record<string, unknown>) || {}

  return {
    id: crypto.randomUUID?.() || key + '_' + Date.now(),
    type,
    key,
    title: (prop.title as string) || key,
    description: prop.description as string | undefined,
    placeholder: (compProps.placeholder as string) || (prop.description as string),
    required: prop.required === true || (Array.isArray(prop['x-validator']) && (prop['x-validator'] as Array<Record<string, unknown>>).some((v) => v.required)),
    defaultValue: prop.default,
    options,
    multiple: type === 'select' && Array.isArray(prop.enum),
    accept: compProps.accept as string | undefined,
    maxCount: compProps.maxCount as number | undefined,
    rows: compProps.rows as number | undefined,
    rules: rules as FieldConfig['rules'],
    colSpan: (decoratorProps.gridSpan as number) || 24,
    textAlign: (decoratorProps.style as Record<string, unknown>)?.textAlign as FieldConfig['textAlign'],
  }
}

/** 递归解析 properties，返回 { fields, groups, fieldOrder } */
function parseProperties(
  props: Record<string, unknown>,
): { fields: FieldConfig[]; groups: GroupConfig[]; directFieldKeys: string[] } {
  const fields: FieldConfig[] = []
  const groups: GroupConfig[] = []
  const directFieldKeys: string[] = []

  for (const [key, prop] of Object.entries(props)) {
    const p = prop as Record<string, unknown>
    const component = p['x-component'] as string | undefined

    if (component === 'FormTab') {
      // Tab: recursively parse its TabPane children
      const tabPaneKeys = Object.keys((p.properties as Record<string, unknown>) || {})
      for (const pk of tabPaneKeys) {
        const pane = ((p.properties as Record<string, unknown>)?.[pk] || {}) as Record<string, unknown>
        const paneProps = pane.properties as Record<string, unknown> | undefined
        if (paneProps) {
          const result = parseProperties(paneProps)
          fields.push(...result.fields)
          groups.push(...result.groups)
          directFieldKeys.push(...result.directFieldKeys)
          // We can't fully reconstruct tabs from flat Formily output,
          // but we preserve the structure as groups
        }
      }
    } else if (component === 'FormLayout') {
      // Group container
      const groupProps = (p.properties as Record<string, unknown>) || {}
      const result = parseProperties(groupProps)
      const group: GroupConfig = {
        id: crypto.randomUUID?.() || 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        title: (p.title as string) || key,
        fieldIds: result.fields.map((f) => f.id),
      }
      fields.push(...result.fields)
      groups.push(group)
    } else if (COMPONENT_TO_TYPE[component || '']) {
      // Regular field
      const field = parseFieldProp(key, p)
      if (field) {
        fields.push(field)
        directFieldKeys.push(key)
      }
    } else if (p.type === 'void' || p.type === 'object' || !component) {
      // Nested object or void — recurse
      if (p.properties) {
        const result = parseProperties(p.properties as Record<string, unknown>)
        fields.push(...result.fields)
        groups.push(...result.groups)
        directFieldKeys.push(...result.directFieldKeys)
      }
    }
  }

  return { fields, groups, directFieldKeys }
}

/** Formily JSON Schema → SchemaDesign */
export function jsonSchemaToDesign(schema: Record<string, unknown>): SchemaDesign {
  const props = (schema.properties as Record<string, unknown>) || {}
  const result = parseProperties(props)

  return {
    title: (schema.title as string) || '导入的 Schema',
    description: (schema.description as string) || '',
    fields: result.fields,
    groups: result.groups,
    tabs: [], // Tabs can't be fully reconstructed from flat Formily output
  }
}
