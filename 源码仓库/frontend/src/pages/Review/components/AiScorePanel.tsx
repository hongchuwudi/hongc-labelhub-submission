/**
 * AiScorePanel.tsx — AI 评分面板
 * Author: hongchuwudi
 * Description: AI 评分结论、维度分数、Prompt 模板展示
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
import { Tag, Card, Alert } from 'antd'
import type { AiScoreData } from '@/types/models/ai'

/** AiScoreData 类型 */
export type { AiScoreData }

/** AI 评分面板组件 */
export default function AiScorePanel({ ai }: { ai: AiScoreData }) {
  const dims = ai.dimensions || []
  const verdictLabels: Record<string, { color: string; label: string }> = {
    pass: { color: '#10b981', label: 'AI 判定: 合格' },
    reject: { color: '#ef4444', label: 'AI 判定: 不合格' },
    human_review: { color: '#f59e0b', label: 'AI 判定: 建议人工复核' },
  }
  const v = verdictLabels[ai.verdict] || { color: '#9ca3af', label: ai.verdict }

  return (
    <div>
      {/* 结论 */}
      <Tag color={v.color} style={{ marginBottom: 12, fontSize: 13, padding: '3px 12px', fontWeight: 600 }}>
        {v.label}
      </Tag>

      {/* 综合分 */}
      {dims.length > 0 && (
        <Card size="small" style={{ marginBottom: 14, background: '#fff1f0', borderColor: '#ffccc7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>综合评分</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: v.label.includes('不合格') ? '#ef4444' : v.label.includes('合格') ? '#10b981' : '#f59e0b' }}>
              {Math.round(dims.reduce((s: number, d) => s + d.score * 100, 0) / dims.length)}
            </span>
          </div>
        </Card>
      )}

      {ai.summary && (
        <Alert type="warning" message="AI 评语" description={ai.summary} showIcon
          style={{ marginBottom: 14 }} />
      )}

      {/* 维度评分 */}
      {dims.map((d, i: number) => (
        <div key={i} style={{
          marginBottom: 10, padding: '10px 12px',
          background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</span>
            <span style={{ fontSize: 14, fontWeight: 700,
              color: d.score >= 0.7 ? '#10b981' : d.score >= 0.4 ? '#f59e0b' : '#ef4444',
            }}>{(d.score * 100).toFixed(0)}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#f3f4f6' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${Math.round(d.score * 100)}%`,
              background: d.score >= 0.7 ? '#10b981' : d.score >= 0.4 ? '#f59e0b' : '#ef4444',
            }} />
          </div>
          {d.reason && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{d.reason}</div>}
        </div>
      ))}

      {/* 元信息 + Prompt */}
      <div style={{ marginTop: 14, padding: '10px 0', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
          模型: {ai.model || '-'} | 审核时间: {ai.reviewed_at ? dayjs.utc(ai.reviewed_at).local().format('MM/DD HH:mm:ss') : '-'}
        </div>
        {ai.reviewer_name && <div style={{ fontSize: 11, color: '#9ca3af' }}>审核者: {ai.reviewer_name} ({ai.reviewer_type})</div>}
      </div>

      {ai.prompt_template && (
        <details style={{ marginTop: 8, fontSize: 12 }}>
          <summary style={{ cursor: 'pointer', color: '#6b7280', fontWeight: 500 }}>查看原始 Prompt</summary>
          <pre style={{
            marginTop: 8, padding: 10, background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb',
            fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto',
          }}>{ai.prompt_template}</pre>
          <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
            Prompt 变量: {JSON.stringify(ai.prompt_vars, null, 2)}
          </div>
        </details>
      )}
    </div>
  )
}
