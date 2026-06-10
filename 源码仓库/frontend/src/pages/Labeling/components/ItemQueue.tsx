/** ItemQueue.tsx — 标注条目队列组件
 * Author: hongchuwudi
 * Description: 左侧条目队列，展示所有任务条目的状态标签和摘要
 */
import { Tag } from 'antd'
import type { TaskItemResponse } from '@/api/tasks'

/** TaskItem 基础状态 */
const ITEM_STATUS: Record<string, { color: string; label: string }> = {
  pending: { color: '#9ca3af', label: '待标注' },
  labeled: { color: '#10b981', label: '已提交' },
  skipped: { color: '#f59e0b', label: '已跳过' },
}

/** LabelResult 审核状态 */
const RESULT_STATUS: Record<string, { color: string; label: string }> = {
  submitted: { color: '#3b82f6', label: '已提交' },
  ai_reviewing: { color: '#3b82f6', label: 'AI 初审' },
  review: { color: '#f59e0b', label: '复审中' },
  final_review: { color: '#8b5cf6', label: '终审中' },
  warehouse: { color: '#10b981', label: '已入库' },
  rejected: { color: '#ef4444', label: '需修改' },
}

function getDisplay(item: TaskItemResponse): { color: string; label: string; round?: number } {
  const rs = item.last_result
  if (rs) {
    const cfg = RESULT_STATUS[rs.status] || { color: '#9ca3af', label: rs.status }
    return { color: cfg.color, label: cfg.label, round: rs.round > 1 ? rs.round : undefined }
  }
  const cfg = ITEM_STATUS[item.status] || { color: '#9ca3af', label: item.status }
  return cfg
}

/** 左侧条目队列 */
export function ItemQueue({ items, currentIdx, onSelect }: {
  items: TaskItemResponse[]
  currentIdx: number
  onSelect: (idx: number) => void
}) {
  return (
    <div style={{ padding: '14px 0' }}>
      <div style={{
        padding: '0 14px 10px',
        fontSize: 13,
        fontWeight: 600,
        color: '#6b7280',
        borderBottom: '1px solid #f3f4f6',
        marginBottom: 4,
      }}>
        任务条目 ({items.length})
      </div>
      {items.map((item, idx) => {
        const d = getDisplay(item)
        const isActive = idx === currentIdx
        return (
          <button
            key={item.id}
            onClick={() => onSelect(idx)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '8px 14px',
              border: 'none',
              background: isActive ? '#eef2ff' : 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
              transition: 'background 120ms ease',
            }}
          >
            <span style={{ fontSize: 12, color: '#9ca3af', width: 24, textAlign: 'center', flexShrink: 0 }}>
              {item.index + 1}
            </span>
            <Tag
              color={d.color}
              style={{ margin: 0, fontSize: 10, lineHeight: '18px', padding: '0 6px', flexShrink: 0 }}
            >
              {d.label}{d.round ? ` R${d.round}` : ''}
            </Tag>
            <span style={{
              flex: 1, fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {Object.values(item.data)[0] as string || '-'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
