/**
 * AiConfigs/index.tsx — AI Agent 配置管理
 * Author: hongchuwudi
 * Description: AI Agent 的创建、编辑、删除、状态监控与统计
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Tag, Space, message, Modal, Input, InputNumber, Popconfirm, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store'
import { listAgentsApi, createAgentApi, updateAgentApi, deleteAgentApi, type AiAgentItem } from '@/api/ai-agents'
import { getAllAgentStatsApi } from '@/api/ai-reviews'
import type { AgentStats } from '@/types/models/ai-review'
import apiClient from '@/api/client'

const { TextArea } = Input
const { Text } = Typography

const DEFAULT_PROMPT = `你是一个专业的数据标注审核专家。请根据以下信息对标注结果进行评分：

【评分维度】
{dimensions}

【任务信息】
{task}

【原始数据】
{item}

【标注结果】
{result}

请严格按照评分维度逐一评分，给出 0-1 之间的分数，并给出整体结论（pass/reject/human_review）。

【注意事项】
- 标注结果中某些字段为空可能是由于 Schema 配置了字段联动（条件显示），标注员无需填写被隐藏的字段，此类情况不应扣分。
- 请结合任务描述和原始数据综合判断标注质量，重点关注已填写字段的准确性、完整性和合规性。`

interface Dimension { name: string; label: string; weight: number }

/** AI Agent 配置管理组件 */
export default function AiConfigs() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const [agents, setAgents] = useState<AiAgentItem[]>([])
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AiAgentItem | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [prompt, setPrompt] = useState('')
  const [dims, setDims] = useState<Dimension[]>([])
  const [model, setModel] = useState('ep-20260514105718-jthdm')
  const [saving, setSaving] = useState(false)
  const [agentStatus, setAgentStatus] = useState<Record<number, { status: string; name: string }>>({})
  const [agentStats, setAgentStats] = useState<Record<number, AgentStats>>({})
  const [poolStats, setPoolStats] = useState<{ pool_size: number; busy_count: number; pending_count: number }>(
    { pool_size: 0, busy_count: 0, pending_count: 0 })

  const fetch = useCallback(async () => {
    setLoading(true)
    try { const res = await listAgentsApi(1, 50); setAgents(res.data.items) }
    catch { message.error('加载失败') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  // 定时刷新 Agent 状态 + 统计
  useEffect(() => {
    const getStatus = () => { apiClient.get('/ai-agents/status').then((r: {
      data: { agents: { id: number; status: string; name: string }[]; pool_size: number; busy_count: number; pending_count: number }
    }) => {
      const map: Record<number, { status: string; name: string }> = {}
      for (const a of (r.data?.agents || [])) map[a.id] = { status: a.status, name: a.name }
      setAgentStatus(map)
      setPoolStats({ pool_size: r.data?.pool_size || 0, busy_count: r.data?.busy_count || 0, pending_count: r.data?.pending_count || 0 })
    }).catch(() => {}) }
    const getStats = () => { getAllAgentStatsApi().then((r) => { setAgentStats(r.data || {}) }).catch(() => {}) }
    getStatus()
    getStats()
    const timer = setInterval(() => { getStatus(); getStats() }, 10000)
    return () => clearInterval(timer)
  }, [])

  const openCreate = () => {
    setEditing(null)
    setName(''); setEmail(''); setPwd('')
    setPrompt(DEFAULT_PROMPT)
    setDims([{ name: 'accuracy', label: '准确性', weight: 0.4 }, { name: 'format', label: '格式合规', weight: 0.3 }, { name: 'completeness', label: '完整性', weight: 0.3 }])
    setModel('ep-20260514105718-jthdm')
    setModalOpen(true)
  }

  const openEdit = (a: AiAgentItem) => {
    setEditing(a)
    setName(a.name)
    setEmail(a.email)
    setPwd('')
    setPrompt(a.system_prompt)
    setDims(a.scoring_dimensions)
    setModel(a.llm_model)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) { message.error('请输入名称'); return }
    if (!prompt.trim()) { message.error('请输入 Prompt'); return }
    if (!user) return
    setSaving(true)
    try {
      const data = { name: name.trim(), email: email.trim(), system_prompt: prompt.trim(),
        scoring_dimensions: dims.map((d) => ({ name: d.name.trim(), label: d.label.trim(), weight: d.weight })),
        llm_model: model, password: pwd || undefined }
      if (editing) {
        const { password, ...rest } = data
        await updateAgentApi(editing.id, rest)
        message.success('更新成功')
      } else {
        if (!email.trim() || !pwd) { message.error('新建需填写邮箱和密码'); setSaving(false); return }
        await createAgentApi({ ...data, password: pwd })
        message.success('创建成功')
      }
      setModalOpen(false); fetch()
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '保存失败') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try { await deleteAgentApi(id); message.success('已删除'); fetch() }
    catch (e: unknown) { message.error(e instanceof Error ? e.message : '删除失败') }
  }

  const cols = [
    { title: '名称', dataIndex: 'name', ellipsis: true, width: 160 },
    { title: '邮箱', dataIndex: 'email', width: 180 },
    { title: '模型', dataIndex: 'llm_model', width: 120, render: (m: string) => <Tag>{m}</Tag> },
    { title: '状态', dataIndex: 'id', width: 70, render: (id: number) => {
      const s = agentStatus[id]
      return s ? <Tag color={s.status === 'busy' ? 'orange' : 'green'}>{s.status === 'busy' ? '忙碌' : '空闲'}</Tag> : <Tag color="default">离线</Tag>
    }},
    { title: '审核统计', dataIndex: 'id', width: 140, render: (id: number) => {
      const st = agentStats[id]
      if (!st || st.total === 0) return <span style={{ fontSize: 11, color: '#9ca3af' }}>暂无数据</span>
      return (
        <Space size={4}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{st.total}</span>
          <Tag color={st.pass_rate >= 80 ? 'green' : st.pass_rate >= 50 ? 'orange' : 'red'} style={{ margin: 0, fontSize: 10 }}>
            {st.pass_rate}%
          </Tag>
        </Space>
      )
    }},
    { title: '维度', dataIndex: 'scoring_dimensions', width: 200, render: (d: Dimension[]) => <Space size={4} wrap>{(d || []).map((dim) => <Tag key={dim.name} color="blue" style={{ fontSize: 11 }}>{dim.label} ({dim.weight})</Tag>)}</Space> },
    { title: '操作', key: 'action', width: 140, render: (_: unknown, r: AiAgentItem) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Button type="link" size="small" style={{ color: '#f59e0b' }} onClick={() => navigate(`/ai-review?agent_id=${r.id}`)}>审核记录</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>AI Agent 管理</h2>
          <p className="page-subtitle">创建 AI Agent 账户并配置其审核规则，配置后可在任务中启用 AI 自动预审</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建 Agent</Button>
      </div>

      {/* 池状态 */}
      {poolStats.pool_size > 0 && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 12, padding: '8px 14px',
          background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0',
          fontSize: 12, color: '#6b7280',
        }}>
          <span>池容量: <b style={{ color: '#1a1a2e' }}>{poolStats.pool_size}</b></span>
          <span>执行中: <b style={{ color: poolStats.busy_count >= poolStats.pool_size ? '#ef4444' : '#f59e0b' }}>{poolStats.busy_count}</b></span>
          <span>排队中: <b style={{ color: poolStats.pending_count > poolStats.pool_size ? '#ef4444' : '#1a1a2e' }}>{poolStats.pending_count}</b></span>
        </div>
      )}

      <Table dataSource={agents} columns={cols} rowKey="id" loading={loading} size="middle"
        locale={{ emptyText: <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>暂无 Agent，点击右上角创建</div> }} />

      <Modal title={editing ? '编辑 Agent' : '创建 AI Agent'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        confirmLoading={saving} width={680} okText="保存">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <Space>
            <Input placeholder="Agent 名称" value={name} onChange={(e) => setName(e.target.value)} style={{ width: 200 }} />
            <Input placeholder="邮箱（登录用）" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: 250 }} disabled={!!editing} />
            <Input.Password placeholder={editing ? '新密码（不填不改）' : '密码'} value={pwd} onChange={(e) => setPwd(e.target.value)} />
          </Space>
          <div>
            <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500 }}>System Prompt 模板</div>
            <TextArea rows={8} value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 12 }} />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>变量: {'{dimensions}'} {'{task}'} {'{item}'} {'{result}'}</div>
          </div>
          <div>
            <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 500 }}>LLM 模型</div>
            <Input value="ep-20260514105718-jthdm" disabled style={{ maxWidth: 400 }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>评分维度</span>
              <Button size="small" icon={<PlusOutlined />} onClick={() => setDims([...dims, { name: '', label: '', weight: 0 } as Dimension])}>添加</Button>
            </div>
            {dims.map((dim, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <Input size="small" style={{ width: 100 }} placeholder="标识" value={dim.name}
                  onChange={(e) => { const next = [...dims]; next[i] = { name: e.target.value, label: dim.label, weight: dim.weight }; setDims(next) }} />
                <Input size="small" style={{ width: 80 }} placeholder="显示名" value={dim.label}
                  onChange={(e) => { const next = [...dims]; next[i] = { name: dim.name, label: e.target.value, weight: dim.weight }; setDims(next) }} />
                <InputNumber size="small" style={{ width: 60 }} placeholder="权重" value={dim.weight} min={0} max={1} step={0.1}
                  onChange={(v) => { const next = [...dims]; next[i] = { name: dim.name, label: dim.label, weight: v || 0 }; setDims(next) }} />
                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => setDims(dims.filter((_, j) => j !== i))} />
              </div>
            ))}
            {dims.length > 0 && <Text type="secondary" style={{ fontSize: 11 }}>权重: {dims.reduce((s, d) => s + d.weight, 0).toFixed(1)}</Text>}
          </div>
        </div>
      </Modal>
    </div>
  )
}
