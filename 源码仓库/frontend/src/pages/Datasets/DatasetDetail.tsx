/** DatasetDetail.tsx — 数据集详情页
 * Author: hongchuwudi
 * Description: 展示数据集条目列表，支持搜索、编辑、删除和 JSON 编辑
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Table, Button, Space, Drawer, Input, App, Popconfirm, Tag, Alert } from 'antd'
import { ReloadOutlined, DeleteOutlined, EditOutlined, ImportOutlined, LeftOutlined, FormatPainterOutlined } from '@ant-design/icons'
import { listItemsApi, updateItemApi, deleteItemApi, batchDeleteItemsApi, type DatasetItem } from '@/api/datasets'
import dayjs from 'dayjs'
import JsonHighlight from './components/JsonHighlight'
import JsonEditor from '@/components/JsonEditor'
import useIsMobile from '@/hooks/useIsMobile'

/** 数据集详情页面组件 */
function DatasetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { message } = App.useApp()
  const [items, setItems] = useState<DatasetItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [detailItem, setDetailItem] = useState<DatasetItem | null>(null)
  const [editingItem, setEditingItem] = useState<DatasetItem | null>(null)
  const [editJson, setEditJson] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const fetchItems = useCallback(async (p = 1) => {
    if (!id) return
    setLoading(true)
    try {
      const res = await listItemsApi(Number(id), { page: p, page_size: 50 })
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch { message.error('加载条目失败') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchItems(page) }, [fetchItems, page])

  const displayed = searchText.trim()
    ? items.filter((it) => JSON.stringify(it.data).toLowerCase().includes(searchText.toLowerCase()))
    : items

  const handleDelete = async (itemId: number) => {
    try {
      await deleteItemApi(Number(id), itemId)
      message.success('已删除')
      fetchItems(page)
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '删除失败') }
  }

  const handleBatchDelete = async () => {
    try {
      await batchDeleteItemsApi(Number(id), selectedRowKeys as number[])
      message.success(`已删除 ${selectedRowKeys.length} 条`)
      setSelectedRowKeys([])
      fetchItems(page)
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '删除失败') }
  }

  const openEditItem = (item: DatasetItem) => {
    setEditingItem(item)
    setEditJson(JSON.stringify(item.data, null, 2))
    setEditError(null)
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    try {
      const parsed = JSON.parse(editJson)
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        setEditError('数据必须是 JSON 对象（以 { 开头）')
        return
      }
      setEditSaving(true)
      await updateItemApi(Number(id), editingItem.id, { data: parsed as Record<string, unknown> })
      message.success('已更新')
      setEditingItem(null)
      fetchItems(page)
    } catch (e: unknown) {
      if (e instanceof SyntaxError) {
        setEditError('JSON 格式错误：' + e.message)
      } else {
        message.error(e instanceof Error ? e.message : '更新失败')
      }
    } finally {
      setEditSaving(false)
    }
  }

  const columns = isMobile ? [
    {
      title: '内容', dataIndex: 'data', ellipsis: true, width: '72%',
      render: (d: Record<string, unknown>) => (
        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151', cursor: 'pointer' }}
          onClick={() => {
            const item = items.find((it) => it.data === d)
            if (item) setDetailItem(item)
          }}>
          {JSON.stringify(d).slice(0, 80)}{JSON.stringify(d).length > 80 ? '...' : ''}
        </span>
      ),
    },
    {
      title: '操作', key: 'action', width: '28%',
      render: (_: unknown, r: DatasetItem) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => setDetailItem(r)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditItem(r)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ] : [
    { title: '#', dataIndex: 'index', width: '6%' },
    {
      title: '数据内容', dataIndex: 'data', ellipsis: true, width: '52%',
      render: (d: Record<string, unknown>) => (
        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151', cursor: 'pointer' }}>
          {JSON.stringify(d).slice(0, 150)}{JSON.stringify(d).length > 150 ? '...' : ''}
        </span>
      ),
    },
    { title: '更新时间', dataIndex: 'updated_at', width: '14%',
      render: (s: string) => dayjs.utc(s).local().format('MM/DD HH:mm') },
    {
      title: '操作', key: 'action', width: '18%',
      render: (_: unknown, r: DatasetItem) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setDetailItem(r)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditItem(r)} />
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
        <Space size={isMobile ? 4 : undefined}>
          <Button icon={<LeftOutlined />} size={isMobile ? 'small' : undefined} onClick={() => navigate('/datasets')}>
            {isMobile ? '' : '返回'}
          </Button>
          <h2 style={{ margin: 0, fontSize: isMobile ? 15 : 20, fontWeight: 700 }}>数据集 #{id}</h2>
          <Tag>{total} 条</Tag>
          {selectedRowKeys.length > 0 && (
            <Popconfirm title={`确定删除选中的 ${selectedRowKeys.length} 条数据？`} onConfirm={handleBatchDelete}>
              <Button danger size={isMobile ? 'small' : 'small'}>删除选中 ({selectedRowKeys.length})</Button>
            </Popconfirm>
          )}
        </Space>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: isMobile ? '100%' : 'auto' }}>
          <Input.Search
            placeholder="搜索数据内容..."
            allowClear
            style={{ width: isMobile ? '100%' : 240 }}
            value={searchText} onChange={(e) => setSearchText(e.target.value)}
            onSearch={(v) => setSearchText(v)}
          />
          {!isMobile && <Button icon={<ReloadOutlined />} onClick={() => fetchItems(page)}>刷新</Button>}
          <Button type="primary" icon={<ImportOutlined />} size={isMobile ? 'small' : undefined}
            onClick={() => navigate(`/datasets/${id}/import`)}>
            {isMobile ? '导入' : '导入数据'}
          </Button>
        </div>
      </div>

      <Table dataSource={displayed} columns={columns} rowKey="id"
        loading={loading} size={isMobile ? 'small' : 'middle'} onChange={(p) => setPage(p.current || 1)}
        rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
        pagination={searchText ? false : { current: page, pageSize: 50, total, showSizeChanger: false, showTotal: (t) => `共 ${t} 条`, size: isMobile ? 'small' : undefined }} />

      <Drawer title={`条目 #${detailItem?.index ?? ''}`} open={!!detailItem}
        onClose={() => setDetailItem(null)} size="large">
        {detailItem && (
          <>
            <div style={{ marginBottom: 12, fontSize: 12, color: '#9ca3af' }}>
              更新于 {dayjs(detailItem.updated_at).format('YYYY/MM/DD HH:mm:ss')}
            </div>
            <div style={{
              padding: 16, borderRadius: 8, border: '1px solid #e5e7eb',
              background: '#ffffff', fontFamily: '"JetBrains Mono", monospace',
              fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              color: '#1a1a2e',
            }}>
              <JsonHighlight data={detailItem.data} />
            </div>
          </>
        )}
      </Drawer>

      <Drawer
        title={`编辑条目 #${editingItem?.index ?? ''}`}
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        size="large"
        extra={
          <Space>
            <Button onClick={() => setEditingItem(null)}>取消</Button>
            <Button type="primary" loading={editSaving} onClick={handleEditSave}>保存</Button>
          </Space>
        }
      >
        {editError && (
          <Alert type="error" title={editError} showIcon style={{ marginBottom: 12 }} />
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 }}>
          <Button size="small" icon={<FormatPainterOutlined />}
            onClick={() => {
              try {
                setEditJson(JSON.stringify(JSON.parse(editJson), null, 2))
                setEditError(null)
              } catch { setEditError('JSON 格式错误，无法格式化') }
            }}>
            格式化
          </Button>
        </div>

        <JsonEditor
          value={editJson}
          onChange={(text) => { setEditJson(text); setEditError(null) }}
          rows={15}
        />
      </Drawer>
    </div>
  )
}

export default DatasetDetail
