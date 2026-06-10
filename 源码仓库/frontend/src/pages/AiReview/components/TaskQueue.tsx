/**
 * TaskQueue.tsx — 左侧 AI 预审队列
 * Author: hongchuwudi
 * Description: 带状态筛选 Tab 的审核记录列表
 */
import { Tabs, Tag, Spin } from 'antd'
import { CheckCircleFilled, CloseCircleFilled, QuestionCircleFilled } from '@ant-design/icons'
import type { AiReviewItem } from '@/types/models/ai-review'
import { AI_VERDICT_CONFIG, AI_STATUS_CONFIG } from '@/types/models/ai-review'

/** 判定图标映射 */
const VERDICT_ICONS: Record<string, React.ReactNode> = {
  pass: <CheckCircleFilled />,
  reject: <CloseCircleFilled />,
  human_review: <QuestionCircleFilled />,
}

/** AI 预审队列列表组件（带状态筛选 Tab） */
export default function TaskQueue({ items, selectedId, activeTab, onTabChange, onSelect, counts, loading }: {
  items: AiReviewItem[]
  selectedId: number | undefined
  activeTab: string
  onTabChange: (k: string) => void
  onSelect: (item: AiReviewItem) => void
  counts: { done: number; pending: number; failed: number; pass: number; reject: number; human_review: number }
  loading: boolean
}) {
  return (
    <>
      <Tabs activeKey={activeTab} onChange={onTabChange} size="small" style={{ padding: '6px 12px 0' }}
        items={[
          { key: 'all', label: `全部 (${counts.done + counts.pending + counts.failed})` },
          { key: 'pending', label: `处理中 (${counts.pending})` },
          { key: 'pass', label: `通过 (${counts.pass})` },
          { key: 'reject', label: `驳回 (${counts.reject})` },
          { key: 'human_review', label: `转人工 (${counts.human_review})` },
          { key: 'failed', label: `失败 (${counts.failed})` },
        ]}
      />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>暂无记录</div>
        ) : (
          items.map((item) => {
            const vConfig = item.verdict ? AI_VERDICT_CONFIG[item.verdict as keyof typeof AI_VERDICT_CONFIG] : null
            const sConfig = AI_STATUS_CONFIG[item.status as keyof typeof AI_STATUS_CONFIG] ?? AI_STATUS_CONFIG.pending
            return (
              <div key={item.id}
                onClick={() => onSelect(item)}
                style={{
                  padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                  background: selectedId === item.id ? '#eef2ff' : 'transparent',
                  borderLeft: selectedId === item.id ? '3px solid #4f46e5' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (selectedId !== item.id) (e.target as HTMLElement).style.background = '#fafafa' }}
                onMouseLeave={(e) => { if (selectedId !== item.id) (e.target as HTMLElement).style.background = 'transparent' }}
              >
                {/* 标题行 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
                    {item.task_title || `任务 #${item.task_id}`}
                  </span>
                  {item.overall_score != null && (
                    <span style={{
                      fontSize: 15, fontWeight: 700,
                      color: item.overall_score >= 80 ? '#10b981' : item.overall_score >= 50 ? '#f59e0b' : '#ef4444',
                    }}>
                      {Math.round(item.overall_score)}
                    </span>
                  )}
                </div>
                {/* 信息行 */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: '#9ca3af' }}>
                  <span style={{ fontFamily: 'monospace' }}>#{item.id}</span>
                  <span>|</span>
                  <Tag color={sConfig.color} style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                    {sConfig.label}
                  </Tag>
                  {vConfig && (
                    <Tag color={vConfig.color} style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                      {item.verdict ? VERDICT_ICONS[item.verdict] : null} {vConfig.label}
                    </Tag>
                  )}
                  <span style={{ marginLeft: 'auto' }}>{item.agent_name}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
