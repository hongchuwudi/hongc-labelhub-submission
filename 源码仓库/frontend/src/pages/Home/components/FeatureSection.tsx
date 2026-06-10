/** FeatureSection.tsx — 核心功能卡片区 */
const ICONS = {
  schema: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  ai: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  review: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  export: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
}

const FEATURES = [
  { icon: ICONS.schema, title: 'Schema 可视化搭建', desc: '拖拽组件动态搭建标注表单，JSON Schema 驱动渲染，支持字段联动与校验' },
  { icon: ICONS.ai, title: 'AI 自动预审', desc: '可配置评分维度，LLM 结构化输出，异步队列处理，失败重试与人工兜底' },
  { icon: ICONS.review, title: '多角色审核流转', desc: '复审 / 终审 / 入库，打回附理由，完整审计时间线，批量操作' },
  { icon: ICONS.export, title: '多格式数据导出', desc: 'JSON / JSONL / CSV / Excel 四种格式，异步导出 + 下载历史' },
]

/** 核心功能卡片区：Schema 搭建 / AI 预审 / 多角色审核 / 多格式导出 */
export default function FeatureSection({ mobile }: { mobile: boolean }) {
  const p = mobile ? 24 : 80
  return (
    <section style={{ padding: `${p}px 24px`, background: '#fff', textAlign: 'center' }}>
      <h2 style={{ fontSize: mobile ? 24 : 34, fontWeight: 700, margin: '0 0 12px' }}>核心功能</h2>
      <p style={{ fontSize: 15, color: '#6b7280', margin: '0 auto 56px', maxWidth: 500 }}>覆盖数据标注全生命周期</p>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(4, 1fr)', gap: 20, maxWidth: 960, margin: '0 auto' }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={card}>
            <div style={{ marginBottom: 14 }}>{f.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

const card: React.CSSProperties = { padding: 28, borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', textAlign: 'left' }
