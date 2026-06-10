/** JsonEditor.tsx — JSON 语法高亮编辑器（textarea + pre 叠加）+ 字体设置
 * Author: hongchuwudi
 * Description: 标签台/预览共用，白底亮色主题，持久化字体设置到 localStorage
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { Select } from 'antd'

const FONT_OPTIONS = [
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { label: 'Fira Code', value: '"Fira Code", monospace' },
  { label: 'Consolas', value: 'Consolas, monospace' },
  { label: 'Monospace', value: 'monospace' },
]

const FONT_SIZES = [11, 12, 13, 14, 16, 18]

const STORAGE_KEY = 'labelhub_json_editor_settings'

function loadSettings(): { fontSize: number; fontFamily: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { fontSize: 13, fontFamily: '"JetBrains Mono", monospace' }
}

// 白底亮色高亮配色
const HC = { key: '#1d4ed8', str: '#047857', num: '#b45309', kw: '#9333ea', punct: '#6b7280' }

function highlightJson(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let i = 0

  const pushSpan = (content: string, color: string) => {
    nodes.push(<span key={i++} style={{ color }}>{content}</span>)
  }

  let pos = 0
  const len = text.length

  while (pos < len) {
    const ch = text[pos]!

    // 空白
    if (/\s/.test(ch)) {
      let end = pos
      while (end < len && /\s/.test(text[end]!)) end++
      pushSpan(text.slice(pos, end), 'inherit')
      pos = end
      continue
    }

    // 字符串
    if (ch === '"') {
      let end = pos + 1
      while (end < len) {
        if (text[end] === '\\') { end += 2; continue }
        if (text[end] === '"') { end++; break }
        end++
      }
      const str = text.slice(pos, end)
      let after = end
      while (after < len && /\s/.test(text[after]!)) after++
      if (text[after] === ':') {
        pushSpan(str, HC.key)
      } else {
        pushSpan(str, HC.str)
      }
      pos = end
      continue
    }

    // 数字
    if (/[-\d]/.test(ch)) {
      let end = pos
      if (text[end] === '-') end++
      while (end < len && /[\d.eE+]/.test(text[end]!)) end++
      pushSpan(text.slice(pos, end), HC.num)
      pos = end
      continue
    }

    // boolean / null
    if ('tfn'.includes(ch)) {
      const subs = text.slice(pos, pos + 5)
      if (subs.startsWith('true')) { pushSpan('true', HC.kw); pos += 4; continue }
      if (subs.startsWith('false')) { pushSpan('false', HC.kw); pos += 5; continue }
      if (subs.startsWith('null')) { pushSpan('null', HC.kw); pos += 4; continue }
    }

    // 结构字符
    if ('{}[],:'.includes(ch)) {
      pushSpan(ch, HC.punct)
      pos++
      continue
    }

    // fallback
    pushSpan(ch, 'inherit')
    pos++
  }

  return nodes
}

/** JSON 编辑器 Props */
export interface JsonEditorProps {
  value: string
  onChange: (text: string) => void
  placeholder?: string
  rows?: number
}

/** JSON 语法高亮编辑器组件 */
export default function JsonEditor({ value, onChange, placeholder, rows = 6 }: JsonEditorProps) {
  const [settings, setSettings] = useState(loadSettings)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const [localText, setLocalText] = useState(value)
  const [focused, setFocused] = useState(false)

  useEffect(() => { setLocalText(value) }, [value])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)) } catch { /* ignore */ }
  }, [settings])

  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop
      preRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setLocalText(newText)
    onChange(newText)
  }

  const lineCount = localText.split('\n').length
  const actualRows = Math.max(rows, Math.min(lineCount + 1, 20))

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
        <Select
          size="small"
          value={settings.fontFamily}
          onChange={(v: string) => setSettings((prev) => ({ ...prev, fontFamily: v }))}
          options={FONT_OPTIONS}
          style={{ width: 170 }}
          popupMatchSelectWidth={false}
        />
        <Select
          size="small"
          value={settings.fontSize}
          onChange={(v: number) => setSettings((prev) => ({ ...prev, fontSize: v }))}
          options={FONT_SIZES.map((n) => ({ value: n, label: `${n}px` }))}
          style={{ width: 68 }}
        />
      </div>

      <div style={{ position: 'relative', width: '100%', minHeight: actualRows * 24 + 24 }}>
        {/* 语法高亮层 */}
        <pre
          ref={preRef}
          aria-hidden
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            margin: 0,
            padding: '12px',
            borderRadius: 6,
            border: '1px solid transparent',
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'auto',
            background: '#ffffff',
            color: '#1a1a2e',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {localText ? highlightJson(localText) : !focused ? <span style={{ color: '#9ca3af' }}>{placeholder || '{"key": "value"}'}</span> : null}
        </pre>

        {/* 输入层——文字透明，placeholder 由 pre 层显示 */}
        <textarea
          ref={textareaRef}
          value={localText}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onScroll={handleScroll}
          rows={actualRows}
          spellCheck={false}
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            padding: 12,
            borderRadius: 6,
            border: '1px solid #d1d5db',
            outline: 'none',
            resize: 'vertical',
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'auto',
            background: 'transparent',
            color: 'transparent',
            caretColor: '#1a1a2e',
          }}
        />
      </div>
    </div>
  )
}
