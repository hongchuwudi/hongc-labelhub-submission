/** MarkdownRenderer.tsx — 轻量 Markdown 渲染器（无外部依赖） */
import React, { type ReactNode } from 'react'

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let rest = text
  let key = 0

  while (rest.length > 0) {
    // image ![alt](url)
    let m = rest.match(/^!\[(.+?)\]\((.+?)\)/)
    if (m) { nodes.push(<img key={key++} src={m[2]} alt={m[1]} style={{ maxWidth: '100%', borderRadius: 8, margin: '16px 0', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }} />); rest = rest.slice(m[0].length); continue }
    // bold
    m = rest.match(/^\*\*(.+?)\*\*/)
    if (m) { nodes.push(<strong key={key++}>{m[1]}</strong>); rest = rest.slice(m[0].length); continue }
    // italic
    m = rest.match(/^\*(.+?)\*/)
    if (m) { nodes.push(<em key={key++}>{m[1]}</em>); rest = rest.slice(m[0].length); continue }
    // inline code
    m = rest.match(/^`(.+?)`/)
    if (m) { nodes.push(<code key={key++} style={s.inlineCode}>{m[1]}</code>); rest = rest.slice(m[0].length); continue }
    // link
    m = rest.match(/^\[(.+?)\]\((.+?)\)/)
    if (m) { nodes.push(<a key={key++} href={m[2]} style={s.link}>{m[1]}</a>); rest = rest.slice(m[0].length); continue }
    // plain text until next special char
    const idx = rest.search(/[\[!*`]/)
    if (idx === -1) { nodes.push(rest); break }
    if (idx > 0) { nodes.push(rest.slice(0, idx)); rest = rest.slice(idx) }
    else { nodes.push(rest[0]!); rest = rest.slice(1) }
  }
  return nodes
}

function isOrderedList(lines: string[], start: number): boolean {
  return /^\d+\.\s/.test(lines[start]!)
}

function isUnorderedList(lines: string[], start: number): boolean {
  return /^[-*]\s/.test(lines[start]!)
}

/** 轻量 Markdown 渲染器，支持标题 / 列表 / 代码块 / 表格 / 引用 / 行内样式 */
export default function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null
  const lines = content.split('\n')
  const elements: ReactNode[] = []
  let i = 0
  let key = 0
  let inCodeBlock = false
  let codeLines: string[] = []

  while (i < lines.length) {
    const raw = lines[i]!
    const line = raw.trim()

    // code block fence
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={key++} style={s.codeBlock}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        )
        codeLines = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      i++
      continue
    }

    if (inCodeBlock) {
      codeLines.push(raw)
      i++
      continue
    }

    // empty line
    if (!line) { i++; continue }

    // heading
    const hMatch = line.match(/^(#{1,4})\s(.+)/)
    if (hMatch) {
      const level = hMatch[1]!.length
      const fontSize = { 1: 24, 2: 20, 3: 17, 4: 15 }[level] || 15
      const marginBottom = { 1: 20, 2: 16, 3: 12, 4: 10 }[level] || 10
      const style = { ...s.heading, fontSize, marginBottom, fontWeight: level <= 2 ? 700 : 600 }
      const text = hMatch[2]
      if (level === 1) elements.push(<h1 key={key++} style={style}>{text}</h1>)
      else if (level === 2) elements.push(<h2 key={key++} style={style}>{text}</h2>)
      else if (level === 3) elements.push(<h3 key={key++} style={style}>{text}</h3>)
      else elements.push(<h4 key={key++} style={style}>{text}</h4>)
      i++; continue
    }

    // horizontal rule
    if (/^[-*_]{3,}$/.test(line)) {
      elements.push(<hr key={key++} style={s.hr} />)
      i++; continue
    }

    // blockquote
    if (line.startsWith('>')) {
      const qLines: string[] = []
      while (i < lines.length && lines[i]!.trim().startsWith('>')) {
        qLines.push(lines[i]!.trim().replace(/^>\s?/, ''))
        i++
      }
      const isTip = qLines[0]?.startsWith('**')
      const bg = isTip ? '#eff6ff' : '#f9fafb'
      const borderColor = isTip ? '#93c5fd' : '#e5e7eb'
      elements.push(
        <blockquote key={key++} style={{ ...s.blockquote, background: bg, borderLeftColor: borderColor }}>
          {qLines.map((ql, qi) => (
            <p key={qi} style={{ margin: '6px 0', fontSize: 14, lineHeight: 1.8, color: '#374151' }}>{parseInline(ql)}</p>
          ))}
        </blockquote>
      )
      continue
    }

    // ordered list
    if (isOrderedList(lines, i)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i]!.trim())) {
        items.push(lines[i]!.trim().replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={key++} style={s.list}>
          {items.map((item, idx) => <li key={idx} style={s.listItem}>{parseInline(item)}</li>)}
        </ol>
      )
      continue
    }

    // unordered list
    if (isUnorderedList(lines, i)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i]!.trim())) {
        items.push(lines[i]!.trim().replace(/^[-*]\s/, ''))
        i++
      }
      elements.push(
        <ul key={key++} style={s.list}>
          {items.map((item, idx) => <li key={idx} style={s.listItem}>{parseInline(item)}</li>)}
        </ul>
      )
      continue
    }

    // table
    if (line.startsWith('|') && i + 1 < lines.length && lines[i + 1]!.trim().startsWith('|')) {
      const headerCells = line.split('|').filter(Boolean).map((c) => c.trim())
      i += 2 // skip separator row
      const rows: string[][] = []
      while (i < lines.length && lines[i]!.trim().startsWith('|')) {
        rows.push(lines[i]!.trim().split('|').filter(Boolean).map((c) => c.trim()))
        i++
      }
      elements.push(
        <table key={key++} style={s.table}>
          <thead><tr>{headerCells.map((c, ci) => <th key={ci} style={s.th}>{parseInline(c)}</th>)}</tr></thead>
          <tbody>{rows.map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci} style={s.td}>{parseInline(c)}</td>)}</tr>)}</tbody>
        </table>
      )
      continue
    }

    // paragraph
    elements.push(<p key={key++} style={s.paragraph}>{parseInline(line)}</p>)
    i++
  }

  return <div style={{ maxWidth: 720 }}>{elements}</div>
}

const s = {
  heading: { color: '#111827', lineHeight: 1.3, marginTop: 0 } as React.CSSProperties,
  paragraph: { fontSize: 15, color: '#374151', lineHeight: 1.85, margin: '0 0 16px' } as React.CSSProperties,
  inlineCode: { background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 13, fontFamily: '"JetBrains Mono", monospace', color: '#dc2626' } as React.CSSProperties,
  codeBlock: { background: '#1a1a2e', color: '#e2e8f0', padding: '16px 20px', borderRadius: 10, fontSize: 13, lineHeight: 1.7, fontFamily: '"JetBrains Mono", monospace', overflow: 'auto', whiteSpace: 'pre-wrap', margin: '0 0 20px' } as React.CSSProperties,
  link: { color: '#4f46e5' } as React.CSSProperties,
  blockquote: { padding: '12px 16px', borderRadius: 8, borderLeft: '3px solid #93c5fd', margin: '0 0 20px' } as React.CSSProperties,
  list: { paddingLeft: 24, margin: '0 0 16px' } as React.CSSProperties,
  listItem: { fontSize: 15, color: '#374151', lineHeight: 1.85, marginBottom: 4 } as React.CSSProperties,
  hr: { border: 'none', borderTop: '1px solid #e5e7eb', margin: '24px 0' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse', margin: '0 0 20px', fontSize: 14 } as React.CSSProperties,
  th: { padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 600, color: '#374151' } as React.CSSProperties,
  td: { padding: '10px 14px', border: '1px solid #e5e7eb', color: '#374151' } as React.CSSProperties,
}
