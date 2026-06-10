/**
 * TaskList.tsx — 任务列表管理
 * Author: hongchuwudi
 * Description: 任务 CRUD、状态流转、筛选搜索、嵌入式导出
 */
import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Tag, Space, Drawer, Form, Input, Select, DatePicker, InputNumber, App, Progress, Descriptions, Empty, Modal, Tooltip } from 'antd'
import { PlusOutlined, ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined, DeleteOutlined, ExportOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { listTasksApi, createTaskApi, updateTaskApi, deleteTaskApi, type TaskListItem, type CreateTaskData, type UpdateTaskData } from '@/api/tasks'
import ExportPage from '@/pages/TaskManage/ExportPage'
import { listSchemasApi } from '@/api/schemas'
import { listDatasetsApi, listItemsApi } from '@/api/datasets'
import { listAiConfigsApi } from '@/api/ai-configs'
import apiClient from '@/api/client'
import dayjs from 'dayjs'
import RichTextEditor from './RichTextEditor'

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  published: { color: 'green', label: '发布中' },
  paused: { color: 'orange', label: '已暂停' },
  ended: { color: '#6b7280', label: '已结束' },
  submitted: { color: 'blue', label: '已完成' },
}

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

const TAG_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16']

/** 任务列表管理组件 */
export default function TaskList() {
  const mobile = useIsMobile()
  const { message } = App.useApp()
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [searchText, setSearchText] = useState('')
  const [tagFilter, setTagFilter] = useState<string | undefined>()
  const [schemaOptions, setSchemaOptions] = useState<{ label: string; value: number }[]>([])
  const [datasetOptions, setDatasetOptions] = useState<{ label: string; value: number }[]>([])
  const [labelerOptions, setLabelerOptions] = useState<{ label: string; value: number }[]>([])
  const [aiConfigOptions, setAiConfigOptions] = useState<{ label: string; value: number }[]>([])
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [detail, setDetail] = useState<TaskListItem | null>(null)
  const [exportTask, setExportTask] = useState<TaskListItem | null>(null)
  const [editing, setEditing] = useState<TaskListItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const createStrategy = Form.useWatch('distribution_strategy', createForm)
  const editStrategy = Form.useWatch('distribution_strategy', editForm) || editing?.distribution_strategy
  const dsId = Form.useWatch('dataset_id', createForm)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listTasksApi({ status: statusFilter, tags: tagFilter, page_size: 100 })
      setTasks(res.data.items)
    } catch { message.error('加载任务列表失败') }
    finally { setLoading(false) }
  }, [statusFilter, tagFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // 组件挂载时加载选项列表——新建/编辑共用
  useEffect(() => {
    (async () => {
      try {
        const [schemasRes, datasetsRes, usersRes, aiRes] = await Promise.all([
          listSchemasApi(), listDatasetsApi(), apiClient.get('/users/', { params: { role: 'labeler' } }),
          listAiConfigsApi(1, 50).catch(() => ({ data: { items: [] } })),
        ])
        setSchemaOptions(schemasRes.data.items.map((s: { id: number; name: string; version?: number }) => ({ label: `${s.name} (v${s.version})`, value: s.id })))
        setDatasetOptions(datasetsRes.data.items.map((d: { id: number; name: string }) => ({ label: d.name, value: d.id })))
        setLabelerOptions((usersRes.data as { id: number; name: string }[]).map((u) => ({ label: u.name, value: u.id })))
        setAiConfigOptions((aiRes.data.items || []).map((a: { id: number; name: string }) => ({ label: a.name, value: a.id })))
      } catch { /* 静默失败 */ }
    })()
  }, [])

  useEffect(() => {
    if (!dsId) { setPendingCount(null); return }
    listItemsApi(dsId, { page_size: 1 }).then((r) => {
      setPendingCount(r.data.total)
    }).catch(() => setPendingCount(null))
  }, [dsId])

  const openCreate = () => {
    createForm.resetFields()
    createForm.setFieldsValue({ distribution_strategy: 'first_come', quota: 0 })
    setDrawerOpen(true)
  }

  const toISO = (v: unknown) => v && typeof v === 'object' && 'toISOString' in (v as Record<string, unknown>) ? (v as { toISOString: () => string }).toISOString() : null

  const handleCreate = async (values: Record<string, unknown>) => {
    setSaving(true)
    try {
      await createTaskApi({ ...values as unknown as CreateTaskData, deadline: toISO(values.deadline) })
      message.success('任务创建成功')
      setDrawerOpen(false)
      fetchTasks()
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '创建失败') }
    finally { setSaving(false) }
  }

  const handleDelete = async (taskId: number) => {
    try { await deleteTaskApi(taskId); message.success('已删除'); fetchTasks() }
    catch (e: unknown) { message.error(e instanceof Error ? e.message : '删除失败') }
  }

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!editing) { message.error('编辑状态异常，请重新打开'); return }
    setSaving(true)
    try { await updateTaskApi(editing.id, { ...values as unknown as UpdateTaskData, deadline: toISO(values.deadline) }); message.success('已更新'); setEditing(null); fetchTasks() }
    catch (e: unknown) { message.error(e instanceof Error ? e.message : '更新失败') }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (taskId: number, status: string) => {
    try { await updateTaskApi(taskId, { status }); message.success('状态已更新'); fetchTasks() }
    catch (e: unknown) { message.error(e instanceof Error ? e.message : '操作失败') }
  }

  const parseTags = (t: string) => t ? t.split(',').map((s) => s.trim()).filter(Boolean) : []

  const actBtns = (r: TaskListItem) => {
    const btns: { key: string; icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }[] = []
    if (r.status === 'draft') {
      btns.push({ key: 'edit', icon: <EditOutlined />, label: '编辑', onClick: () => {
        editForm.setFieldsValue({
          ...r, dataset_id: undefined,
          deadline: r.deadline ? dayjs.utc(r.deadline).local() : null,
          ai_agent_id: r.ai_agent_id || undefined,
          grab_limit: r.grab_limit || undefined,
          reward_per_item: r.reward_per_item || undefined,
          reward_cap: r.reward_cap || undefined,
        }); setEditing(r)
        // 加载该任务关联数据集的条目总数供配额上限
        listItemsApi(r.dataset_id, { page_size: 1 }).then((res) => {
          setPendingCount(res.data.total)
        }).catch(() => setPendingCount(null))
      }})
    }
    if (r.status === 'draft') {
      btns.push({ key: 'publish', icon: <PlayCircleOutlined />, label: '发布', onClick: () => handleStatusChange(r.id, 'published') })
    }
    if (r.status === 'published') {
      btns.push({ key: 'pause', icon: <PauseCircleOutlined />, label: '暂停', onClick: () => handleStatusChange(r.id, 'paused') })
    }
    if (r.status === 'paused') {
      btns.push({ key: 'resume', icon: <PlayCircleOutlined />, label: '恢复', onClick: () => handleStatusChange(r.id, 'published') })
    }
    if (r.status === 'published' || r.status === 'paused') {
      btns.push({ key: 'end', icon: <StopOutlined />, label: '结束', danger: true, onClick: () => handleStatusChange(r.id, 'ended') })
    }
    if (r.status !== 'draft') {
      btns.push({ key: 'export', icon: <ExportOutlined />, label: '导出', onClick: () => setExportTask(r) })
    }
    if (r.status === 'draft' || r.status === 'ended') {
      btns.push({ key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true, onClick: () => handleDelete(r.id) })
    }
    if (mobile) {
      btns.unshift({ key: 'detail', icon: <InfoCircleOutlined />, label: '详情', onClick: () => setDetail(r) })
    }

    return (
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {btns.map((b) => (
          <Tooltip key={b.key} title={b.label}>
            <Button type="text" size="small" danger={b.danger}
              icon={b.icon} onClick={b.onClick}
              style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }} />
          </Tooltip>
        ))}
      </div>
    )
  }

  const columns = [
    { title: '任务名称', dataIndex: 'title', ellipsis: true,
      render: (t: string, r: TaskListItem) => (
        <a style={{ cursor: 'pointer' }} onClick={() => setDetail(r)}>{t}</a>
      ),
    },
    {
      title: '标签', dataIndex: 'tags', width: mobile ? 0 : '14%',
      render: (t: string) => t ? (
        <Space size={2} wrap>
          {parseTags(t).map((tag, i) => (
            <Tag key={i} color={TAG_COLORS[i % TAG_COLORS.length]} style={{ fontSize: 11, margin: 0 }}>{tag}</Tag>
          ))}
        </Space>
      ) : <span style={{ color: '#d1d5db' }}>-</span>,
    },
    {
      title: '状态', dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_CONFIG[s]?.color}>{STATUS_CONFIG[s]?.label || s}</Tag>,
    },
    ...(mobile ? [] : [
      { title: 'ID', dataIndex: 'id', width: '5%' },
      { title: '策略', dataIndex: 'distribution_strategy', width: '8%', render: (s: string) => s === 'first_come' ? '抢单' : '指派' },
      {
        title: '进度', dataIndex: 'progress', width: '14%',
        render: (p: number, r: TaskListItem) => (
          <Space size={8}>
            <Progress percent={Math.round(p || 0)} size="small" style={{ width: 80 }} />
            <span style={{ fontSize: 13, color: '#9ca3af' }}>{r.completed_items}/{r.quota}</span>
          </Space>
        ),
      },
      { title: '更新时间', dataIndex: 'updated_at', render: (s: string) => dayjs.utc(s).local().format('MM/DD HH:mm') },
    ]),
    { title: '操作', key: 'action', width: mobile ? 'auto' : 220, render: (_: unknown, r: TaskListItem) => actBtns(r) },
  ]

  // 下拉用的标签选项（从当前加载的任务中收集，仅供参考）
  const tagOptions = [...new Set(tasks.flatMap((t) => parseTags(t.tags)))]

  // 名称搜索在前端做，标签/状态走服务端
  const displayed = searchText.trim()
    ? tasks.filter((t) => t.title.toLowerCase().includes(searchText.toLowerCase()))
    : tasks

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>任务管理</h2>
        <Space wrap size={mobile ? 'small' : 'middle'}>
          <Input.Search placeholder="搜索任务名称" allowClear size="small" style={{ width: 180 }}
            value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          <Select allowClear placeholder="标签" size="small" style={{ width: 100 }}
            value={tagFilter} onChange={(v) => setTagFilter(v)}
            options={tagOptions.map((t) => ({ value: t, label: t }))}
            popupMatchSelectWidth={false} />
          <Select allowClear placeholder="状态" size="small" style={{ width: 100 }}
            value={statusFilter} onChange={(v) => setStatusFilter(v)}
            options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
          <Button icon={<ReloadOutlined />} size="small" onClick={fetchTasks}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={openCreate}>新建任务</Button>
        </Space>
      </div>

      <Table dataSource={displayed} columns={columns} rowKey="id" loading={loading} size={mobile ? 'small' : 'middle'}
        locale={{ emptyText: <div style={{ minHeight: 'calc(100vh - 240px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description="暂无任务" /></div> }}
        pagination={{ pageSize: mobile ? 10 : 20, showSizeChanger: false, ...(mobile ? { size: 'small' as const } : {}) }} />

      <Drawer title="新建任务" open={drawerOpen} onClose={() => setDrawerOpen(false)} size="large"
        placement={mobile ? 'bottom' : 'right'} styles={mobile ? { body: { height: '80vh' } } : undefined}>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="任务名称" rules={[{ required: true, message: '请输入' }]}>
            <Input placeholder="商品标题清洗 v3" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="电商, 文本清洗（逗号分隔）" />
          </Form.Item>
          <Form.Item name="description" label="描述（富文本）"><RichTextEditor /></Form.Item>
          <Form.Item name="dataset_id" label="关联数据集" rules={[{ required: true, message: '请选择' }]}>
            <Select options={datasetOptions} placeholder="选择数据集" showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="schema_id" label="关联 Schema" rules={[{ required: true, message: '请选择' }]}>
            <Select options={schemaOptions} placeholder="选择标注模板" showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="ai_agent_id" label="AI Agent" help="选择 AI Agent 后，标注员提交时将自动触发 AI 预审">
            <Select
              options={aiConfigOptions}
              placeholder="不启用 AI 预审"
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ maxWidth: 300 }}
            />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16, flexWrap: mobile ? 'wrap' : undefined }}>
            <Form.Item name="distribution_strategy" label="分发策略" style={mobile ? { flex: 1 } : undefined}>
              <Select options={[
                { value: 'first_come', label: '先到先得' },
                { value: 'assigned', label: '指派' },
                { value: 'quota_grab', label: '配额抢单' },
              ]} style={mobile ? { width: '100%' } : { width: 150 }} />
            </Form.Item>
            {createStrategy === 'quota_grab' && (
              <Form.Item name="grab_limit" label="每人最大认领数" help="留空则不限制" style={mobile ? { flex: 1 } : undefined}>
                <InputNumber min={1} placeholder="不限制" style={mobile ? { width: '100%' } : { width: 130 }} />
              </Form.Item>
            )}
            {createStrategy === 'assigned' && (
              <Form.Item name="assignee_id" label="指派给" rules={[{ required: true, message: '请选择标注员' }]} style={mobile ? { flex: 1 } : undefined}>
                <Select options={labelerOptions} placeholder="选择标注员" showSearch optionFilterProp="label" style={{ minWidth: 140 }} />
              </Form.Item>
            )}
            <Form.Item name="quota" label="配额（需标注条数）"
              extra={pendingCount !== null ? `数据集还有 ${pendingCount} 条待标注` : undefined} style={mobile ? { flex: 1 } : undefined}>
              <InputNumber min={1} max={pendingCount ?? 99999} placeholder="总条数"
                style={mobile ? { width: '100%' } : { width: 120 }} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: mobile ? 'wrap' : undefined }}>
            <Form.Item name="reward_per_item" label="奖励（元/条）" style={mobile ? { flex: 1 } : undefined}>
              <InputNumber min={0} step={0.1} placeholder="0.30" style={mobile ? { width: '100%' } : { width: 130 }} />
            </Form.Item>
            <Form.Item name="reward_cap" label="月度封顶（元）" style={mobile ? { flex: 1 } : undefined}>
              <InputNumber min={0} placeholder="1500" style={mobile ? { width: '100%' } : { width: 140 }} />
            </Form.Item>
          </div>
          <Form.Item name="deadline" label="截止时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
            <Space><Button onClick={() => setDrawerOpen(false)}>取消</Button><Button type="primary" htmlType="submit" loading={saving}>创建</Button></Space>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer title="编辑任务" open={!!editing} onClose={() => setEditing(null)} size="large">
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="title" label="任务名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="tags" label="标签"><Input placeholder="电商, 文本清洗（逗号分隔）" /></Form.Item>
          <Form.Item name="description" label="描述（富文本）"><RichTextEditor /></Form.Item>
          <Form.Item name="schema_id" label="关联 Schema" rules={[{ required: true, message: '请选择' }]}>
            <Select options={schemaOptions} placeholder="选择标注模板" showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="ai_agent_id" label="AI Agent" help="选择 AI Agent 后，标注员提交时将自动触发 AI 预审">
            <Select options={aiConfigOptions} placeholder="不启用 AI 预审" allowClear showSearch optionFilterProp="label" style={{ maxWidth: 300 }} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16, flexWrap: mobile ? 'wrap' : undefined }}>
            <Form.Item name="distribution_strategy" label="分发策略" style={mobile ? { flex: 1 } : undefined}>
              <Select options={[
                { value: 'first_come', label: '先到先得' },
                { value: 'assigned', label: '指派' },
                { value: 'quota_grab', label: '配额抢单' },
              ]} style={mobile ? { width: '100%' } : { width: 150 }} />
            </Form.Item>
            {editStrategy === 'quota_grab' && (
              <Form.Item name="grab_limit" label="每人最大认领数" help="留空则不限制" style={mobile ? { flex: 1 } : undefined}>
                <InputNumber min={1} placeholder="不限制" style={mobile ? { width: '100%' } : { width: 130 }} />
              </Form.Item>
            )}
            {editStrategy === 'assigned' && (
              <Form.Item name="assignee_id" label="指派给" rules={[{ required: true, message: '请选择标注员' }]} style={mobile ? { flex: 1 } : undefined}>
                <Select options={labelerOptions} placeholder="选择标注员" showSearch optionFilterProp="label" style={{ minWidth: 140 }} />
              </Form.Item>
            )}
            <Form.Item name="quota" label="配额（需标注条数）"
              extra={pendingCount !== null ? `数据集还有 ${pendingCount} 条待标注` : undefined} style={mobile ? { flex: 1 } : undefined}>
              <InputNumber min={1} max={pendingCount ?? 99999} placeholder="总条数" style={mobile ? { width: '100%' } : { width: 120 }} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: mobile ? 'wrap' : undefined }}>
            <Form.Item name="reward_per_item" label="奖励（元/条）" style={mobile ? { flex: 1 } : undefined}>
              <InputNumber min={0} step={0.1} placeholder="0.30" style={mobile ? { width: '100%' } : { width: 130 }} />
            </Form.Item>
            <Form.Item name="reward_cap" label="月度封顶（元）" style={mobile ? { flex: 1 } : undefined}>
              <InputNumber min={0} placeholder="1500" style={mobile ? { width: '100%' } : { width: 140 }} />
            </Form.Item>
          </div>
          <Form.Item name="deadline" label="截止时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
            <Button onClick={() => setEditing(null)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={saving} style={{ marginLeft: 8 }}>保存</Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer title="数据导出" placement="right" size="large"
        open={!!exportTask} onClose={() => setExportTask(null)}
        styles={{ body: { padding: '0 24px' } }}>
        {exportTask && <ExportPage taskId={exportTask.id} />}
      </Drawer>
      <Modal title="任务详情" open={!!detail} onCancel={() => setDetail(null)} footer={null} width={600}>
        {detail && (
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="任务名称" span={2}>{detail.title}</Descriptions.Item>
            <Descriptions.Item label="标签" span={2}>
              {detail.tags ? parseTags(detail.tags).map((t, i) => <Tag key={i} color={TAG_COLORS[i % TAG_COLORS.length]}>{t}</Tag>) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={STATUS_CONFIG[detail.status]?.color}>{STATUS_CONFIG[detail.status]?.label || detail.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="策略">{detail.distribution_strategy === 'first_come' ? "先到先得" : detail.distribution_strategy === 'quota_grab' ? "配额抢单" : "指派"}</Descriptions.Item>
            <Descriptions.Item label="配额">{detail.quota}</Descriptions.Item>
            <Descriptions.Item label="进度">{detail.completed_items} / {detail.quota} ({Math.round(detail.progress || 0)}%)</Descriptions.Item>
            <Descriptions.Item label="奖励">{detail.reward_per_item != null ? detail.reward_per_item + " 元/条" : "-"}</Descriptions.Item>
            <Descriptions.Item label="月度封顶">{detail.reward_cap != null ? detail.reward_cap + " 元" : "-"}</Descriptions.Item>
            <Descriptions.Item label="截止时间" span={2}>{detail.deadline ? dayjs.utc(detail.deadline).local().format("YYYY/MM/DD HH:mm") : "不限"}</Descriptions.Item>
            {detail.description && (
              <Descriptions.Item label="描述" span={2}>
                <div dangerouslySetInnerHTML={{ __html: detail.description }} style={{ maxHeight: 200, overflow: "auto" }} />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>


      <Modal title="任务详情" open={!!detail} onCancel={() => setDetail(null)} footer={null} width={640}>
        {detail && (
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label="任务名称">{detail.title}</Descriptions.Item>
            <Descriptions.Item label="标签" span={2}>
              {detail.tags ? parseTags(detail.tags).map((t, i) => (
                <Tag key={i} color={TAG_COLORS[i % TAG_COLORS.length]} style={{ marginBottom: 4 }}>{t}</Tag>
              )) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_CONFIG[detail.status]?.color}>{STATUS_CONFIG[detail.status]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="分发策略">{
              detail.distribution_strategy === 'first_come' ? '先到先得' :
              detail.distribution_strategy === 'quota_grab' ? '配额抢单' : '指派'
            }</Descriptions.Item>
            {detail.grab_limit != null && (
              <Descriptions.Item label="每人最多认领" span={2}>{detail.grab_limit} 条</Descriptions.Item>
            )}
            <Descriptions.Item label="奖励">{detail.reward_per_item != null ? `${detail.reward_per_item} 元/条` : '-'}</Descriptions.Item>
            <Descriptions.Item label="月度封顶">{detail.reward_cap != null ? `${detail.reward_cap} 元` : '-'}</Descriptions.Item>
            <Descriptions.Item label="进度" span={2}>{detail.completed_items} / {detail.quota}（{Math.round(detail.progress || 0)}%）</Descriptions.Item>
            <Descriptions.Item label="更新时间" span={2}>{dayjs(detail.updated_at).format('YYYY/MM/DD HH:mm:ss')}</Descriptions.Item>
            {detail.description && (
              <Descriptions.Item label="描述" span={2}>
                <div dangerouslySetInnerHTML={{ __html: detail.description }} style={{ maxHeight: 300, overflow: 'auto' }} />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
