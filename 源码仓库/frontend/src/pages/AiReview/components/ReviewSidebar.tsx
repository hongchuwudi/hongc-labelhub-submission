/**
 * ReviewSidebar.tsx — 左侧任务队列 + 统计面板
 * Author: hongchuwudi
 * Description: 标签页筛选 + 性能指标 + 任务卡片列表
 */
import { Tabs, Tag, Spin, Tooltip } from 'antd'
import { ClockCircleOutlined, ThunderboltOutlined, SyncOutlined } from '@ant-design/icons'
import type { AiReviewItem } from '@/types/models/ai-review'

const VERDICT_LABEL: Record<string, string> = { pass: '已通过', reject: '建议打回', human_review: '转人工' }
const VERDICT_COLOR: Record<string, string> = { pass: '#10b981', reject: '#ef4444', human_review: '#f59e0b' }
const STATUS_LABEL: Record<string, string> = { pending: '排队中', processing: '审核中', done: '已完成', failed: '失败' }
const STATUS_COLOR: Record<string, string> = { pending: '#d1d5db', processing: '#3b82f6', done: '#10b981', failed: '#ef4444' }

/** AI 预审任务侧栏组件 */
export default function ReviewSidebar({ items, selectedId, activeTab, onTabChange, onSelect, counts, loading, total, avgDuration, retryRate, executingTask }: {
  items: AiReviewItem[]
  selectedId?: number
  activeTab: string
  onTabChange: (k: string) => void
  onSelect: (item: AiReviewItem) => void
  counts: { done: number; pending: number; failed: number; pass: number; reject: number; human_review: number }
  loading: boolean
  total: number
  avgDuration: number
  retryRate: number
  executingTask: string
}) {
  return (
    <div style={{
      width: 300, flexShrink: 0, borderRight: '1px solid #e8e8e8',
      background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* 标题 */}
      <div style={{ padding: '14px 16px 0', fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>
        AI 自动预审队列
      </div>

      {/* 标签筛选 */}
      <Tabs activeKey={activeTab} onChange={onTabChange} size="small"
        style={{ padding: '0 16px' }}
        tabBarStyle={{ marginBottom: 0 }}
        items={[
          { key: 'pending', label: `待审核 (${counts.pending})` },
          { key: 'pass', label: `已通过 (${counts.pass})` },
          { key: 'reject', label: `已打回 (${counts.reject})` },
          { key: 'human_review', label: `转人工 (${counts.human_review})` },
          { key: 'failed', label: `失败 (${counts.failed})` },
        ]}
      />

      {/* 性能指标 */}
      <div style={{
        margin: '0 16px 8px', padding: '10px 12px',
        background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0',
        display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 12, color: '#6b7280',
      }}>
        <Tooltip title="总任务量"><span><ThunderboltOutlined /> {total} 个任务</span></Tooltip>
        <Tooltip title="平均审核耗时"><span><ClockCircleOutlined /> {avgDuration > 0 ? `${(avgDuration / 1000).toFixed(1)}s` : '-'}</span></Tooltip>
        <Tooltip title="重试率"><span><SyncOutlined /> {retryRate}%</span></Tooltip>
        <Tooltip title="当前执行中"><span style={{ color: '#3b82f6' }}>执行 {executingTask}</span></Tooltip>
      </div>

      {/* 任务卡片列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>暂无数据</div>
        ) : (
          items.map((item) => {
            const vColor = item.verdict ? VERDICT_COLOR[item.verdict] : undefined
            const vLabel = item.verdict ? VERDICT_LABEL[item.verdict] : undefined
            const sLabel = STATUS_LABEL[item.status] || item.status
            const sColor = STATUS_COLOR[item.status] || '#d1d5db'

            return (
              <div key={item.id}
                onClick={() => onSelect(item)}
                style={{
                  marginBottom: 6, padding: '10px 12px', cursor: 'pointer',
                  borderRadius: 8, border: selectedId === item.id ? '2px solid #4f46e5' : '1px solid #f0f0f0',
                  background: selectedId === item.id ? '#eef2ff' : '#fff',
                  transition: 'all 0.15s',
                }}
              >
                {/* 标题行 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>
                    SUB-{String(item.task_id).padStart(4, '0')}-{String(item.id).padStart(5, '0')}
                  </span>
                  {item.overall_score != null && (
                    <span style={{
                      fontSize: 16, fontWeight: 800,
                      color: item.overall_score >= 80 ? '#10b981' : item.overall_score >= 50 ? '#f59e0b' : '#ef4444',
                    }}>
                      {Math.round(item.overall_score)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e', marginBottom: 5, lineHeight: 1.4 }}>
                  {item.task_title || `任务 #${item.task_id}`}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Tag color={item.status === 'processing' ? 'processing' : sColor}
                    style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>{sLabel}</Tag>
                  {vColor && (
                    <Tag color={vColor} style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>{vLabel}</Tag>
                  )}
                  <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto' }}>
                    {item.agent_name}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
