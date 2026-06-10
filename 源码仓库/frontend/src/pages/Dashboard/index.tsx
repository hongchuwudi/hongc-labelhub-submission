/**
 * Dashboard/index.tsx — 数据看板
 * Author: hongchuwudi
 * Description: Owner 全局总览 + 按任务进度明细 + ECharts 图表
 */
import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Progress, Spin, Tag } from 'antd'
import { ThunderboltOutlined, RobotOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { getDashboardStatsApi, getTasksProgressApi, getDatasetsStatsApi, type DashboardStats, type TaskProgress, type DatasetsStats } from '@/api/dashboard'

/** 数据看板组件 */
export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tasks, setTasks] = useState<TaskProgress[]>([])
  const [dsStats, setDsStats] = useState<DatasetsStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStatsApi(), getTasksProgressApi(), getDatasetsStatsApi()])
      .then(([s, t, d]) => { setStats(s.data); setTasks(t.data || []); setDsStats(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}><Spin size="large" /></div>
  if (!stats) return <div style={{ padding: 80, textAlign: 'center', color: '#9ca3af' }}>加载失败</div>

  const barOption = {
    tooltip: { trigger: 'axis' },
    grid: { top: 10, bottom: 0, left: 40, right: 20 },
    xAxis: { type: 'category', data: tasks.map(t => t.title.length > 10 ? t.title.slice(0, 10) + '...' : t.title), axisLabel: { rotate: 30, fontSize: 10 } },
    yAxis: { type: 'value', max: 100 },
    series: [{
      type: 'bar', name: '标注进度%', barWidth: '60%',
      data: tasks.map(t => ({ value: t.progress, itemStyle: { color: t.progress >= 100 ? '#10b981' : '#3b82f6' } })),
    }],
  }

  const statusMap: Record<string, string> = { draft: '#d1d5db', published: '#3b82f6', ended: '#10b981' }
  const columns = [
    { title: '任务', dataIndex: 'title', ellipsis: true, width: 200,
      render: (t: string, r: TaskProgress) => <span style={{ fontSize: 13 }}>{t} <Tag color={statusMap[r.status] || '#d1d5db'}>{r.status}</Tag></span> },
    { title: '标注进度', dataIndex: 'progress', width: 150,
      render: (p: number) => <Progress percent={p} size="small" status={p >= 100 ? 'success' : 'active'} /> },
    { title: '已入库', dataIndex: 'warehouse', width: 80,
      render: (v: number) => <span style={{ color: '#10b981', fontWeight: 600 }}>{v}</span> },
    { title: '驳回', dataIndex: 'rejected', width: 80,
      render: (v: number) => <span style={{ color: '#ef4444', fontWeight: 600 }}>{v}</span> },
    { title: 'AI已完成', dataIndex: 'ai_done', width: 100,
      render: (v: number, r: TaskProgress) => <span>{v}/{r.ai_total}</span> },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>数据看板</h2>
      <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 12 }}>以下为系统全局统计数据，非个人数据</p>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={4}><Card><Statistic title="任务总数" value={stats.total_tasks} prefix={<ThunderboltOutlined />} /></Card></Col>
        <Col span={4}><Card><Statistic title="标注率" value={`${stats.label_rate}%`} valueStyle={{ color: '#3b82f6' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="入库" value={stats.approved} valueStyle={{ color: '#10b981' }} prefix={<CheckCircleOutlined />} /></Card></Col>
        <Col span={4}><Card><Statistic title="通过率" value={`${stats.pass_rate}%`} valueStyle={{ color: '#10b981' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="驳回" value={stats.rejected} valueStyle={{ color: '#ef4444' }} prefix={<CloseCircleOutlined />} /></Card></Col>
        <Col span={4}><Card><Statistic title="AI 审核" value={stats.ai_done} prefix={<RobotOutlined />} suffix={`/ ${stats.ai_total}`} /></Card></Col>
      </Row>

      {dsStats && (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="全局数据集总数" value={dsStats.total_datasets} prefix={<ThunderboltOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="全局数据条目总数" value={dsStats.total_items} valueStyle={{ color: '#3b82f6' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="已关联任务" value={dsStats.used_datasets} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="未使用" value={dsStats.total_datasets - dsStats.used_datasets} valueStyle={{ color: '#9ca3af' }} /></Card></Col>
      </Row>
      )}

      <Card title="任务进度明细" style={{ marginBottom: 16 }}>
        <Table dataSource={tasks} columns={columns} rowKey="id" size="small" pagination={false} />
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="各任务标注进度">
            <ReactECharts option={barOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="审核结果分布">
            <ReactECharts option={{
              tooltip: { trigger: 'item' },
              series: [{
                type: 'pie', radius: ['50%', '70%'], center: ['50%', '55%'],
                label: { fontSize: 11 },
                data: [
                  { value: stats.approved, name: '已入库', itemStyle: { color: '#10b981' } },
                  { value: stats.rejected, name: '已驳回', itemStyle: { color: '#ef4444' } },
                ],
              }],
            }} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
