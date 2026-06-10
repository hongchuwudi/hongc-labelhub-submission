/** DatasetList.tsx — 数据集列表页
 * Author: hongchuwudi
 * Description: 展示所有数据集，支持搜索、新建、编辑、删除，含统计卡片
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, Drawer, Form, Input, Select, App, Popconfirm, Tag, Empty, Card, Row, Col, Statistic } from 'antd'
import { PlusOutlined, ReloadOutlined, DeleteOutlined, EditOutlined, DatabaseOutlined, OrderedListOutlined } from '@ant-design/icons'
import { listDatasetsApi, createDatasetApi, updateDatasetApi, deleteDatasetApi, type DatasetRecord } from '@/api/datasets'
import dayjs from 'dayjs'
import InlineName from './components/InlineName'
import { getMyDatasetsStatsApi, type DatasetsStats } from '@/api/dashboard'
import useIsMobile from '@/hooks/useIsMobile'

/** 数据集列表页面组件 */
function DatasetList() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { message } = App.useApp()
  const [datasets, setDatasets] = useState<DatasetRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<DatasetRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [form] = Form.useForm()
  const [dsStats, setDsStats] = useState<DatasetsStats | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [res, statsRes] = await Promise.all([listDatasetsApi(), getMyDatasetsStatsApi()])
      setDatasets(res.data.items)
      setDsStats(statsRes.data)
    } catch { message.error('加载数据集失败') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const displayed = searchText.trim()
    ? datasets.filter((d) => d.name.toLowerCase().includes(searchText.toLowerCase()))
    : datasets

  const handleCreate = async (values: Record<string, unknown>) => {
    try {
      await createDatasetApi(values as { name: string; description?: string; format?: string })
      message.success('创建成功')
      setDrawerOpen(false)
      form.resetFields()
      fetchData()
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '创建失败') }
  }

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!editing) return
    try {
      await updateDatasetApi(editing.id, values as { name?: string; description?: string })
      message.success('已更新')
      setEditing(null)
      fetchData()
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '更新失败') }
  }

  const openEdit = (record: DatasetRecord) => {
    setEditing(record)
    form.setFieldsValue({ name: record.name, description: record.description })
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteDatasetApi(id)
      message.success('已删除')
      fetchData()
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '删除失败') }
  }

  const columns = isMobile ? [
    {
      title: '名称', dataIndex: 'name', width: '50%',
      render: (name: string, r: DatasetRecord) => (
        <InlineName value={name} onSave={async (v: string) => { await updateDatasetApi(r.id, { name: v }); fetchData() }} />
      ),
    },
    { title: '条目', dataIndex: 'item_count', width: '18%', render: (n: number) => n?.toLocaleString() || 0 },
    {
      title: '操作', key: 'action', width: '32%',
      render: (_: unknown, r: DatasetRecord) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => navigate(`/datasets/${r.id}`)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ] : [
    { title: 'ID', dataIndex: 'id', width: '6%' },
    {
      title: '名称', dataIndex: 'name', width: '32%',
      render: (name: string, r: DatasetRecord) => (
        <InlineName value={name} onSave={async (v: string) => { await updateDatasetApi(r.id, { name: v }); fetchData() }} />
      ),
    },
    { title: '格式', dataIndex: 'format', width: '10%', render: (s: string) => <Tag>{s?.toUpperCase()}</Tag> },
    { title: '条目数', dataIndex: 'item_count', width: '10%', render: (n: number) => n?.toLocaleString() || 0 },
    { title: '创建时间', dataIndex: 'created_at', width: '14%', render: (s: string) => dayjs.utc(s).local().format('MM/DD HH:mm') },
    {
      title: '操作', key: 'action', width: '18%',
      render: (_: unknown, r: DatasetRecord) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => navigate(`/datasets/${r.id}`)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: isMobile ? 12 : 20, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0,
      }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 700 }}>数据集</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: isMobile ? '100%' : 'auto' }}>
          <Input.Search
            placeholder="搜索数据集名称..."
            allowClear
            style={{ width: isMobile ? '100%' : 240 }}
            value={searchText} onChange={(e) => setSearchText(e.target.value)}
            onSearch={(v) => setSearchText(v)}
          />
          {!isMobile && <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setDrawerOpen(true) }}
            style={isMobile ? { flexShrink: 0 } : undefined}>
            {isMobile ? '新建' : '新建数据集'}
          </Button>
        </div>
      </div>

      {dsStats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}><Card size="small"><Statistic title="我的数据集" value={dsStats.total_datasets} prefix={<DatabaseOutlined />} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="我的数据条目" value={dsStats.total_items} prefix={<OrderedListOutlined />} valueStyle={{ color: '#3b82f6' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="已关联任务" value={dsStats.used_datasets} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="未使用" value={dsStats.total_datasets - dsStats.used_datasets} valueStyle={{ color: '#9ca3af' }} /></Card></Col>
        </Row>
      )}

      <Table dataSource={displayed} columns={columns} rowKey="id"
        loading={loading} size={isMobile ? 'small' : 'middle'}
        locale={{ emptyText: <div style={{ minHeight: isMobile ? 'calc(100dvh - 180px)' : 'calc(100dvh - 240px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description="暂无数据集" /></div> }}
        pagination={isMobile ? { pageSize: 20, showSizeChanger: false, size: 'small' } : { pageSize: 20, showSizeChanger: false }} />

      <Drawer title="新建数据集" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        size="default" styles={isMobile ? { body: { padding: 16 } } : undefined}>
        <Form form={form} layout="vertical" onFinish={handleCreate}
          initialValues={{ format: 'json' }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入' }]}>
            <Input placeholder="商品标题 v3" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="数据集描述（可选）" />
          </Form.Item>
          <Form.Item name="format" label="数据格式">
            <Select options={[
              { value: 'json', label: 'JSON' },
              { value: 'jsonl', label: 'JSONL' },
              { value: 'csv', label: 'CSV' },
              { value: 'xlsx', label: 'Excel' },
            ]} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setDrawerOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer title="编辑数据集" open={!!editing} onClose={() => setEditing(null)}
        size="default" styles={isMobile ? { body: { padding: 16 } } : undefined}>
        <Form form={form} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="数据集描述（可选）" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setEditing(null)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default DatasetList
