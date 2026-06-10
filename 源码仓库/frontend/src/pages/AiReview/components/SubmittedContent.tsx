/**
 * SubmittedContent.tsx — 提交内容 JSON 视图
 * Author: hongchuwudi
 * Description: 标注提交内容 + 原始数据对比，支持字体调节
 */
import { useState } from 'react'
import { Segmented, Select } from 'antd'

const FONT_OPTIONS = [
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { label: 'Fira Code', value: '"Fira Code", monospace' },
  { label: 'Consolas', value: 'Consolas, monospace' },
  { label: 'Monospace', value: 'monospace' },
]
const FONT_SIZES = [10, 11, 12, 13, 14, 16].map((n) => ({ value: n, label: `${n}px` }))

/** 提交内容 JSON 视图组件 */
export default function SubmittedContent({ data, itemData }: {
  data: Record<string, unknown> | null
  itemData: Record<string, unknown> | null
}) {
  const [view, setView] = useState<'result' | 'item'>('result')
  const [fontSize, setFontSize] = useState(12)
  const [fontFamily, setFontFamily] = useState('"JetBrains Mono", monospace')

  const currentData = view === 'result' ? data : itemData

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {view === 'result' ? '提交内容' : '原始数据'}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Segmented size="small"
            options={[
              { label: '提交内容', value: 'result' },
              { label: '原始数据', value: 'item' },
            ]}
            value={view}
            onChange={(v) => setView(v as 'result' | 'item')}
          />
          <Select size="small" value={fontSize}
            onChange={setFontSize} options={FONT_SIZES}
            style={{ width: 60 }} dropdownMatchSelectWidth={false} />
          <Select size="small" value={fontFamily}
            onChange={setFontFamily} options={FONT_OPTIONS}
            style={{ width: 130 }} dropdownMatchSelectWidth={false} />
        </div>
      </div>
      <div style={{
        padding: 14, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb',
        fontFamily, fontSize, lineHeight: 1.7,
        color: '#1a1a2e', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        maxHeight: 420, overflow: 'auto',
      }}>
        {currentData ? (
          <JsonHighlight data={currentData} />
        ) : (
          <span style={{ color: '#9ca3af' }}>无数据</span>
        )}
      </div>
    </div>
  )
}

/** 简易 JSON 语法高亮（浅色主题） */
function JsonHighlight({ data }: { data: unknown }): React.ReactNode {
  if (data === null) return <span style={{ color: '#7c3aed' }}>null</span>
  if (data === undefined) return <span style={{ color: '#9ca3af' }}>undefined</span>
  if (typeof data === 'boolean') return <span style={{ color: '#7c3aed' }}>{String(data)}</span>
  if (typeof data === 'number') return <span style={{ color: '#d97706' }}>{data}</span>
  if (typeof data === 'string') return <span style={{ color: '#059669' }}>"{data}"</span>

  if (Array.isArray(data)) {
    if (data.length === 0) return <span style={{ color: '#9ca3af' }}>[]</span>
    return (
      <>
        <span style={{ color: '#9ca3af' }}>[</span>
        <div style={{ paddingLeft: 18 }}>
          {data.map((item, i) => (
            <div key={i}>
              <JsonHighlight data={item} />
              {i < data.length - 1 && <span style={{ color: '#9ca3af' }}>,</span>}
            </div>
          ))}
        </div>
        <span style={{ color: '#9ca3af' }}>]</span>
      </>
    )
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>)
    if (entries.length === 0) return <span style={{ color: '#9ca3af' }}>{'{}'}</span>
    return (
      <>
        <span style={{ color: '#9ca3af' }}>{'{'}</span>
        <div style={{ paddingLeft: 18 }}>
          {entries.map(([k, v], i) => (
            <div key={k}>
              <span style={{ color: '#2563eb' }}>"{k}"</span>
              <span style={{ color: '#9ca3af' }}>: </span>
              <JsonHighlight data={v} />
              {i < entries.length - 1 && <span style={{ color: '#9ca3af' }}>,</span>}
            </div>
          ))}
        </div>
        <span style={{ color: '#9ca3af' }}>{'}'}</span>
      </>
    )
  }

  return <span>{String(data)}</span>
}
