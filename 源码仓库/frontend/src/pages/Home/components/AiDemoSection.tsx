/** AiDemoSection.tsx — AI 预审功能展示 */
/** AI 预审功能展示：维度评分 + 综合判定 */
export default function AiDemoSection({ mobile }: { mobile: boolean }) {
  const p = mobile ? 32 : 80
  return (
    <section style={{ padding: `${p}px 24px`, background: '#fff' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: mobile ? 32 : 60, alignItems: 'center', flexDirection: mobile ? 'column-reverse' : 'row' }}>
        {/* 左侧：维度评分示意 */}
        <div style={{ flex: '1 1 55%', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.06)', padding: mobile ? 16 : 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="4"/><circle cx="12" cy="12" r="3"/><path d="M8 8v.01M16 8v.01"/></svg>
          </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>AI 预审评分</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>dimension scoring</div>
            </div>
          </div>
          {[
            { label: '相关性', score: 92, color: '#4f46e5' },
            { label: '准确性', score: 78, color: '#10b981' },
            { label: '格式合规', score: 85, color: '#f59e0b' },
            { label: '安全性', score: 96, color: '#8b5cf6' },
          ].map((d, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span style={{ color: '#374151' }}>{d.label}</span>
                <span style={{ fontWeight: 600, color: d.color }}>{d.score}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#f3f4f6', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${d.score}%`, borderRadius: 3, background: d.color, transition: 'width 1s ease' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, background: '#fefce8', border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>
            AI 综合判定：<strong>建议通过</strong>（综合得分 87.7）
          </div>
        </div>
        {/* 右侧文字 */}
        <div style={{ flex: '1 1 45%', textAlign: mobile ? 'center' : 'left' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 1 }}>AI Agent</span>
          <h2 style={{ fontSize: mobile ? 26 : 32, fontWeight: 700, margin: '8px 0 16px' }}>智能预审提升标注质量</h2>
          <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.8, margin: 0 }}>
            任务负责人配置 Prompt 模板和评分维度，标注员提交后自动入队。
            AI Agent 调大模型按维度打分，给出通过/打回/人工复核结论。
            评分结果与原始 Prompt 一并入库，审核工作台可完整追溯。
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 24, justifyContent: mobile ? 'center' : 'flex-start' }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>Function</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Calling 输出</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>Async</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>MQ 异步队列</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
