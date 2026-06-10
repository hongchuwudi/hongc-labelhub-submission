/**
 * DimensionScores.tsx — 维度评分条形图
 * Author: hongchuwudi
 * Description: 各维度分数 + 进度条 + 综合得分
 */
import { Tag } from 'antd'

/** 维度评分条形图组件 */
export default function DimensionScores({ dimensions, overallScore, model }: {
  dimensions: { name: string; score: number; reason?: string }[] | null
  overallScore: number | null
  model: string | null
}) {
  const dims = dimensions || []
  if (dims.length === 0 && overallScore == null) {
    return (
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          维度评分
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>暂无评分数据</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          维度评分
        </span>
        {model && (
          <Tag style={{ margin: 0, fontSize: 10, color: '#6b7280' }}>
            function_calling · {model}
          </Tag>
        )}
      </div>

      {dims.map((d, i) => {
        const pct = Math.round(d.score * 100)
        const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'
        return (
          <div key={i} style={{
            marginBottom: 10, padding: '10px 12px',
            background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>{d.name}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color }}>{pct}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: '#f0f0f0', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, width: `${pct}%`,
                background: color,
                transition: 'width 0.4s ease',
              }} />
            </div>
            {d.reason && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{d.reason}</div>
            )}
          </div>
        )
      })}

      {/* 综合得分 */}
      {overallScore != null && (
        <div style={{
          marginTop: 16, padding: '14px 16px', borderRadius: 10,
          background: overallScore >= 80 ? '#ecfdf5' : overallScore >= 50 ? '#fffbeb' : '#fef2f2',
          border: `2px solid ${overallScore >= 80 ? '#10b981' : overallScore >= 50 ? '#f59e0b' : '#ef4444'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>综合得分</span>
          <span style={{
            fontSize: 28, fontWeight: 800,
            color: overallScore >= 80 ? '#10b981' : overallScore >= 50 ? '#f59e0b' : '#ef4444',
          }}>
            {Math.round(overallScore)}
          </span>
        </div>
      )}
    </div>
  )
}
