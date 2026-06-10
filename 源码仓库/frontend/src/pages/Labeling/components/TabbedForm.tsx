/** TabbedForm.tsx — 标签页分组的标注表单组件
 * Author: hongchuwudi
 * Description: 按 Tab+分组 结构化渲染表单字段，支持联动显隐规则
 */
import { useState } from 'react'
import { FieldRenderer } from './FieldRenderer'
import type { FieldDef, SchemaField, SchemaTab, SchemaGroup } from '@/types/models/field'

/** 重新导出 SchemaField 类型 */
export type { SchemaField }

/** Tab + 容器 + 字段 结构化渲染 */
export function TabbedForm({ tabs, groups, allFields, values, onChange, taskId, itemId, itemData }: {
  tabs: SchemaTab[]
  groups: SchemaGroup[]
  allFields: SchemaField[]
  values: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
  taskId?: number
  itemId?: number
  itemData?: Record<string, unknown>
}) {
  const setField = (key: string, val: unknown) => onChange({ ...values, [key]: val })
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || '')

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]
  if (!activeTab) return null

  const groupedFieldIds = new Set(groups.flatMap((g) => g.fieldIds))
  const containerMap = new Map(groups.map((g) => [g.id, g]))

  // 联动规则
  const linkages = new Map<string, { checkField: string; condition: string; value: unknown; action: string }[]>()
  for (const f of allFields) {
    if (f.linkage) {
      linkages.set(f.key, f.linkage.map((l) => ({ checkField: l.targetField, condition: l.condition, value: l.value, action: l.action })))
    }
  }
  const checkVisibility = (fKey: string): boolean => {
    const rules = linkages.get(fKey)
    if (!rules) return true
    for (const r of rules) {
      const sv = values[r.checkField]
      let match = false
      if (r.condition === 'equals') match = sv === r.value
      else if (r.condition === 'notEquals') match = Array.isArray(sv) ? !sv.includes(r.value) : sv !== r.value
      else if (r.condition === 'in') match = Array.isArray(sv) ? sv.includes(r.value) : sv === r.value
      if (r.action === 'visible' && !match) return false
      if (r.action === 'hidden' && match) return false
    }
    return true
  }

  const renderField = (fid: string) => {
    const f = allFields.find((x) => x.id === fid)
    if (!f) return null
    if (!checkVisibility(f.key)) return null
    const col = f.colSpan || 24
    const gap = 10
    const offset = (gap * (24 - col)) / 24
    const width = col >= 24 ? '100%' : `calc(${((col / 24) * 100)}% - ${offset}px)`
    const fd: FieldDef = {
      id: f.id || f.key, key: f.key, title: f.title || f.key,
      type: f.type || 'text', required: !!f.required,
      options: f.options, multiple: f.multiple,
      placeholder: f.placeholder || '', maxLength: f.maxLength,
      rows: f.rows, accept: f.accept, maxCount: f.maxCount,
      rules: f.rules, linkage: f.linkage,
    }
    return (
      <div key={f.id} style={{ width, flexShrink: 0, marginBottom: 10, textAlign: (f.textAlign || 'left') as React.CSSProperties['textAlign'] }}>
        <FieldRenderer field={fd} value={values[f.key]} itemData={itemData} onChange={(v) => setField(f.key, v)} taskId={taskId} itemId={itemId} />
      </div>
    )
  }

  const renderGroup = (g: SchemaGroup) => (
    <div key={g.id} style={{
      marginBottom: 16, padding: 12, borderRadius: 8,
      border: '2px solid #e5e7eb', background: '#fafafa',
    }}>
      <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 12, fontSize: 13, paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>
        {g.title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>
        {g.fieldIds.map(renderField)}
      </div>
    </div>
  )

  // 未分配区域
  const allTabFieldIds = new Set(tabs.flatMap((t) => t.fieldIds))
  const allTabGroupIds = new Set(tabs.flatMap((t) => t.groupIds))
  const unassignedFields = allFields.filter(
    (f) => !allTabFieldIds.has(f.id) && !groupedFieldIds.has(f.id) && f.type !== 'showitem'
  )
  const unassignedGroups = groups.filter((g) => !allTabGroupIds.has(g.id))
  const hasUnassigned = unassignedFields.length > 0 || unassignedGroups.length > 0

  return (
    <div>
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
        {tabs.map((t) => (
          <div key={t.id} onClick={() => setActiveTabId(t.id)} style={{
            padding: '8px 16px', fontSize: 13, cursor: 'pointer',
            fontWeight: activeTabId === t.id ? 600 : 400,
            color: activeTabId === t.id ? '#4f46e5' : '#6b7280',
            borderBottom: activeTabId === t.id ? '2px solid #4f46e5' : '2px solid transparent',
          }}>{t.title}</div>
        ))}
      </div>

      {hasUnassigned && activeTabId === tabs[0]?.id && (
        <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px dashed #e5e7eb' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>
            未分配区域
          </div>
          {unassignedFields.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start', marginBottom: unassignedGroups.length > 0 ? 10 : 0 }}>
              {unassignedFields.map((f) => renderField(f.id))}
            </div>
          )}
          {unassignedGroups.map((g) => renderGroup(g))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>
        {activeTab.fieldIds.filter((fid: string) => !groupedFieldIds.has(fid)).map(renderField)}
      </div>
      {activeTab.groupIds.map((gid: string) => {
        const g = containerMap.get(gid)
        if (!g) return null
        return renderGroup(g)
      })}
    </div>
  )
}
