/**
 * ProcessLogs.tsx — 处理日志控制台
 * Author: hongchuwudi
 * Description: 按时间线展示 AI 审核处理链路——入队/调模型/裁决
 */
import dayjs from 'dayjs'
import type { AiReviewDetail } from '@/types/models/ai-review'

const STEPS = {
  queued: { color: '#6b7280', label: '进入队列' },
  calling: { color: '#3b82f6', label: '调用模型' },
  done: { color: '#10b981', label: '完成' },
  failed: { color: '#ef4444', label: '失败' },
} as const

function formatTime(iso: string | null): string {
  if (!iso) return '-'
  return dayjs.utc(iso).local().format('HH:mm:ss.SSS')
}

/** 处理日志控制台组件 */
export default function ProcessLogs({ detail }: { detail: AiReviewDetail }) {
  const lines: { time: string; text: string; color: string }[] = []

  // 入队
  lines.push({
    time: formatTime(detail.created_at),
    text: `[MQ] 任务进入 BullMQ 队列 (task=${detail.task_id} result=${detail.result_id})`,
    color: STEPS.queued.color,
  })

  // 调用模型
  if (detail.status !== 'pending') {
    const durStr = detail.duration_ms != null ? `耗时 ${detail.duration_ms}ms` : ''
    lines.push({
      time: formatTime(detail.finished_at || detail.created_at),
      text: `[LLM] 调用 ${detail.model || '-'} 模型 ${durStr}`,
      color: STEPS.calling.color,
    })
  }

  // 结果
  if (detail.status === 'done') {
    const vLabel: Record<string, string> = { pass: '通过', reject: '打回', human_review: '转人工' }
    const vl = detail.verdict ? vLabel[detail.verdict] || detail.verdict : '?'
    lines.push({
      time: formatTime(detail.finished_at),
      text: `[Done] verdict: 结构化输出: ${vl} (${detail.overall_score != null ? Math.round(detail.overall_score) : '-'})`,
      color: STEPS.done.color,
    })
  } else if (detail.status === 'failed') {
    lines.push({
      time: formatTime(detail.finished_at),
      text: `[Error] ${detail.error_message || '未知错误'}`,
      color: STEPS.failed.color,
    })
  }

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e8', padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        处理日志
      </div>
      <div style={{
        maxHeight: 260, overflow: 'auto', padding: '8px 12px', borderRadius: 6,
        background: '#1e293b', fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, lineHeight: 1.8, color: '#e2e8f0',
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, color: line.color }}>
            <span style={{ flexShrink: 0, opacity: 0.6 }}>{line.time}</span>
            <span>{line.text}</span>
          </div>
        ))}
        {lines.length === 0 && <span style={{ color: '#6b7280' }}>无日志记录</span>}
      </div>
    </div>
  )
}
