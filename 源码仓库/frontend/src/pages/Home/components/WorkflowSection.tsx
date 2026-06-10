/** WorkflowSection.tsx — 工作流步骤条 */
const STEPS = [
  { label: '建数据集', sub: 'Owner 导入数据' },
  { label: '搭模板', sub: '拖拽搭建表单' },
  { label: '建任务', sub: '绑定 + 发布' },
  { label: '标注', sub: 'Labeler 作答' },
  { label: 'AI 预审', sub: 'Agent 评分' },
  { label: '审核', sub: '复审 → 终审' },
  { label: '导出', sub: '多格式下载' },
]

/** 工作流步骤条：从创建任务到数据导出的完整链路 */
export default function WorkflowSection({ mobile }: { mobile: boolean }) {
  const p = mobile ? 24 : 80
  return (
    <section style={{ padding: `${p}px 24px`, background: '#fafafc', textAlign: 'center' }}>
      <h2 style={{ fontSize: mobile ? 24 : 34, fontWeight: 700, margin: '0 0 12px' }}>工作流</h2>
      <p style={{ fontSize: 15, color: '#6b7280', margin: '0 auto 56px', maxWidth: 500 }}>从创建数据集到数据导出，一条完整的链路</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: mobile ? 12 : 0, maxWidth: 900, margin: '0 auto' }}>
        {STEPS.map((step, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={i === 0 ? stepActive : stepCircle}>{i + 1}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{step.label}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{step.sub}</div>
            </div>
            {i < arr.length - 1 && (
              <div style={{ width: mobile ? 0 : 40, height: 2, background: '#e5e7eb', margin: '0 8px', marginTop: -24 }} />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

const stepCircle: React.CSSProperties = { width: 56, height: 56, borderRadius: '50%', background: '#e5e7eb', color: '#374151', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }
const stepActive: React.CSSProperties = { ...stepCircle, background: '#4f46e5', color: '#fff' }
