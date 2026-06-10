/** DashboardPreviewSection.tsx — 数据看板预览 */
const CHART_DATA = [
  { time: '00:00', value: 12 }, { time: '02:00', value: 8 }, { time: '04:00', value: 5 },
  { time: '06:00', value: 15 }, { time: '08:00', value: 42 }, { time: '10:00', value: 68 },
  { time: '12:00', value: 52 }, { time: '14:00', value: 73 }, { time: '16:00', value: 89 },
  { time: '18:00', value: 95 }, { time: '20:00', value: 64 }, { time: '22:00', value: 31 },
]

const STATS = [
  { label: '今日提交', value: '128', trend: '+12%', color: '#4f46e5' },
  { label: 'AI 预审通过', value: '89', trend: '69.5%', color: '#10b981' },
  { label: '待审核', value: '34', trend: '-8%', color: '#f59e0b' },
  { label: '已入库', value: '1,247', trend: '+23%', color: '#8b5cf6' },
]

/** 数据看板预览：统计卡片 + 提交趋势柱状图 */
export default function DashboardPreviewSection({ mobile }: { mobile: boolean }) {
  const p = mobile ? 32 : 80
  const maxVal = Math.max(...CHART_DATA.map((d) => d.value))

  return (
    <section style={{ padding: `${p}px 24px`, background: '#fafafc', textAlign: 'center' }}>
      <h2 style={{ fontSize: mobile ? 26 : 34, fontWeight: 700, margin: '0 0 8px' }}>数据看板</h2>
      <p style={{ fontSize: 15, color: '#6b7280', margin: '0 auto 48px', maxWidth: 500 }}>实时掌握标注进度与质量指标</p>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 16, maxWidth: 800, margin: '0 auto 32px' }}>
        {STATS.map((c, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '20px 16px', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{c.value}</div>
            <div style={{ fontSize: 12, color: c.color, marginTop: 4, fontWeight: 500 }}>{c.trend}</div>
          </div>
        ))}
      </div>

      {/* 柱状图 */}
      <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', borderRadius: 16, padding: '24px 20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>提交趋势</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>近 12 小时</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: mobile ? 2 : 6, height: 160, paddingTop: 10 }}>
          {CHART_DATA.map((d, i) => {
            const h = 20 + ((d.value - 5) / (maxVal - 5)) * 130
            const isHigh = d.value > 80
            const isMid = d.value > 40
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', maxWidth: 44, height: h,
                  background: isHigh ? 'linear-gradient(180deg, #8b5cf6 0%, #a78bfa 100%)'
                    : isMid ? 'linear-gradient(180deg, #6366f1 0%, #818cf8 100%)'
                    : 'linear-gradient(180deg, #e0e7ff 0%, #c7d2fe 100%)',
                  borderRadius: '4px 4px 0 0',
                }} />
                {!mobile && <span style={{ fontSize: 9, color: isHigh ? '#7c3aed' : '#9ca3af', fontWeight: isHigh ? 600 : 400 }}>{d.time}</span>}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14, fontSize: 11, color: '#9ca3af' }}>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#a78bfa', marginRight: 4 }} />高</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#6366f1', marginRight: 4 }} />中</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#c7d2fe', marginRight: 4 }} />低</span>
        </div>
      </div>
    </section>
  )
}
