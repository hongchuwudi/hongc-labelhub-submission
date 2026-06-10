/**
 * Review/index.tsx — 人工审核工作台
 * Author: hongchuwudi
 * Description: 终审/复审双视角 + AI分组侧栏 + 对比视图 + 移动端适配
 */
import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Button, Tag, message, Modal, Input, Tabs, Segmented, Drawer, Checkbox } from 'antd'
import { SettingOutlined, ExportOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store'
import {
  getTaskApi, listResultsApi, reviewResultApi, batchReviewApi, listAuditLogsApi, submitResultApi, getMyStatsApi,
  type LabelResultItem, type AuditLogEntry, type TaskListItem, type LabelerStats,
} from '@/api/tasks'
import { listAgentsApi, type AiAgentItem } from '@/api/ai-agents'
import ReviewList from './components/ReviewList'
import ReviewDetail from './components/ReviewDetail'

const { TextArea } = Input
type AiGroup = 'pass' | 'reject' | 'human'

function ReviewWorkbench({ mode }: { mode: 'review' | 'final_review' }) {
  const { taskId } = useParams<{ taskId: string }>()
  const tid = Number(taskId)
  const navigate = useNavigate()
  const role = useAppStore((s) => s.user?.role)
  const isReviewer = role === 'reviewer'

  const [task, setTask] = useState<TaskListItem | null>(null)
  const [allResults, setAllResults] = useState<LabelResultItem[]>([])
  const [selected, setSelected] = useState<LabelResultItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [agents, setAgents] = useState<AiAgentItem[]>([])
  const [reviewerStats, setReviewerStats] = useState<LabelerStats | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState<'approve' | 'reject' | 'batch_approve' | 'batch_reject' | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [aiGroup, setAiGroup] = useState<AiGroup>('pass')
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { const h = () => setMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])

  useEffect(() => {
    if (!tid) return
    ;(async () => {
      setLoading(true)
      try {
        const [tRes, rRes] = await Promise.all([getTaskApi(tid), listResultsApi(tid)])
        setTask(tRes.data)
        const list = rRes.data || []
        setAllResults(list)
        const selectable = list.filter(r => r.status !== 'submitted')
        if (selectable.length > 0) setSelected(selectable[0] ?? null)
      } catch { message.error('加载失败') }
      finally { setLoading(false) }
    })()
    listAgentsApi(1, 50).then(r => setAgents(r.data.items)).catch(() => {})
    listAuditLogsApi(tid).then(r => setAuditLogs(r.data || [])).catch(() => {})
    getMyStatsApi(tid).then(r => setReviewerStats(r.data)).catch(() => {})
  }, [tid])

  const refresh = async () => {
    try {
      const rRes = await listResultsApi(tid)
      setAllResults(rRes.data || [])
      if (selected) { const u = (rRes.data || []).find(r => r.id === selected.id); setSelected(u || null) }
    } catch {}
  }

  const reviewable = allResults.filter(r => r.status === mode || r.status === 'rejected')
  const aiPass = reviewable.filter(r => (r.ai_scores as Record<string,unknown>)?.verdict === 'pass')
  const aiReject = reviewable.filter(r => r.status === 'rejected' || (r.ai_scores as Record<string,unknown>)?.verdict === 'reject')
  const aiHuman = reviewable.filter(r => (r.ai_scores as Record<string,unknown>)?.verdict === 'human_review')
  const visible = aiGroup === 'pass' ? aiPass : aiGroup === 'reject' ? aiReject : aiHuman
  const counts = { pass: aiPass.length, reject: aiReject.length, human: aiHuman.length }

  const handleBatch = async () => {
    if (!modalOpen || selectedIds.size === 0) return
    const target = modalOpen === 'batch_approve' ? 'final_review' : 'rejected'
    if (target === 'rejected' && !reviewComment.trim()) { message.error('驳回须填写理由'); return }
    setSubmitting(true)
    try {
      const res = await batchReviewApi(tid, [...selectedIds], target, reviewComment)
      message.success(`已处理 ${res.data.reviewed} 条` + (res.data.errors.length ? `, ${res.data.errors.length} 条失败` : ''))
      setModalOpen(null); setReviewComment(''); setSelectedIds(new Set()); refresh()
      listAuditLogsApi(tid).then(r => setAuditLogs(r.data || [])).catch(() => {})
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '失败') }
    finally { setSubmitting(false) }
  }

  const handleSingleApprove = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      const target = mode === 'review' ? 'final_review' : 'warehouse'
      await reviewResultApi(tid, selected.id, target, '')
      message.success(mode === 'review' ? '复审通过→终审' : '终审通过→入库')
      setSelectedIds(prev => { prev.delete(selected.id); return new Set(prev) })
      refresh(); listAuditLogsApi(tid).then(r => setAuditLogs(r.data || [])).catch(() => {})
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '失败') }
    finally { setSubmitting(false) }
  }

  const handleSingleReject = async (comment: string) => {
    if (!selected) return
    setSubmitting(true)
    try {
      await reviewResultApi(tid, selected.id, 'rejected', comment)
      message.success('已驳回')
      setSelectedIds(prev => { prev.delete(selected.id); return new Set(prev) })
      refresh(); listAuditLogsApi(tid).then(r => setAuditLogs(r.data || [])).catch(() => {})
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '失败') }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (newData: Record<string, unknown>) => {
    if (!selected) return
    await submitResultApi(tid, { item_id: selected.item_id, data: newData, round: (selected.round || 1) + 1 })
    message.success('修订已提交'); refresh()
    listAuditLogsApi(tid).then(r => setAuditLogs(r.data || [])).catch(() => {})
  }

  const currentAgent = agents.length > 0 ? agents[0] : null

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: '#9ca3af' }}>加载中...</div>
  if (!task) return <div style={{ padding: 80, textAlign: 'center', color: '#9ca3af' }}>任务不存在</div>

  // 侧栏内容
  const sidebarContent = (
    <>
      <Tabs activeKey={aiGroup} onChange={v => setAiGroup(v as AiGroup)} size="small" style={{ padding: '4px 12px 0' }}
        items={[
          { key: 'pass', label: <span style={{ color: aiGroup === 'pass' ? '#10b981' : undefined }}>✓ 建议通过 ({counts.pass})</span> },
          { key: 'reject', label: <span style={{ color: aiGroup === 'reject' ? '#ef4444' : undefined }}>✗ 建议打回 ({counts.reject})</span> },
          { key: 'human', label: <span style={{ color: aiGroup === 'human' ? '#f59e0b' : undefined }}>⚠ 转人工 ({counts.human})</span> },
        ]} />
      {selectedIds.size > 0 && (
        <div style={{ padding: '4px 12px', display: 'flex', gap: 6, alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>已选 {selectedIds.size} 条</span>
          <Button size="small" type="primary" onClick={() => { setReviewComment(''); setModalOpen('batch_approve') }}>批量通过</Button>
          <Button size="small" danger onClick={() => { setReviewComment(''); setModalOpen('batch_reject') }}>批量打回</Button>
          <Button size="small" onClick={() => setSelectedIds(new Set())}>取消</Button>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
        {visible.map(r => {
          const ai = r.ai_scores as Record<string,unknown> | null
          const vc = (ai?.verdict as string) === 'reject' ? '#ef4444' : '#10b981'
          return (
            <div key={r.id}
              onClick={() => { setSelected(r); if (mobile) setSidebarOpen(false) }}
              style={{ marginBottom: 4, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, border: selected?.id === r.id ? '2px solid #4f46e5' : '1px solid #f0f0f0', background: selected?.id === r.id ? '#eef2ff' : '#fff', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <Checkbox checked={selectedIds.has(r.id)}
                onChange={() => setSelectedIds(prev => { const n = new Set(prev); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n })}
                style={{ marginTop: 3, flexShrink: 0 }} onClick={e => e.stopPropagation()} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>SUB-{String(tid).padStart(4,'0')}-{String(r.id).padStart(3,'0')}</span>
                  {ai?.overall_score != null && <span style={{ fontSize: 15, fontWeight: 800, color: (ai.overall_score as number) >= 70 ? '#10b981' : '#ef4444' }}>{ai.overall_score as number}</span>}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>标注员 #{r.labeler_id}</span>
                  <Tag color={vc} style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>{(ai?.verdict as string) === 'reject' ? '建议打回' : '建议通过'}</Tag>
                  {r.round > 1 && <Tag color="orange" style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>第{r.round}轮</Tag>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 57px)', margin: '-28px -32px', background: '#f0f2f5' }}>
      {/* 顶部 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: mobile ? '6px 10px' : '8px 20px', background: '#fff', borderBottom: '1px solid #e8e8e8', flexShrink: 0, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Button type="text" size="small" onClick={() => navigate('/review')}>←</Button>
          {!mobile && <><span style={{ fontWeight: 700, color: '#4f46e5', fontSize: 13 }}>LabelHub</span><span style={{ color: '#d9d9d9' }}>/</span><span style={{ fontSize: 12, color: '#6b7280' }}>审核与质检</span><span style={{ color: '#d9d9d9' }}>/</span><span style={{ fontSize: 12, color: '#1a1a2e' }}>人工审核</span><span style={{ color: '#d9d9d9' }}>/</span></>}
          <span style={{ fontSize: 13, fontWeight: 600, color: '#4f46e5' }}>{task.title}</span>
          <Segmented size="small" value={mode} onChange={v => navigate(`/review/${tid}${v === 'final_review' ? '/final' : ''}`)}
            options={[{ label: '复审', value: 'review' }, { label: '终审', value: 'final_review' }]} />
          {mobile && <Button size="small" onClick={() => setSidebarOpen(true)}>任务列表</Button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {role === 'owner' && <Button size="small" icon={<ExportOutlined />}>导出审核日志</Button>}
          {currentAgent && <Tag style={{ margin: 0 }}>{currentAgent.name}</Tag>}
          {role === 'owner' && <Button size="small" icon={<SettingOutlined />} onClick={() => navigate('/ai-configs')}>规则配置</Button>}
          <span style={{ fontSize: 12, color: '#6b7280' }}>{role === 'owner' ? '管理员' : '审核员'}</span>
        </div>
      </div>

      {/* 主体 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, flexDirection: mobile ? 'column' : 'row' }}>
        {/* 桌面左侧 */}
        {!mobile && <div style={{ width: 280, flexShrink: 0, background: '#fff', borderRight: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>{sidebarContent}</div>}
        {/* 移动抽屉 */}
        {mobile && <Drawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} placement="left" width={300} styles={{ body: { padding: 0 } }}>{sidebarContent}</Drawer>}

        {selected ? (
          <ReviewDetail result={selected} allResults={allResults} auditLogs={auditLogs} stats={mobile ? null : reviewerStats} isReviewer={isReviewer} mobile={mobile}
            onApprove={handleSingleApprove} onReject={handleSingleReject} onEdit={handleEdit} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>选择左侧任务开始审核</div>
        )}
      </div>

      <Modal title={modalOpen?.includes('approve') ? `确认${modalOpen === 'batch_approve' ? ` (${selectedIds.size}条)` : ''}` : `驳回${modalOpen === 'batch_reject' ? ` (${selectedIds.size}条)` : ''}`}
        open={!!modalOpen} onOk={handleBatch} onCancel={() => setModalOpen(null)} confirmLoading={submitting}
        okText={modalOpen?.includes('approve') ? '通过' : '驳回'} okButtonProps={{ danger: modalOpen?.includes('reject') }}>
        {modalOpen?.includes('reject') && <div><p style={{ color: '#6b7280', fontSize: 13 }}>驳回理由（必填）</p><TextArea rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="请填写驳回原因..." /></div>}
        {modalOpen?.includes('approve') && <p style={{ color: '#6b7280', fontSize: 13 }}>确认通过？通过后进入入库状态。</p>}
      </Modal>
    </div>
  )
}

function ReviewWorkbenchRouter() {
  const loc = useLocation()
  const segments = loc.pathname.split('/').filter(Boolean)
  const mode: 'review' | 'final_review' = segments.length >= 3 && segments[2] === 'final' ? 'final_review' : 'review'
  return <ReviewWorkbench mode={mode} />
}

/** 审核与质检路由入口 */
export default function Review() {
  return (
    <Routes>
      <Route index element={<ReviewList />} />
      <Route path=":taskId" element={<ReviewWorkbenchRouter />} />
      <Route path=":taskId/final" element={<ReviewWorkbenchRouter />} />
    </Routes>
  )
}
