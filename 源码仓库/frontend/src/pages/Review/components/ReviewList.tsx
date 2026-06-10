/**
 * ReviewList.tsx — 审核任务列表
 * Author: hongchuwudi
 * Description: 展示所有待审核/已审核任务，含统计卡片和状态筛选
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, message, Empty, Tabs, Statistic, Card, Row, Col } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { listTasksApi, listResultsApi, type TaskListItem } from '@/api/tasks'

/** 审核任务列表组件 */
export default function ReviewList() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filterTab, setFilterTab] = useState<string>('all')

  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => { const h = () => setMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const [pubRes, endedRes] = await Promise.all([
        listTasksApi({ status: 'published', page_size: 100 }),
        listTasksApi({ status: 'ended', page_size: 100 }),
      ])
      setTasks([...pubRes.data.items, ...endedRes.data.items])
    } catch { message.error('加载失败') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const [reviewCounts, setReviewCounts] = useState<Record<number, { pending: number; final: number; warehouse: number; rejected: number }>>({})
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const counts: typeof reviewCounts = {}
      for (const t of tasks.slice(0, 10)) {
        try {
          const res = await listResultsApi(t.id)
          const items = res.data || []
          counts[t.id] = {
            pending: items.filter((r) => r.status === 'submitted' || r.status === 'ai_reviewing').length,
            final: items.filter((r) => r.status === 'final_review').length,
            warehouse: items.filter((r) => r.status === 'warehouse').length,
            rejected: items.filter((r) => r.status === 'rejected').length,
          }
        } catch { /* ignore */ }
      }
      if (!cancelled) setReviewCounts(counts)
    })()
    return () => { cancelled = true }
  }, [tasks])

  const filtered = filterTab === 'all' ? tasks : tasks.filter((t) => { const c = reviewCounts[t.id]; if (!c) return false; if (filterTab === 'pending') return c.pending > 0; if (filterTab === 'final') return c.final > 0; if (filterTab === 'warehouse') return c.warehouse > 0; if (filterTab === 'rejected') return c.rejected > 0; return true })
  const totalPending = Object.values(reviewCounts).reduce((s, c) => s + c.pending, 0)
  const totalFinal = Object.values(reviewCounts).reduce((s, c) => s + c.final, 0)
  const totalWarehouse = Object.values(reviewCounts).reduce((s, c) => s + c.warehouse, 0)
  const totalRejected = Object.values(reviewCounts).reduce((s, c) => s + c.rejected, 0)

  const cols = [
    { title: '任务名称', dataIndex: 'title', ellipsis: true, width: mobile ? undefined : '40%',
      render: (t: string, r: TaskListItem) => <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(`/review/${r.id}`)}>{t}</Button>,
    },
    ...(mobile ? [
      { title: '待AI审', dataIndex: 'id', width: 60, render: (_: unknown, r: TaskListItem) => { const c = reviewCounts[r.id]; return <span style={{ color: c?.pending ? '#3b82f6' : '#9ca3af', fontWeight: 600 }}>{c?.pending ?? '-'}</span> } },
    ] : [
      { title: 'ID', dataIndex: 'id', width: '8%', render: (id: number) => <span style={{ fontSize: 12, color: '#9ca3af' }}>#{id}</span> },
      { title: '待AI审', dataIndex: 'id', width: '8%', render: (_: unknown, r: TaskListItem) => { const c = reviewCounts[r.id]; return c ? <span style={{ color: c.pending > 0 ? '#3b82f6' : '#9ca3af', fontWeight: c.pending > 0 ? 600 : 400 }}>{c.pending}</span> : <span style={{ color: '#d1d5db' }}>-</span> } },
      { title: '终审', dataIndex: 'id', width: '8%', render: (_: unknown, r: TaskListItem) => { const c = reviewCounts[r.id]; return <span style={{ color: '#8b5cf6' }}>{c?.final ?? '-'}</span> } },
      { title: '入库', dataIndex: 'id', width: '8%', render: (_: unknown, r: TaskListItem) => { const c = reviewCounts[r.id]; return <span style={{ color: '#10b981' }}>{c?.warehouse ?? '-'}</span> } },
      { title: '驳回', dataIndex: 'id', width: '8%', render: (_: unknown, r: TaskListItem) => { const c = reviewCounts[r.id]; return <span style={{ color: '#ef4444' }}>{c?.rejected ?? '-'}</span> } },
    ]),
    { title: '操作', key: 'action', width: mobile ? 50 : '12%', render: (_: unknown, r: TaskListItem) => <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/review/${r.id}`)}>{mobile ? '' : '审核'}</Button> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mobile ? 12 : 20, flexWrap: 'wrap', gap: 8 }}>
      </div>

      <Row gutter={mobile ? 8 : 12} style={{ marginBottom: mobile ? 12 : 16 }}>
        <Col span={mobile ? 12 : 6}>
          <Card size="small" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
            <Statistic title="待AI审" value={totalPending} valueStyle={{ color: '#3b82f6', fontSize: mobile ? 18 : 20 }} />
          </Card>
        </Col>
        <Col span={mobile ? 12 : 6}>
          <Card size="small" style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }}>
            <Statistic title="终审" value={totalFinal} valueStyle={{ color: '#8b5cf6', fontSize: mobile ? 18 : 20 }} />
          </Card>
        </Col>
        {!mobile && <Col span={6}><Card size="small" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}><Statistic title="入库" value={totalWarehouse} valueStyle={{ color: '#10b981', fontSize: 20 }} /></Card></Col>}
        {!mobile && <Col span={6}><Card size="small" style={{ background: '#fef2f2', borderColor: '#fecaca' }}><Statistic title="驳回" value={totalRejected} valueStyle={{ color: '#ef4444', fontSize: 20 }} /></Card></Col>}
      </Row>

      <Tabs activeKey={filterTab} onChange={setFilterTab} size="small" style={{ marginBottom: 8 }}
        items={[
          { key: 'all', label: '全部' },
          { key: 'pending', label: `待AI审 (${totalPending})` },
          { key: 'final', label: `终审 (${totalFinal})` },
          { key: 'warehouse', label: `入库 (${totalWarehouse})` },
          { key: 'rejected', label: `驳回 (${totalRejected})` },
        ]}
      />

      <Table dataSource={filtered} columns={cols} rowKey="id" loading={loading}
        size={mobile ? 'small' : 'middle'}
        pagination={mobile ? { pageSize: 10, size: 'small' } : { pageSize: 20 }}
        locale={{ emptyText: <Empty description="暂无待审核任务" /> }}
      />
    </div>
  )
}
