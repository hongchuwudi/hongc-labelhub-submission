/** RoleSection.tsx — 三角色介绍卡片 */

const ICONS = {
  owner: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="5"/><path d="M3 21v-2a7 7 0 017-7h4a7 7 0 017 7v2"/></svg>,
  labeler: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  reviewer: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
}

const ROLES = [
  {
    icon: ICONS.owner, title: '任务负责人', tag: 'Owner',
    tasks: ['创建任务 & 数据集管理', 'Schema 可视化搭建', '配置 AI 审核策略', '多格式数据导出'],
    color: '#4f46e5', bg: '#eef2ff',
  },
  {
    icon: ICONS.labeler, title: '标注员', tag: 'Labeler',
    tasks: ['浏览任务广场认领任务', '在线作答 & 草稿自动保存', '题目级 LLM 辅助', '查看打回原因并修改'],
    color: '#059669', bg: '#ecfdf5',
  },
  {
    icon: ICONS.reviewer, title: '审核员', tag: 'Reviewer',
    tasks: ['查看 AI 预审评分', '复审 & 终审多级流转', '打回附理由 & 批量操作', '完整审计时间线追溯'],
    color: '#d97706', bg: '#fffbeb',
  },
]

/** 三角色（Owner / Labeler / Reviewer）介绍卡片 */
export default function RoleSection({ mobile }: { mobile: boolean }) {
  const p = mobile ? 32 : 80
  return (
    <section style={{ padding: `${p}px 24px`, background: '#fff', textAlign: 'center' }}>
      <h2 style={{ fontSize: mobile ? 26 : 34, fontWeight: 700, margin: '0 0 8px' }}>三大角色协同</h2>
      <p style={{ fontSize: 15, color: '#6b7280', margin: '0 auto 56px', maxWidth: 500 }}>覆盖数据标注全流程的完整角色体系</p>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }}>
        {ROLES.map((r, i) => (
          <div key={i} style={{ padding: '32px 24px', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: r.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{r.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: r.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{r.tag}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>{r.title}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
              {r.tasks.map((t, j) => (
                <li key={j} style={{ padding: '6px 0', fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: r.bg, color: r.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ICONS.check}</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
