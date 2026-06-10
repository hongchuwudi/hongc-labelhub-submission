/**
 * ResultSidebar.tsx — 标注结果侧栏
 * Author: hongchuwudi
 * Description: 标注结果列表，支持全选/多选和状态筛选
 */
import { Checkbox, Tag } from 'antd'
import { RobotOutlined, UserOutlined } from '@ant-design/icons'
import type { LabelResultItem } from '@/api/tasks'

const RESULT_STATUS_MAP: Record<string, { color: string; label: string }> = {
  submitted: { color: '#9ca3af', label: '待AI' },
  ai_reviewing: { color: '#3b82f6', label: 'AI初审' },
  final_review: { color: '#f59e0b', label: '待终审' },
  warehouse: { color: '#10b981', label: '入库' },
  rejected: { color: '#ef4444', label: '驳回' },
}

const REVIEWABLE = ['final_review']

/** 标注结果侧栏组件 */
export default function ResultSidebar({ results, selectedId, selectedIds, isReviewer, onSelect, onToggle, onToggleAll }: {
  results: LabelResultItem[]
  selectedId?: number
  selectedIds: Set<number>
  isReviewer: boolean
  onSelect: (r: LabelResultItem) => void
  onToggle: (id: number) => void
  onToggleAll: () => void
}) {
  const reviewableResults = results.filter((r) => REVIEWABLE.includes(r.status))
  const allChecked = reviewableResults.length > 0 && reviewableResults.every((r) => selectedIds.has(r.id))
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 14px 8px', borderBottom: '1px solid #f3f4f6', marginBottom: 4,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>标注结果 ({results.length})</span>
        {isReviewer && <Checkbox checked={allChecked} onChange={onToggleAll} style={{ fontSize: 11 }}>全选</Checkbox>}
      </div>
      {results.map((r) => {
        const s = RESULT_STATUS_MAP[r.status] || { color: '#9ca3af', label: r.status }
        const isActive = r.id === selectedId
        const isAi = r.labeler_type === 'ai'
        return (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px',
            background: isActive ? '#eef2ff' : 'transparent',
            borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
          }}>
            {isReviewer && <Checkbox checked={selectedIds.has(r.id)} disabled={!REVIEWABLE.includes(r.status)}
              onChange={() => onToggle(r.id)} style={{ flexShrink: 0 }} />}
            <button onClick={() => onSelect(r)} style={{
              display: 'flex', alignItems: 'center', gap: 8, flex: 1, padding: '2px 0',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'transparent', textAlign: 'left', minWidth: 0,
            }}>
              <Tag color={s.color} style={{ margin: 0, fontSize: 10, lineHeight: '18px', padding: '0 6px' }}>{s.label}</Tag>
              <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                {isAi ? <RobotOutlined /> : <UserOutlined />} #{r.item_id}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
