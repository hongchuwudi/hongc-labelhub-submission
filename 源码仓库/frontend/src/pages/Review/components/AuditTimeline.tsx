/**
 * AuditTimeline.tsx — 操作审计时间线
 * Author: hongchuwudi
 * Description: 按时间倒序展示提交/通过/驳回等操作记录
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
import { Tag } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import type { AuditLogEntry } from '@/api/tasks'

/** 操作类型到颜色/标签的映射 */
export const ACTION_MAP: Record<string, { color: string; label: string }> = {
  submit: { color: '#3b82f6', label: '提交' },
  approve: { color: '#10b981', label: '通过' },
  reject: { color: '#ef4444', label: '驳回' },
}

/** 操作审计时间线组件 */
export default function AuditTimeline({ logs }: { logs: AuditLogEntry[] }) {
  if (logs.length === 0) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>
      <HistoryOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />暂无操作记录
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {logs.map((log, i) => {
        const a = ACTION_MAP[log.action] || { color: '#9ca3af', label: log.action }
        return (
          <div key={log.id} style={{
            display: 'flex', gap: 10, padding: '10px 0',
            borderBottom: i < logs.length - 1 ? '1px solid #f3f4f6' : 'none',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, marginTop: 4, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{log.actor_name}</span>
                <Tag color={a.color} style={{ margin: 0, fontSize: 10, lineHeight: '18px', padding: '0 6px' }}>{a.label}</Tag>
                <span style={{ fontSize: 10, color: '#9ca3af' }}>{log.entity_type}#{log.entity_id}</span>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{log.from_status} → {log.to_status}</div>
              {log.detail && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, fontStyle: 'italic' }}>{log.detail}</div>}
              <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 2 }}>{dayjs.utc(log.created_at).local().format('MM/DD HH:mm:ss')}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
