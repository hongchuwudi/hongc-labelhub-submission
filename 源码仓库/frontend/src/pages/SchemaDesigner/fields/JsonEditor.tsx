/** JsonEditor.tsx — JSON 编辑器字段预览
 * Author: hongchuwudi
 * Description: 画布上渲染 JSON 编辑器的预览
 */
import { useState } from 'react'
import { Button } from 'antd'
import { FormatPainterOutlined } from '@ant-design/icons'
import type { FieldLabelProps } from './types'

/** JsonEditor — JSON 编辑器组件预览 */
export default function JsonEditor({ field }: FieldLabelProps) {
  const initial = field.defaultValue
    ? JSON.stringify(field.defaultValue, null, 2)
    : '{\n  \n}'
  const [text, setText] = useState(initial)
  const [error, setError] = useState<string | null>(null)

  const handleFormat = () => {
    try {
      setText(JSON.stringify(JSON.parse(text), null, 2))
      setError(null)
    } catch {
      setError('JSON 格式错误')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
          {field.key || 'json'}
        </span>
        <Button size="small" icon={<FormatPainterOutlined />} onClick={handleFormat}
          style={{ fontSize: 11, height: 22, padding: '0 6px' }}>
          格式化
        </Button>
      </div>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setError(null) }}
        rows={6}
        spellCheck={false}
        style={{
          width: '100%', resize: 'vertical', padding: 12, borderRadius: 6,
          border: error ? '1px solid #ef4444' : '1px solid #334155',
          outline: 'none',
          fontFamily: '"JetBrains Mono", Fira Code, Consolas, monospace',
          fontSize: 13, lineHeight: 1.6,
          background: '#1e293b', color: '#e2e8f0',
        }}
        placeholder={field.placeholder || '{"key": "value"}'}
      />
      {error && (
        <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</div>
      )}
    </div>
  )
}
