/** ContentArea.tsx — 动态导入 MD 文件 + Markdown 渲染 */
import { useEffect, useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import type { TocChapter, TocSection } from './Sidebar'

const mdModules = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>

/** 教程内容区：动态导入 MD 文件并通过 MarkdownRenderer 渲染 */
export default function ContentArea({ chapter, section }: { chapter: TocChapter; section: TocSection }) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loader = mdModules[`../content/${section.file}`]
    if (!loader) { setContent('*内容文件未找到*'); return }
    setLoading(true)
    loader().then((md: string) => { setContent(md); setLoading(false) })
  }, [section.file])

  return (
    <div style={s.wrap}>
      <div style={s.breadcrumb}>{chapter.title} / {section.title}</div>
      {loading ? (
        <div style={{ padding: 40, color: '#9ca3af' }}>加载中...</div>
      ) : (
        <MarkdownRenderer content={content} />
      )}
    </div>
  )
}

const s = {
  wrap: { flex: 1, overflow: 'auto', padding: '40px 48px' } as React.CSSProperties,
  breadcrumb: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
}
