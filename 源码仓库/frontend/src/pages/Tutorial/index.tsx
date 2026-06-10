/** index.tsx — 使用教程页
 * Author: hongchuwudi
 * Description: 教程主页，左侧可折叠侧边导航 + 右侧 Markdown 内容区
 */
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ContentArea from './components/ContentArea'
import type { TocChapter, TocSection } from './components/Sidebar'
import tocData from './toc.json'

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

const TOC: TocChapter[] = tocData

/** 教程页面主组件 */
export default function TutorialPage() {
  const mobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const firstSection = TOC[0]!.sections[0]!
  const [activeChapter, setActiveChapter] = useState<TocChapter>(TOC[0]!)
  const [activeSection, setActiveSection] = useState<TocSection>(firstSection)

  useEffect(() => { setCollapsed(mobile) }, [mobile])

  const handleSelect = (ch: TocChapter, sec: TocSection) => {
    setActiveChapter(ch)
    setActiveSection(sec)
    if (mobile) setSidebarOpen(false)
  }

  const toggleBtn = (
    <button onClick={() => mobile ? setSidebarOpen(!sidebarOpen) : setCollapsed(!collapsed)}
      style={s.toggleBtn(mobile, sidebarOpen)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {collapsed && !mobile
          ? <><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></>
          : <><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /></>}
      </svg>
    </button>
  )

  return (
    <div style={{ display: 'flex', height: 'calc(100% + 48px)', overflow: 'hidden', position: 'relative', margin: '-24px -28px' }}>
      {!mobile && <Sidebar activeSection={activeSection.id} onSelect={handleSelect} collapsed={collapsed} width={220} />}

      {mobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={s.overlay} />}
      {mobile && (
        <div style={s.drawer(sidebarOpen)}>
          <Sidebar activeSection={activeSection.id} onSelect={handleSelect} collapsed={false} width={260} />
        </div>
      )}

      <div style={s.main}>
        <div style={s.topBar}>
          {toggleBtn}
          <span style={{ fontSize: 13, color: '#9ca3af' }}>{activeChapter.title} / {activeSection.title}</span>
        </div>
        <ContentArea chapter={activeChapter} section={activeSection} />
      </div>
    </div>
  )
}

const s = {
  overlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 9 } as React.CSSProperties,
  drawer: (open: boolean): React.CSSProperties => ({
    position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10,
    transform: open ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform .25s ease',
  }),
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
  topBar: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 } as React.CSSProperties,
  toggleBtn: (mobile: boolean, sidebarOpen: boolean): React.CSSProperties => ({
    width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb',
    background: mobile && sidebarOpen ? '#eef2ff' : '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#6b7280', flexShrink: 0, padding: 0,
  }),
}
