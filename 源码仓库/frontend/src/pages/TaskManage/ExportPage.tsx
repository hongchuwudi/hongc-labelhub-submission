/**
 * ExportPage.tsx — 任务数据导出页
 * Author: hongchuwudi
 * Description: 导出格式选择、字段映射、重命名、历史记录轮询
 */
import { useState, useEffect, useRef } from 'react'
import { Button, Tag, Switch, App, Empty, Space, Table, Spin, Input } from 'antd'
import { ExportOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import { getTaskApi, listExportsApi, createExportApi, type TaskListItem, type ExportJob } from '@/api/tasks'
import apiClient from '@/api/client'
import { getSchemaApi } from '@/api/schemas'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

/** 任务数据导出组件 */
export default function ExportPage({ taskId }: { taskId: number }) {
  const { message } = App.useApp()
  const [task, setTask] = useState<TaskListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [format, setFormat] = useState<string>('json')
  const [exporting, setExporting] = useState(false)
  const [history, setHistory] = useState<ExportJob[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [fields, setFields] = useState<string[]>([])
  const [allFieldNames, setAllFieldNames] = useState<{ key: string; title: string }[]>([])
  const [includeReview, setIncludeReview] = useState(true)
  const [renameMap, setRenameMap] = useState<Record<string, string>>({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 组件卸载时清理轮询定时器
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  useEffect(() => {
    setLoading(true)
    getTaskApi(taskId).then((res) => {
      setTask(res.data)
      setLoading(false)
      return res.data
    }).then((t) => {
      fetchHistory()
      getSchemaApi(t.schema_id).then((res) => {
        const s = res?.data?.schema
        if (!s) return
        const fs = Array.isArray(s.fields) ? s.fields : []
        let names = fs.map((f: { key: string; title?: string }) => ({ key: f.key, title: f.title || f.key }))
        const sRecord = s as unknown as Record<string, unknown>
        if (names.length === 0 && sRecord.properties) {
          names = Object.entries(sRecord.properties as Record<string, { title?: string }>).map(([k, p]) => ({ key: k, title: p.title || k }))
        }
        setAllFieldNames(names)
        setFields(names.map((n) => n.key))
      }).catch(() => {})
    }).catch(() => setLoading(false))
  }, [])

  const fetchHistory = async () => {
    if (!taskId) return
    setHistoryLoading(true)
    try { const res = await listExportsApi(taskId); setHistory(res.data) }
    catch { /* ignore */ }
    finally { setHistoryLoading(false) }
  }

  const handleExport = async () => {
    if (!taskId) return
    setExporting(true)
    try {
      const mapping: Record<string, unknown> = { include_review: includeReview }
      if (fields.length > 0 && fields.length < allFieldNames.length) mapping.fields = fields
      const renames = Object.fromEntries(Object.entries(renameMap).filter(([, v]) => v))
      if (Object.keys(renames).length > 0) mapping.rename = renames
      const res = await createExportApi(taskId, format, mapping)
      message.success(res.message || '导出任务已创建')
      await fetchHistory()
      const jobId = res.data.id
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const hRes = await listExportsApi(taskId)
          setHistory(hRes.data)
          const job = hRes.data.find((j) => j.id === jobId)
          if (job && (job.status === 'done' || job.status === 'failed')) {
            clearInterval(pollRef.current!)
            pollRef.current = null
            if (job.status === 'done') message.success('导出完成')
            else message.error(job.error_message || '导出失败')
          }
        } catch { clearInterval(pollRef.current!); pollRef.current = null }
      }, 2000)
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '导出失败') }
    finally { setExporting(false) }
  }

  const downloadExport = async (jobId: number) => {
    try {
      const res = await apiClient.get(`/tasks/exports/${jobId}/download`) as unknown as { data: { url: string } }
      const a = document.createElement('a')
      a.href = res.data.url
      a.target = '_blank'
      a.click()
    } catch { /* ignore */ }
  }

  const historyColumns = [
    { title: '格式', dataIndex: 'format', width: 70, render: (f: string) => <Tag>{f.toUpperCase()}</Tag> },
    { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => {
      const map: Record<string, { color: string; label: string }> = {
        pending: { color: 'default', label: '等待中' }, processing: { color: 'blue', label: '处理中' },
        done: { color: 'green', label: '已完成' }, failed: { color: 'red', label: '失败' },
      }
      const c = map[s] || { color: 'default', label: s }
      return <Tag color={c.color}>{c.label}</Tag>
    }},
    { title: '条数', dataIndex: 'item_count', width: 60, render: (n: number | null) => n ?? '-' },
    { title: '时间', dataIndex: 'created_at', render: (t: string) => dayjs.utc(t).local().format('MM/DD HH:mm') },
    { title: '', key: 'dl', width: 50, render: (_: unknown, r: ExportJob) => r.status === 'done'
      ? <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => downloadExport(r.id)} /> : null },
  ]

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
  if (!task) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>任务不存在</div>

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{task.title}</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          数据导出 · {task.completed_items} / {task.quota} 条已完成
        </div>
      </div>

      {/* 格式选择 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 500, marginBottom: 10, fontSize: 14 }}>导出格式</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(['json', 'jsonl', 'csv', 'xlsx'] as const).map((fmt) => (
            <div key={fmt} onClick={() => setFormat(fmt)} style={{
              padding: '12px 28px', borderRadius: 8, cursor: 'pointer', border: '2px solid',
              borderColor: format === fmt ? '#3b82f6' : '#e5e7eb',
              background: format === fmt ? '#eff6ff' : '#fff',
              fontWeight: format === fmt ? 600 : 400, fontSize: 15, transition: 'all 0.2s',
            }}>{fmt.toUpperCase()}</div>
          ))}
        </div>
      </div>

      {/* 字段映射 */}
      {allFieldNames.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 500, marginBottom: 10, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span>导出字段</span>
            <Space size="small">
              <Button size="small" type="link" onClick={() => setFields(allFieldNames.map((f) => f.key))}>全选</Button>
              <Button size="small" type="link" onClick={() => setFields([])}>清空</Button>
            </Space>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allFieldNames.map((f) => (
              <Tag.CheckableTag key={f.key} checked={fields.includes(f.key)}
                onChange={(checked) => setFields(checked ? [...fields, f.key] : fields.filter((k) => k !== f.key))}
                style={{ fontSize: 13, padding: '4px 12px' }}>{f.title}</Tag.CheckableTag>
            ))}
          </div>
          {fields.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13, color: '#6b7280' }}>字段重命名（选填）</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {allFieldNames.filter((f) => fields.includes(f.key)).map((f) => (
                  <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</span>
                    <span style={{ color: '#d1d5db' }}>&rarr;</span>
                    <Input size="small" placeholder={f.title}
                      value={renameMap[f.key] || ''}
                      onChange={(e) => setRenameMap((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ flex: 1, fontSize: 12 }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 选项 */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>包含审核记录</span>
        <Switch checked={includeReview} onChange={setIncludeReview} />
      </div>

      <Button type="primary" size="large" icon={<ExportOutlined />} loading={exporting}
        onClick={handleExport} block>开始导出</Button>

      {/* 导出历史 */}
      <div style={{ marginTop: 36 }}>
        <div style={{ fontWeight: 500, marginBottom: 12, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>导出历史</span>
          <Button size="small" onClick={fetchHistory} loading={historyLoading} icon={<ReloadOutlined />} />
        </div>
        {history.length === 0 ? (
          <Empty description="暂无导出记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table dataSource={history} columns={historyColumns} rowKey="id" size="small" pagination={false} />
        )}
      </div>
    </div>
  )
}
