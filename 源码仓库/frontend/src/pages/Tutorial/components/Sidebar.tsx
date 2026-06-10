/** Sidebar.tsx — 基于 JSON 目录的左侧导航 */
import { useState } from 'react'
import tocData from '../toc.json'

/** 目录中的单个章节项 */
export interface TocSection {
  id: string
  title: string
  file: string
}

/** 目录中的章，包含多个章节 */
export interface TocChapter {
  id: string
  icon: string
  title: string
  sections: TocSection[]
}

const ICONS: Record<string, string> = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  layout: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
  file: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  cpu: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
}

const TOC: TocChapter[] = tocData

/** 教程左侧导航侧边栏，支持章节折叠和高亮当前章节 */
export default function Sidebar({ activeSection, onSelect, collapsed, width: _width }: {
  activeSection: string
  onSelect: (ch: TocChapter, sec: TocSection) => void
  collapsed: boolean
  width: number
}) {
  const [expanded, setExpanded] = useState(new Set(TOC.map((c) => c.id)))

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (collapsed) return null

  return (
    <nav style={s.nav}>
      <div style={s.navTitle}>使用教程</div>
      {TOC.map((ch) => (
        <div key={ch.id}>
          <div onClick={() => toggle(ch.id)} style={s.chapterTitle}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d={ICONS[ch.icon] || ICONS.home} />
            </svg>
            <span style={{ flex: 1 }}>{ch.title}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{ transform: expanded.has(ch.id) ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .15s' }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
          {expanded.has(ch.id) && (
            <div>
              {ch.sections.map((sec) => (
                <div key={sec.id} onClick={() => onSelect(ch, sec)}
                  style={{
                    ...s.sectionItem,
                    background: activeSection === sec.id ? '#eef2ff' : 'transparent',
                    color: activeSection === sec.id ? '#4f46e5' : '#6b7280',
                    fontWeight: activeSection === sec.id ? 600 : 400,
                    borderRight: activeSection === sec.id ? '2px solid #4f46e5' : '2px solid transparent',
                  }}
                >
                  {sec.title}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}

const s = {
  nav: { flexShrink: 0, borderRight: '1px solid #f3f4f6', background: '#fafafc', overflow: 'auto', height: '100%', transition: 'width .2s ease', width: 220 } as React.CSSProperties,
  navTitle: { fontSize: 14, fontWeight: 700, color: '#111827', padding: '12px 16px', borderBottom: '1px solid #f3f4f6', marginBottom: 4 } as React.CSSProperties,
  chapterTitle: { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' } as React.CSSProperties,
  sectionItem: { padding: '6px 14px 6px 38px', fontSize: 12, cursor: 'pointer', transition: 'all .1s' } as React.CSSProperties,
}
