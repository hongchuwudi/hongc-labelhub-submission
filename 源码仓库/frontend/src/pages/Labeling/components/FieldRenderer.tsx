import { useState } from 'react'
import { Button, Radio, Checkbox, Select, Input, Upload } from 'antd'
import { UploadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { useAppStore } from '@/store'
import apiClient from '@/api/client'
import JsonEditor from '@/components/JsonEditor'
import type { FieldDef } from '@/types/models/field'

export type { FieldDef }


/** 单字段运行时渲染器 */
export function FieldRenderer({ field, value, onChange, taskId, itemId, itemData }: {
  field: FieldDef
  value: unknown
  onChange: (v: unknown) => void
  taskId?: number
  itemId?: number
  itemData?: Record<string, unknown>
}) {
  const label = (
    <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500, color: '#374151' }}>
      {field.title || field.key}
      {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </div>
  )

  // 需要有 key 的表单元素包裹
  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  }

  switch (field.type) {
    case 'radio': {
      const options = (field.options || []).map((o) => ({ label: o.label, value: o.value }))
      return (
        <div style={wrapperStyle}>
          {label}
          <Radio.Group
            options={options}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="small"
          />
        </div>
      )
    }
    case 'checkbox': {
      const opts = (field.options || []).map((o) => ({ label: o.label, value: o.value }))
      return (
        <div style={wrapperStyle}>
          {label}
          <Checkbox.Group
            options={opts}
            value={(Array.isArray(value) ? value : []) as string[]}
            onChange={(vals) => onChange(vals)}
          />
        </div>
      )
    }
    case 'select': {
      const opts = (field.options || []).map((o) => ({ label: o.label, value: o.value }))
      return (
        <div style={wrapperStyle}>
          {label}
          <Select
            mode={field.multiple ? 'tags' : undefined}
            options={opts}
            value={(value as string | string[] | undefined) ?? undefined}
            onChange={(v) => onChange(v)}
            placeholder={field.placeholder || '请选择'}
            style={{ width: '100%' }}
            size="middle"
          />
        </div>
      )
    }
    case 'richtext': {
      return (
        <div style={wrapperStyle}>
          {label}
          <ReactQuill
            theme="snow"
            value={value as string || ''}
            onChange={(v) => onChange(v)}
            placeholder={field.placeholder || '请输入富文本内容...'}
            style={{ background: '#fff', borderRadius: 6 }}
          />
        </div>
      )
    }
    case 'textarea': {
      return (
        <div style={wrapperStyle}>
          {label}
          <Input.TextArea
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            rows={field.rows || 3}
            maxLength={field.maxLength}
            showCount={!!field.maxLength}
            size="middle"
          />
        </div>
      )
    }
    case 'json': {
      const jsonText = typeof value === 'object' && value !== null
        ? JSON.stringify(value, null, 2)
        : (value as string || '')
      return (
        <div style={wrapperStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            {label}
            <Button size="small" onClick={() => {
              try {
                const obj = JSON.parse(jsonText)
                onChange(obj)
              } catch { /* ignore */ }
            }}>格式化</Button>
          </div>
          <JsonEditor
            value={jsonText}
            onChange={(text) => { try { onChange(JSON.parse(text)) } catch { onChange(text) } }}
            placeholder={field.placeholder || '{"key": "value"}'}
            rows={6}
          />
        </div>
      )
    }
    case 'upload': {
      return (
        <div style={wrapperStyle}>
          {label}
          <Upload
            accept={field.accept}
            maxCount={field.maxCount}
            listType="picture"
            customRequest={async ({ file, onSuccess, onError }) => {
              try {
                const formData = new FormData()
                formData.append('file', file as File)
                const token = useAppStore.getState().tokens?.access_token
                const res = await fetch('/api/upload/', {
                  method: 'POST',
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                  body: formData,
                })
                const json = await res.json()
                if (res.ok) {
                  onSuccess?.({ url: json.data.url, name: json.data.name })
                } else {
                  onError?.(new Error(json.message || '上传失败'))
                }
              } catch (e) {
                onError?.(e as Error)
              }
            }}
            onChange={(info) => {
              if (info.file.status === 'done') {
                const urls = info.fileList
                  .filter((f) => f.status === 'done' && f.response)
                  .map((f) => ({ url: f.response?.url || f.url, name: f.name }))
                onChange(urls)
              }
            }}
          >
            <Button icon={<UploadOutlined />}>上传文件</Button>
          </Upload>
        </div>
      )
    }
    case 'llm': {
      return <LLMField field={field} value={value as string} taskId={taskId} itemId={itemId} onChange={onChange} />
    }
    case 'showitem': {
      const displayVal = itemData?.[field.key]
      const displayStr = typeof displayVal === 'object' ? JSON.stringify(displayVal) : String(displayVal ?? '-')
      return (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: '#f0f5ff', border: '1px solid #d6e4ff',
          marginBottom: 4,
        }}>
          <div style={{ fontSize: 10, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            展示项 · 只读
          </div>
          <div style={{ fontSize: 14, color: '#1a1a2e', fontWeight: 500 }}>
            {field.title}
          </div>
          <div style={{ fontSize: 13, color: '#374151', marginTop: 4, wordBreak: 'break-all' }}>
            {displayStr}
          </div>
        </div>
      )
    }
    case 'text':
    default: {
      return (
        <div style={wrapperStyle}>
          {label}
          <Input
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            maxLength={field.maxLength}
            showCount={!!field.maxLength}
            size="middle"
          />
        </div>
      )
    }
  }
}


/** LLM 触发组件 */
export function LLMField({ field, value, taskId, itemId, onChange }: {
  field: FieldDef
  value: string
  taskId?: number
  itemId?: number
  onChange: (v: unknown) => void
}) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(value || null)

  const handleTrigger = async () => {
    if (!taskId || !itemId) return
    setLoading(true)
    try {
      const res = await apiClient.post('/llm-trigger/', {
        task_id: taskId, item_id: itemId, field_key: field.key, field_title: field.title,
      })
      setSuggestion(res.data?.suggestion || '')
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const handleAdopt = () => {
    if (suggestion) {
      onChange(suggestion)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500, color: '#374151' }}>
        {field.title || field.key}
      </div>
      <div style={{
        padding: 16, borderRadius: 8,
        background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
        border: '1px solid #c4b5fd',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <ThunderboltOutlined style={{ color: '#7c3aed', fontSize: 18 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6' }}>AI 辅助建议</span>
        </div>

        {suggestion && (
          <div style={{
            padding: '10px 14px', borderRadius: 6,
            background: '#fff', border: '1px solid #ddd6fe',
            fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 10,
            whiteSpace: 'pre-wrap',
          }}>
            {suggestion}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={handleTrigger}
            loading={loading}
            type={suggestion ? 'default' : 'primary'}
            ghost={!suggestion}
          >
            {suggestion ? '重新生成' : 'AI 建议'}
          </Button>
          {suggestion && (
            <Button size="small" type="primary" onClick={handleAdopt}>采纳</Button>
          )}
        </div>
      </div>
    </div>
  )
}
