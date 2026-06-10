/**
 * AuditTimeline.tsx — 处理日志时间线
 * Author: hongchuwudi
 * Description: AI 审核处理过程的按时间倒序日志流
 */
import dayjs from 'dayjs'
import { InboxOutlined, RobotOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import type { AiReviewDetail } from '@/types/models/ai-review'

function formatTime(iso: string | null): string {
  if (!iso) return '-'
  return dayjs(iso).format('HH:mm:ss')
}

/** 处理步骤图标 */
function StepIcon({ status }: { status: string }) {
  const base: React.CSSProperties = { fontSize: 16 }
  switch (status) {
    case 'queued': return <InboxOutlined style={{ ...base, color: '#6b7280' }} />
    case 'calling': return <RobotOutlined style={{ ...base, color: '#3b82f6' }} />
    case 'done': return <CheckCircleOutlined style={{ ...base, color: '#10b981' }} />
    case 'failed': return <CloseCircleOutlined style={{ ...base, color: '#ef4444' }} />
    case 'processing': return <LoadingOutlined style={{ ...base, color: '#3b82f6' }} />
    default: return <InboxOutlined style={{ ...base, color: '#d1d5db' }} />
  }
}

/** 处理日志时间线组件 */
export default function AuditTimeline({ detail }: { detail: AiReviewDetail }) {
  const steps: { time: string; status: string; title: string; detail: string }[] = []

  steps.push({
    time: formatTime(detail.created_at),
    status: 'queued',
    title: '进入审核队列',
    detail: `任务 #${detail.task_id} 结果 #${detail.result_id} 已提交，Agent "${detail.agent_name}" 等待处理`,
  })

  if (detail.status !== 'pending') {
    steps.push({
      time: formatTime(detail.created_at),
      status: 'calling',
      title: '调用 LLM 模型',
      detail: `模型: ${detail.model || '-'} | 耗时: ${detail.duration_ms != null ? `${detail.duration_ms}ms` : '-'}`,
    })
  }

  if (detail.status === 'done' && detail.verdict) {
    const verdictLabel = detail.verdict === 'pass' ? '通过' : detail.verdict === 'reject' ? '驳回' : '转人工审核'
    steps.push({
      time: formatTime(detail.finished_at),
      status: 'done',
      title: `审核完成: ${verdictLabel}`,
      detail: `综合评分 ${detail.overall_score != null ? Math.round(detail.overall_score) : '-'} | ${detail.dimensions?.length || 0} 个维度已评分`,
    })
  } else if (detail.status === 'failed') {
    steps.push({
      time: formatTime(detail.finished_at),
      status: 'failed',
      title: '审核失败',
      detail: detail.error_message || '未知错误',
    })
  } else if (detail.status === 'processing') {
    steps.push({
      time: '-',
      status: 'processing',
      title: '审核进行中...',
      detail: '等待 LLM 返回结果',
    })
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
        处理日志
      </div>
      <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, padding: '10px 0',
            borderBottom: i < steps.length - 1 ? '1px solid #f0f0f0' : 'none',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff', border: '1px solid #e5e7eb',
            }}>
              <StepIcon status={step.status} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{step.title}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{step.time}</span>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{step.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
