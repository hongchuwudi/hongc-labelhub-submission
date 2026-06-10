/** SchemaToolbar.tsx — 设计器顶部工具栏
 * Author: hongchuwudi
 * Description: 提供新建、保存、预览、查看 JSON、打开已有 Schema 等功能
 */
import { useState } from 'react'
import { Button, Space, App, Modal, Table, Popconfirm } from 'antd'
import { SaveOutlined, EyeOutlined, CodeOutlined, FolderOpenOutlined, FileAddOutlined, DeleteOutlined } from '@ant-design/icons'
import { useSchemaDesigner } from '../SchemaDesignerContext'
import { listSchemasApi, getSchemaApi, createSchemaApi, updateSchemaApi, deleteSchemaApi } from '@/api/schemas'
import type { SchemaListItem } from '@/api/schemas'

/** SchemaToolbar — 设计器顶部操作栏 */
export default function SchemaToolbar() {
  const { state, dispatch } = useSchemaDesigner()
  const { message } = App.useApp()
  const [loadOpen, setLoadOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [schemas, setSchemas] = useState<SchemaListItem[]>([])

  const handlePreview = () => {
    dispatch({ type: 'SET_PREVIEW', payload: !state.previewVisible })
  }

  const handleJsonView = () => {
    dispatch({ type: 'SET_JSON_VIEW', payload: !state.jsonViewVisible })
  }

  // Cleanup unused

  const handleSave = async () => {
    if (state.saveStatus === 'saving') return
    if (state.schema.fields.length === 0) { message.warning('Schema 为空，请添加至少一个字段后再保存'); return }
    dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' })
    try {
      const payload = { name: state.schema.title || '未命名 Schema', schema: state.schema }
      let res
      if (state.schemaId) {
        res = await updateSchemaApi(state.schemaId, payload)
      } else {
        res = await createSchemaApi(payload)
        dispatch({ type: 'SET_SCHEMA_ID', payload: res.data.id })
      }
      dispatch({ type: 'SET_UPDATED_AT', payload: res.data.updated_at })
      dispatch({ type: 'SET_SCHEMA_VERSION', payload: res.data.version ?? (state.schemaVersion + 1) })
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' })
      message.success('保存成功')
      setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: 'idle' }), 2000)
    } catch (e: unknown) {
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'error' })
      message.error(e instanceof Error ? e.message : '保存失败')
    }
  }

  const handleOpenModal = async () => {
    setLoadOpen(true)
    setLoading(true)
    try {
      const res = await listSchemasApi()
      setSchemas(res.data.items)
    } catch {
      message.error('加载 Schema 列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    dispatch({ type: 'RESET' })
    message.success('已创建新 Schema，开始搭建吧')
  }

  const handleDeleteCurrent = () => {
    if (!state.schemaId) { message.warning('请先保存当前 Schema 后再删除'); return }
    deleteSchemaApi(state.schemaId).then(() => {
      message.success('已删除')
      dispatch({ type: 'RESET' })
    }).catch((e) => message.error(e instanceof Error ? e.message : '删除失败'))
  }

  const handleDeleteFromList = (id: number) => {
    deleteSchemaApi(id).then(() => {
      message.success('已删除')
      setSchemas((prev) => prev.filter((s) => s.id !== id))
      if (state.schemaId === id) dispatch({ type: 'RESET' })
    }).catch((e) => message.error(e instanceof Error ? e.message : '删除失败'))
  }

  const handleLoad = async (id: number) => {
    try {
      const res = await getSchemaApi(id)
      dispatch({ type: 'LOAD_SCHEMA', payload: res.data.schema })
      dispatch({ type: 'SET_SCHEMA_ID', payload: res.data.id })
      dispatch({ type: 'SET_SCHEMA_VERSION', payload: res.data.version })
      dispatch({ type: 'SET_UPDATED_AT', payload: res.data.updated_at })
      message.success(`已加载: ${res.data.name}`)
      setLoadOpen(false)
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '加载失败')
    }
  }

  const saveText =
    state.saveStatus === 'saving' ? '保存中...' :
    state.saveStatus === 'saved' ? '已保存' :
    '保存'

  return (
    <div className="schema-toolbar">
      <Space className="schema-toolbar-left">
        <span className="schema-toolbar-label">Schema 设计器</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            value={state.schema.title}
            onChange={(e) => dispatch({ type: 'UPDATE_META', payload: { title: e.target.value } })}
            placeholder="Schema 名称"
            size={Math.max(state.schema.title.length || 6, 6)}
            style={{
              fontSize: 13, fontWeight: 600, color: '#1a1a2e',
              border: '1px solid #d9d9d9', borderRadius: 6,
              padding: '4px 8px', outline: 'none',
              maxWidth: 260, minWidth: 100,
              fontFamily: 'inherit',
            }}
          />
          <span style={{ fontSize: 11, color: '#8b5cf6', whiteSpace: 'nowrap', fontWeight: 600 }}>
            v{state.schemaVersion}
          </span>
          {state.updatedAt && (
            <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
              最近修改: {new Date(state.updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </span>
      </Space>
      <Space className="schema-toolbar-actions">
        <Button icon={<FileAddOutlined />} onClick={handleNew}>
          <span className="schema-toolbar-btn-text">新建</span>
        </Button>
        <Button icon={<EyeOutlined />} onClick={handlePreview}>
          <span className="schema-toolbar-btn-text">{state.previewVisible ? '关闭预览' : '预览'}</span>
        </Button>
        <Button icon={<CodeOutlined />} onClick={handleJsonView}>
          <span className="schema-toolbar-btn-text">查看 JSON</span>
        </Button>
        <Button icon={<FolderOpenOutlined />} onClick={handleOpenModal}>
          <span className="schema-toolbar-btn-text">打开</span>
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={state.saveStatus === 'saving'}
          danger={state.saveStatus === 'error'}
        >
          <span className="schema-toolbar-btn-text">{saveText}</span>
        </Button>
        {state.schemaId && (
          <Popconfirm title="确定删除此 Schema？" onConfirm={handleDeleteCurrent} okText="删除" cancelText="取消">
            <Button danger icon={<DeleteOutlined />}>
              <span className="schema-toolbar-btn-text">删除</span>
            </Button>
          </Popconfirm>
        )}
      </Space>

      <Modal
        title="打开已有 Schema"
        open={loadOpen}
        onCancel={() => setLoadOpen(false)}
        footer={null}
        width={600}
      >
        <Table
          dataSource={schemas}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            { title: '名称', dataIndex: 'name', key: 'name' },
            { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
            { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 180 },
            {
              title: '操作', key: 'action', width: 130,
              render: (_, record) => (
                <Space size={0}>
                  <Button type="link" size="small" onClick={() => handleLoad(record.id)}>加载</Button>
                  <Popconfirm title="确定删除？" onConfirm={() => handleDeleteFromList(record.id)} okText="删除" cancelText="取消">
                    <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  )
}
