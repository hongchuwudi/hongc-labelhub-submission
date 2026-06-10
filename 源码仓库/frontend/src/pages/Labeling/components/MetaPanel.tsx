import { Progress, Tag } from 'antd'
import type { LabelerStats, LabelResultItem, AuditLogEntry, TaskItemResponse, FlowEntry } from '@/api/tasks'
import { FlowTimeline } from '@/components/StatusFlow'

/** 右侧面板：统计 + 本题历史 */
export function MetaPanel({ stats, currentItem }: {
  stats: LabelerStats | null
  results: LabelResultItem[]
  auditLogs: AuditLogEntry[]
  currentItem?: TaskItemResponse | null
}) {
  const flowHistory: FlowEntry[] = currentItem?.flow_history || []
  const currentItemId = currentItem?.id

  return (
    <div style={{ padding: '14px 0' }}>
      <div style={{ padding: '0 14px 14px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>我的进度</div>
        {stats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#9ca3af' }}>{stats.pending}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>待标注</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{stats.in_review}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>审核中</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{stats.rejected}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>需修改</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{stats.done}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>已归档</div>
              </div>
            </div>
            <Progress percent={stats.total > 0 ? Math.round(((stats.total - stats.pending) / stats.total) * 100) : 0} size="small" status="active" style={{ marginBottom: 0 }} />
          </div>
        ) : <div style={{ fontSize: 12, color: '#9ca3af' }}>暂无数据</div>}
      </div>

      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>
          本题历史{currentItemId ? ` · #${currentItemId}` : ''}
          {flowHistory.length > 0 && <Tag color="blue" style={{ marginLeft: 6, fontSize: 10 }}>{flowHistory.length} 步</Tag>}
        </div>
        <FlowTimeline entries={flowHistory} />
      </div>
    </div>
  )
}
