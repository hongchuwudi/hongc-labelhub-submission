/**
 * StatusFlow.tsx — 统一状态流转展示组件
 * Author: hongchuwudi
 * Description: 标注台/复审/终审/AI预审 全页面共用的状态+审计时间线渲染
 */
import { Tag } from 'antd'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

/** LabelResult 状态 → 中文 + 颜色 */
export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待标注', color: '#9ca3af' },
  draft: { label: '草稿', color: '#9ca3af' },
  submitted: { label: '已提交', color: '#3b82f6' },
  ai_reviewing: { label: 'AI 初审中', color: '#3b82f6' },
  review: { label: '复审中', color: '#f59e0b' },
  rejected: { label: '已打回', color: '#ef4444' },
  final_review: { label: '终审中', color: '#8b5cf6' },
  warehouse: { label: '已入库', color: '#10b981' },
  // 兼容旧状态
  approved: { label: '已入库', color: '#10b981' },
  ai_human_review: { label: '复审中', color: '#f59e0b' },
  initial_review: { label: '初审中', color: '#f59e0b' },
}

/** 审计 action → 中文 */
export const ACTION_MAP: Record<string, string> = {
  ai_review_start: 'AI 开始审核',
  ai_reject: 'AI 判定不合格',
  ai_to_review: 'AI 通过→复审',
  ai_to_human_review: 'AI 通过→复审',
  ai_to_final: 'AI→终审',
  initial_approve: '初审通过',
  final_approve: '终审通过→入库',
  reject: '已驳回',
  approve: '已通过',
  ai_to_initial_review: 'AI→初审',
  ai_escalate_human: 'AI→转人工',
}

/** 流转历史条目 */
export type FlowEntry = { status: string; time: string; actor: string; actor_name: string; round: number; detail?: string }
/** 审计日志条目 */
export type AuditEntry = { action: string; actor_name: string; actor_role: string; from_status: string; to_status: string; created_at: string; detail?: string }

/** 从 flow_history 渲染时间线 */
export function FlowTimeline({ entries }: { entries: FlowEntry[] }) {
  if (entries.length === 0) return <div style={{ textAlign: 'center', padding: 16, color: '#9ca3af', fontSize: 12 }}>暂无记录</div>
  const reversed = [...entries].reverse()
  return (
    <div style={{ position: 'relative', paddingLeft: 16 }}>
      <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 2, background: '#e5e7eb' }} />
      {reversed.map((e, i) => {
        const cfg = STATUS_MAP[e.status] || { label: e.status, color: '#9ca3af' }
        const isReject = e.status === 'rejected'
        return (
          <div key={i} style={{ position: 'relative', marginBottom: 10, paddingLeft: 12 }}>
            <div style={{
              position: 'absolute', left: -21, top: 5,
              width: 8, height: 8, borderRadius: '50%',
              background: cfg.color,
              border: isReject ? '2px solid #ef4444' : 'none',
            }} />
            <div style={{ fontSize: 12, fontWeight: 500, color: '#1f2937' }}>
              <span style={{ color: isReject ? '#ef4444' : '#1f2937' }}>{cfg.label}</span>
              {e.round > 0 && <Tag style={{ marginLeft: 4, fontSize: 10, lineHeight: '14px', padding: '0 4px' }} color={cfg.color}>R{e.round}</Tag>}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
              {dayjs.utc(e.time).local().format('MM/DD HH:mm')}
              {e.actor_name && <span> · {e.actor_name}</span>}
            </div>
            {e.detail && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, lineHeight: 1.4 }}>{e.detail}</div>}
          </div>
        )
      })}
    </div>
  )
}

/** 审计 action → 颜色（用于时间线圆点） */
const ACTION_COLOR: Record<string, string> = { ai_review_start: '#3b82f6', ai_reject: '#ef4444', ai_to_review: '#f59e0b', ai_to_human_review: '#f59e0b', ai_to_final: '#8b5cf6', initial_approve: '#10b981', final_approve: '#10b981', reject: '#ef4444', approve: '#10b981' }

/** 从 auditLogs 渲染审计时间线 */
export function AuditTimeline({ entries, maxHeight }: { entries: AuditEntry[]; maxHeight?: number }) {
  if (entries.length === 0) return <div style={{ textAlign: 'center', padding: 16, color: '#9ca3af', fontSize: 12 }}>暂无记录</div>
  return (
    <div style={{ maxHeight: maxHeight || 'none', overflow: 'auto' }}>
      {entries.map((l, i) => {
        const actionLabel = ACTION_MAP[l.action] || l.action
        const dotColor = ACTION_COLOR[l.action] || '#9ca3af'
        const toCfg = l.to_status ? STATUS_MAP[l.to_status] : null
        return (
          <div key={i} style={{ padding: '4px 0 4px 20px', position: 'relative', borderBottom: i < entries.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
            <div style={{ position: 'absolute', left: 2, top: 9, width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ flexShrink: 0, color: '#9ca3af', fontFamily: 'monospace', fontSize: 10, width: 36 }}>{dayjs.utc(l.created_at).local().format('HH:mm')}</span>
              <span style={{ fontWeight: 500, fontSize: 11, color: '#1f2937' }}>{l.actor_role === 'ai_agent' ? 'AI' : l.actor_name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: dotColor }}>{actionLabel}</span>
              {l.from_status && l.to_status && <span style={{ fontSize: 10, color: '#9ca3af' }}>({STATUS_MAP[l.from_status]?.label || l.from_status}→{toCfg?.label || l.to_status})</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
