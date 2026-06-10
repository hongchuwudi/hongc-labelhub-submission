/**
 * ExportHistory/index.tsx — 导出中心
 * Author: hongchuwudi
 * Description: 全局导出记录列表，支持按任务批量拉取和下载
 */
import { useState, useEffect } from 'react'
import { Table, Button, Tag, App, Empty } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import { listTasksApi, listExportsApi, type ExportJob } from '@/api/tasks'
import apiClient from '@/api/client'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

/** 导出中心组件 */
export default function ExportHistory() {
  const { message } = App.useApp()
  const [exports, setExports] = useState<(ExportJob & { taskTitle?: string })[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const tasksRes = await listTasksApi({ page_size: 100 })
      const tasks = tasksRes.data.items
      const taskMap = new Map(tasks.map((t) => [t.id, t.title]))
      // 并行批量拉取，每批 10 个避免压力过大
      const allJobs: (ExportJob & { taskTitle?: string })[] = []
      const batchSize = 10
      for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize)
        const results = await Promise.allSettled(batch.map((t) => listExportsApi(t.id).catch(() => ({ data: [] as ExportJob[] }))))
        for (let j = 0; j < batch.length; j++) {
          const r = results[j]!
          if (r.status === 'fulfilled') {
            for (const job of r.value.data) {
              allJobs.push({ ...job, taskTitle: taskMap.get(batch[j]!.id) })
            }
          }
        }
      }
      allJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setExports(allJobs)
    } catch { message.error('加载导出记录失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>导出中心</h2>
        <Button icon={<ReloadOutlined />} onClick={fetchAll} loading={loading}>刷新</Button>
      </div>

      <Table
        dataSource={exports}
        loading={loading}
        rowKey="id"
        size="middle"
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: <Empty description="暂无导出记录" /> }}
        columns={[
          { title: '任务', dataIndex: 'taskTitle', ellipsis: true },
          { title: '格式', dataIndex: 'format', width: 80, render: (f: string) => <Tag>{f.toUpperCase()}</Tag> },
          { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => {
            const m: Record<string, { color: string; label: string }> = {
              pending: { color: 'default', label: '等待' }, processing: { color: 'blue', label: '处理中' },
              done: { color: 'green', label: '已完成' }, failed: { color: 'red', label: '失败' },
            }
            const c = m[s] || { color: 'default', label: s }
            return <Tag color={c.color}>{c.label}</Tag>
          }},
          { title: '条数', dataIndex: 'item_count', width: 60 },
          { title: '时间', dataIndex: 'created_at', width: 160, render: (t: string) => dayjs.utc(t).local().format('MM/DD HH:mm') },
          { title: '错误', dataIndex: 'error_message', ellipsis: true, width: 140, render: (e: string) => e ? <span style={{ color: '#ef4444', fontSize: 12 }}>{e}</span> : '-' },
          { title: '', key: 'dl', width: 50, render: (_: unknown, r: ExportJob & { taskTitle?: string }) => r.status === 'done'
            ? <Button type="link" size="small" icon={<DownloadOutlined />} onClick={async () => {
              try {
                const res = await apiClient.get(`/tasks/exports/${r.id}/download`) as unknown as { data: { url: string } }
                const a = document.createElement('a')
                a.href = res.data.url
                a.target = '_blank'
                a.click()
              } catch { /* ignore */ }
            }} /> : null },
        ]}
      />
    </div>
  )
}
