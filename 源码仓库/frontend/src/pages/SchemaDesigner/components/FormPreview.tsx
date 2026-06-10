/** FormPreview.tsx — 表单预览面板
 * Author: hongchuwudi
 * Description: 交互式表单预览，支持字段联动和校验规则测试
 */
import { useState, useMemo } from 'react'
import { Button, App, Tag } from 'antd'
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useSchemaDesigner } from '../SchemaDesignerContext'
import { SchemaForm, TabbedForm } from '@/pages/Labeling/components/FieldRenderers'
import type { FieldDef } from '@/types/models/field'
import type { FieldLinkage } from '../types'

interface ValidationError {
  key: string
  title: string
  message: string
}

/** FormPreview — 表单预览组件 */
export default function FormPreview() {
  const { state } = useSchemaDesigner()
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<ValidationError[] | null>(null)
  const { message } = App.useApp()

  const fields: FieldDef[] = state.schema.fields.map(f => ({
    id: f.id, key: f.key, type: f.type, title: f.title, required: f.required,
    options: f.options, placeholder: f.placeholder, colSpan: f.colSpan, textAlign: f.textAlign,
    multiple: f.multiple, maxLength: f.maxLength, rows: f.rows, accept: f.accept, maxCount: f.maxCount,
    rules: f.rules, linkage: f.linkage,
  }))

  // 判断字段是否被联动隐藏（与 SchemaForm 逻辑一致）
  const visibleKeys = useMemo(() => {
    const linkages = new Map<string, FieldLinkage[]>()
    for (const f of state.schema.fields) {
      if (f.linkage) linkages.set(f.key, f.linkage)
    }
    const hidden = new Set<string>()
    for (const f of state.schema.fields) {
      const rules = linkages.get(f.key)
      if (!rules) continue
      for (const r of rules) {
        const checkVal = values[r.targetField]
        let match = false
        if (r.condition === 'equals') match = checkVal === r.value
        else if (r.condition === 'notEquals') match = Array.isArray(checkVal) ? !checkVal.includes(r.value) : checkVal !== r.value
        else if (r.condition === 'in') match = Array.isArray(checkVal) ? checkVal.includes(r.value) : checkVal === r.value
        if (r.action === 'visible' && !match) hidden.add(f.key)
        if (r.action === 'hidden' && match) hidden.add(f.key)
      }
    }
    return new Set(state.schema.fields.filter(f => !hidden.has(f.id)).map(f => f.key))
  }, [values, state.schema.fields])

  const handleValidate = () => {
    const errs: ValidationError[] = []
    const allFields = state.schema.fields
    for (const f of allFields) {
      if (!visibleKeys.has(f.key)) continue
      const val = values[f.key]
      const title = f.title || f.key

      // 必填校验
      if (f.required && (val === undefined || val === null || val === '')) {
        errs.push({ key: f.key, title, message: `${title} 为必填项` })
        continue
      }
      if (val === undefined || val === null || val === '') continue

      // 校验规则
      if (f.rules) {
        for (const rule of f.rules) {
          const strVal = String(val)
          if (rule.type === 'minLength' && typeof val === 'string' && strVal.length < Number(rule.value)) {
            errs.push({ key: f.key, title, message: rule.message || `至少 ${rule.value} 个字符` })
          }
          if (rule.type === 'maxLength' && typeof val === 'string' && strVal.length > Number(rule.value)) {
            errs.push({ key: f.key, title, message: rule.message || `不超过 ${rule.value} 个字符` })
          }
          if (rule.type === 'pattern' && typeof rule.value === 'string') {
            try {
              if (!new RegExp(rule.value).test(strVal)) {
                errs.push({ key: f.key, title, message: rule.message || '格式不正确' })
              }
            } catch { /* invalid regex */ }
          }
          if (rule.type === 'min' && Number(val) < Number(rule.value)) {
            errs.push({ key: f.key, title, message: rule.message || `最小值为 ${rule.value}` })
          }
          if (rule.type === 'max' && Number(val) > Number(rule.value)) {
            errs.push({ key: f.key, title, message: rule.message || `最大值为 ${rule.value}` })
          }
          if (rule.type === 'required' && (val === undefined || val === null || val === '')) {
            errs.push({ key: f.key, title, message: rule.message || '此字段为必填项' })
          }
        }
      }
    }
    setErrors(errs)
    if (errs.length === 0) {
      message.success('全部校验通过')
    }
  }

  const clear = () => { setErrors(null) }

  if (fields.length === 0) return <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>暂无字段，请从左侧物料区拖入字段</div>

  return (
    <div>
      {/* 工具栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          {errors !== null
            ? errors.length === 0
              ? <span style={{ color: '#10b981' }}><CheckCircleOutlined /> 全部校验通过</span>
              : <span style={{ color: '#ef4444' }}><ExclamationCircleOutlined /> {errors.length} 项未通过</span>
            : null}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" onClick={clear}>清除</Button>
          <Button size="small" type="primary" onClick={handleValidate}>校验（模拟提交）</Button>
        </div>
      </div>

      {/* 错误列表 */}
      {errors && errors.length > 0 && (
        <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fecaca', maxHeight: 160, overflow: 'auto' }}>
          {errors.map((e, i) => (
            <Tag key={i} color="error" style={{ marginBottom: 4 }}>{e.message}</Tag>
          ))}
        </div>
      )}

      {/* 表单 */}
      {state.schema.tabs && state.schema.tabs.length > 0 ? (
        <TabbedForm tabs={state.schema.tabs} groups={state.schema.groups} allFields={state.schema.fields} values={values} onChange={(v) => { setValues(v); setErrors(null) }} taskId={0} itemId={0} itemData={{}} />
      ) : (
        <SchemaForm fields={fields} values={values} onChange={(v) => { setValues(v); setErrors(null) }} taskId={0} itemId={0} />
      )}
    </div>
  )
}
