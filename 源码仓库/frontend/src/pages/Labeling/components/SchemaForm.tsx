import { FieldRenderer } from './FieldRenderer'
import type { FieldDef } from '@/types/models/field'


/** 基于 SchemaDesign 的字段渲染 */
export function SchemaForm({ fields, values, onChange, taskId, itemId }: {
  fields: FieldDef[]
  values: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
  taskId?: number
  itemId?: number
}) {
  const setField = (key: string, val: unknown) => {
    onChange({ ...values, [key]: val })
  }

  // 联动规则：key = 拥有 linkage 的字段，checkField = 被监视的字段（与 TabbedForm 一致）
  const linkages = new Map<string, { checkField: string; condition: string; value: unknown; action: string }[]>()
  for (const f of fields) {
    if (f.linkage) {
      linkages.set(f.key, f.linkage.map((l) => ({ checkField: l.targetField, condition: l.condition, value: l.value, action: l.action })))
    }
  }

  const evaluateField = (f: FieldDef): 'visible' | 'hidden' | null => {
    const rules = linkages.get(f.key)
    if (!rules) return null
    for (const r of rules) {
      const checkVal = values[r.checkField]
      let match = false
      if (r.condition === 'equals') {
        match = checkVal === r.value
      } else if (r.condition === 'notEquals') {
        if (Array.isArray(checkVal)) match = !checkVal.includes(r.value)
        else match = checkVal !== r.value
      } else if (r.condition === 'in') {
        if (Array.isArray(checkVal)) match = checkVal.includes(r.value)
        else match = checkVal === r.value
      }
      if (r.action === 'visible' && !match) return 'hidden'
      if (r.action === 'hidden' && match) return 'hidden'
    }
    return 'visible'
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>
      {fields.map((field) => {
        if (field.type === 'showitem') return null
        const status = evaluateField(field)
        if (status === 'hidden') return null
        const col = field.colSpan || 24
        const gap = 10
        const offset = (gap * (24 - col)) / 24
        const width = col >= 24 ? '100%' : `calc(${((col / 24) * 100)}% - ${offset}px)`
        return (
          <div key={field.id || field.key} style={{ width, flexShrink: 0, textAlign: (field.textAlign || 'left') as React.CSSProperties['textAlign'] }}>
            <FieldRenderer
              field={{ ...field, required: status === 'visible' ? field.required : field.required }}
              value={values[field.key]}
              onChange={(v) => setField(field.key, v)}
              taskId={taskId}
              itemId={itemId}
            />
          </div>
        )
      })}
    </div>
  )
}
