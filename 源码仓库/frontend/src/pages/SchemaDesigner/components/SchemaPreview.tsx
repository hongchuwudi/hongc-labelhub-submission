/**
 * SchemaPreview.tsx — Schema JSON 视图 + 表单预览
 * Author: hongchuwudi
 * Description: 支持查看 JSON Schema 和交互式表单预览
 */
import { useState, useEffect } from 'react'
import { Button, Space, Select, Modal, App } from 'antd'
import { ImportOutlined } from '@ant-design/icons'
import { useSchemaDesigner } from '../SchemaDesignerContext'
import { toFormilySchema } from '../utils/schemaTransformer'
import { jsonSchemaToDesign } from '../utils/schemaParser'

const FONT_OPTIONS = [
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { label: 'Fira Code', value: '"Fira Code", monospace' },
  { label: 'Consolas', value: 'Consolas, monospace' },
  { label: 'Monospace', value: 'monospace' },
]

function loadSettings() {
  try {
    const raw = localStorage.getItem('labelhub_schema_preview_settings')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { fontSize: 13, fontFamily: '"JetBrains Mono", monospace' }
}

// 白底亮色高亮配色
const HC = { key: '#1d4ed8', str: '#047857', num: '#b45309', kw: '#9333ea', punct: '#6b7280' }

function JsonHighlight({ data }: { data: unknown }): React.ReactNode {
  if (data === null) return <span style={{ color: HC.kw }}>null</span>
  if (typeof data === 'boolean') return <span style={{ color: HC.kw }}>{String(data)}</span>
  if (typeof data === 'number') return <span style={{ color: HC.num }}>{data}</span>
  if (typeof data === 'string') return <span style={{ color: HC.str }}>"{data}"</span>
  if (Array.isArray(data)) {
    return <><span style={{ color: HC.punct }}>[</span>
      <div style={{ paddingLeft: 20 }}>{data.map((item, i) => <div key={i}><JsonHighlight data={item} />{i < data.length - 1 && <span style={{ color: HC.punct }}>,</span>}</div>)}</div>
    <span style={{ color: HC.punct }}>]</span></>
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>)
    return <><span style={{ color: HC.punct }}>{'{'}</span>
      <div style={{ paddingLeft: 20 }}>{entries.map(([k, v], i) => <div key={k}><span style={{ color: HC.key }}>"{k}"</span><span style={{ color: HC.punct }}>: </span><JsonHighlight data={v} />{i < entries.length - 1 && <span style={{ color: HC.punct }}>,</span>}</div>)}</div>
    <span style={{ color: HC.punct }}>{'}'}</span></>
  }
  return <span>{String(data)}</span>
}

/** SchemaPreview — JSON Schema 查看和导入组件 */
export default function SchemaPreview() {
  const { state, dispatch } = useSchemaDesigner()
  const { message } = App.useApp()
  const [settings, setSettings] = useState(loadSettings)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

  const schema = toFormilySchema(state.schema)
  const schemaJson = JSON.stringify(schema, null, 2)

  useEffect(() => {
    try { localStorage.setItem('labelhub_schema_preview_settings', JSON.stringify(settings)) } catch {}
  }, [settings])

  const handleImport = () => {
    setImportError(null)
    try {
      const parsed = JSON.parse(importText)
      const design = jsonSchemaToDesign(parsed)
      dispatch({ type: 'LOAD_SCHEMA', payload: design })
      message.success('已从 JSON Schema 导入')
      setImportOpen(false)
    } catch (e: unknown) { setImportError(e instanceof Error ? e.message : '导入失败') }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 12px', flexShrink: 0, gap: 8 }}>
        <Space size="small">
          <Select size="small" value={settings.fontFamily} onChange={(v: string) => setSettings((prev: typeof settings) => ({ ...prev, fontFamily: v }))} options={FONT_OPTIONS} style={{ width: 170 }} popupMatchSelectWidth={false} />
          <Select size="small" value={settings.fontSize} onChange={(v: number) => setSettings((prev: typeof settings) => ({ ...prev, fontSize: v }))} options={[11,12,13,14,16,18].map(n => ({ value: n, label: `${n}px` }))} style={{ width: 68 }} />
        </Space>
        <Button size="small" icon={<ImportOutlined />} onClick={() => { setImportText(schemaJson); setImportError(null); setImportOpen(true) }}>导入 JSON</Button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16, borderRadius: 8, background: '#ffffff', border: '1px solid #e5e7eb', fontFamily: settings.fontFamily, fontSize: settings.fontSize, lineHeight: 1.7, color: '#1a1a2e' }}>
        <JsonHighlight data={schema} />
      </div>

      <Modal title="从 JSON Schema 导入" open={importOpen} onCancel={() => setImportOpen(false)} onOk={handleImport} okText="导入" width={700}>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>粘贴 Formily JSON Schema，将转换回 Schema Designer 设计</div>
        <textarea value={importText} onChange={e => { setImportText(e.target.value); setImportError(null) }} rows={20} spellCheck={false}
          style={{ width: '100%', padding: 12, borderRadius: 6, border: importError ? '1px solid #ef4444' : '1px solid #d1d5db', outline: 'none', fontFamily: '"JetBrains Mono", monospace', fontSize: 12, lineHeight: 1.6, background: '#ffffff', color: '#1a1a2e', resize: 'vertical' }} />
        {importError && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{importError}</div>}
      </Modal>
    </div>
  )
}
