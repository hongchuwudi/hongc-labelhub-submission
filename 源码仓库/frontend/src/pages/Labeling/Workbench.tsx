/** Workbench.tsx — 标注工作台
 * Author: hongchuwudi
 * Description: 三栏布局：左侧条目队列 + 中间标注表单 + 右侧统计面板，含提交/跳过/草稿保存
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { App, Alert, Empty, Button } from 'antd'
import { useAppStore } from '@/store'
import {
  listTaskItemsApi,
  skipTaskItemApi,
  listMyResultsApi,
  getMyStatsApi,
  submitResultApi,
  listAuditLogsApi,
  type AuditLogEntry,
  type TaskItemResponse,
  type TaskItemDetail,
  type LabelerStats,
  type LabelResultItem,
} from '@/api/tasks'
import { getTaskApi, type TaskListItem } from '@/api/tasks'
import { getSchemaApi } from '@/api/schemas'
import type { FieldDef, SchemaField } from '@/types/models/field'
import { ItemQueue } from './components/ItemQueue'
import { WorkArea } from './components/WorkArea'
import { BottomBar } from './components/BottomBar'
import { MetaPanel } from './components/MetaPanel'

// ── 常量 ──

/** localStorage 草稿键名前缀 */
const DRAFT_PREFIX = 'labelhub_draft_'

// ── 主组件 ──

/** 标注工作台主组件 */
export default function Workbench() {
  const { taskId } = useParams<{ taskId: string }>()
  const tid = Number(taskId)
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const { message } = App.useApp()

  // ── 核心状态 ──
  const [task, setTask] = useState<TaskListItem | null>(null)
  const [items, setItems] = useState<TaskItemResponse[]>([])
  const [schemaDesign, setSchemaDesign] = useState<{
    tabs?: { id: string; title: string; fieldIds: string[]; groupIds: string[] }[];
    groups?: { id: string; title: string; fieldIds: string[] }[];
    fields?: SchemaField[];
  } | null>(null)
  const [stats, setStats] = useState<LabelerStats | null>(null)
  const [myResults, setMyResults] = useState<LabelResultItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [currentDetail, setCurrentDetail] = useState<TaskItemResponse | null>(null)
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const initRef = useRef(false)

  // 用 ref 存 formValues 最新值供 autoSave 使用
  const formRef = useRef(formValues)
  useEffect(() => { formRef.current = formValues }, [formValues])

  // ── 解析 Schema 字段列表（提升到顶层供校验使用）──
  const parsedFields: FieldDef[] = useMemo(() => {
    const raw = schemaDesign?.fields
    if (!raw) return []
    if (Array.isArray(raw)) return raw as FieldDef[]
    if (Array.isArray(raw)) return raw as FieldDef[]

    const obj = raw as unknown as Record<string, unknown>

    // SchemaDesign 格式: { fields: [...], groups: [...], tabs: [...] }
    if (Array.isArray(obj.fields)) {
      return (obj.fields as SchemaField[]).map((f) => ({
        id: f.id || f.key,
        key: f.key,
        title: f.title || f.key,
        type: f.type || 'text',
        required: !!f.required,
        options: f.options,
        multiple: f.multiple,
        placeholder: f.placeholder || '',
        maxLength: f.maxLength || (f.rules?.find((r: { type: string; value?: string | number; message: string }) => r.type === 'maxLength')?.value as number | undefined),
        rows: f.rows,
        accept: f.accept,
        maxCount: f.maxCount,
        rules: f.rules,
        linkage: f.linkage,
      }))
    }

    // JSON Schema 格式: { type: "object", properties: { ... } }
    if (!obj.properties) return []
    const required: string[] = (obj.required as string[]) || []
    return Object.entries(obj.properties as Record<string, unknown>).map(([key, prop]) => {
      const p = prop as { title?: string; type?: string; enum?: string[]; format?: string; maxLength?: number; description?: string }
      const hasEnum = Array.isArray(p.enum)
      return {
        id: key, key,
        title: p.title || key,
        type: hasEnum ? 'radio'
          : p.type === 'array' ? 'select'
          : p.type === 'boolean' ? 'radio'
          : p.format === 'textarea' || (typeof p.maxLength === 'number' && p.maxLength > 200) ? 'textarea'
          : 'text',
        required: required.includes(key),
        options: hasEnum ? p.enum!.map((v: string) => ({ label: v, value: v })) : undefined,
        multiple: p.type === 'array',
        placeholder: p.description || '',
        maxLength: typeof p.maxLength === 'number' ? p.maxLength : undefined,
      }
    })
  }, [schemaDesign])

  // ── 切换到指定条目（使用预加载数据）──
  const loadDetail = useCallback((item: TaskItemResponse) => {
    setCurrentDetail(item)
    const key = `${DRAFT_PREFIX}${tid}_${item.id}`
    const draft = localStorage.getItem(key)
    if (draft) {
      try { setFormValues(JSON.parse(draft)) } catch { setFormValues({}) }
    } else if (item.last_result) {
      setFormValues(item.last_result.data as Record<string, unknown>)
    } else {
      setFormValues({})
    }
  }, [tid])

  // ── 初始化加载 ──
  useEffect(() => {
    if (!tid || !user) return
    if (initRef.current) return
    initRef.current = true
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [t, it, st, rs, al] = await Promise.all([
          getTaskApi(tid).catch(() => null),
          listTaskItemsApi(tid).catch(() => ({ data: [] })),
          getMyStatsApi(tid).catch(() => null),
          listMyResultsApi(tid).catch(() => ({ data: [] as LabelResultItem[] })),
          listAuditLogsApi(tid, 200).catch(() => ({ data: [] as AuditLogEntry[] })),
        ])
        if (cancelled) return
        if (t) {
          setTask(t.data)
          // 检查是否无权限：任务存在但 items 为空且非 owner
          const isOwner = t.data.owner_id === user.id
          const itemList = Array.isArray(it?.data) ? it.data : []
          if (!isOwner && itemList.length === 0) {
            setAccessDenied(true)
            setLoading(false)
            return
          }
          // 优先使用任务快照，兼容旧数据无快照时回退实时查询
          const snap = t.data.schema_snapshot
          if (snap) {
            setSchemaDesign(snap as typeof schemaDesign)
          } else {
            getSchemaApi(t.data.schema_id)
              .then((sc) => { if (!cancelled) { setSchemaDesign(sc.data.schema) } })
              .catch(() => {})
          }
        }
        if (st) setStats(st.data)
        if (Array.isArray(rs.data)) setMyResults(rs.data)
        if (Array.isArray(al.data)) setAuditLogs(al.data)

        const list = Array.isArray(it?.data) ? it.data : []
        setItems(list)
        const firstPending = list.findIndex((i: TaskItemResponse) => i.status === 'pending')
        const startIdx = firstPending >= 0 ? firstPending : 0
        setCurrentIdx(startIdx)
        if (list.length > 0) {
          loadDetail(list[startIdx]!)
        }
      } catch {
        if (!cancelled) message.error('加载失败，请刷新重试')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true; initRef.current = false }
  }, [tid])

  useEffect(() => {
    if (!tid || !currentDetail) return
    const timer = setInterval(async () => {
      const key = 'labelhub_draft_' + String(tid) + '_' + String(currentDetail.id)
      const vals = formRef.current
      if (vals && Object.keys(vals).length > 0) {
        localStorage.setItem(key, JSON.stringify(vals))
      }
      try {
        const [t, it] = await Promise.all([
          getTaskApi(tid).catch(() => null),
          listTaskItemsApi(tid).catch(() => ({ data: [] as TaskItemResponse[] })),
        ])
        if (t) setTask(t.data)
        if (Array.isArray(it.data)) setItems(it.data)
      } catch { /* silent */ }
    }, 60000)
    return () => clearInterval(timer)
  }, [tid, currentDetail?.id])

  // ── 草稿自动保存（3s 防抖）──
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (!currentDetail) return
    const key = `${DRAFT_PREFIX}${tid}_${currentDetail.id}`
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (Object.keys(formRef.current).length > 0) {
        localStorage.setItem(key, JSON.stringify(formRef.current))
        setDraftSaved(true)
      }
    }, 3000)
    return () => clearTimeout(saveTimer.current)
  }, [formValues, currentDetail?.id])

  // ── 切换条目 ──
  const goTo = (idx: number) => {
    if (idx < 0 || idx >= items.length) return
    if (currentDetail && Object.keys(formValues).length > 0) {
      localStorage.setItem(`${DRAFT_PREFIX}${tid}_${currentDetail.id}`, JSON.stringify(formValues))
    }
    setCurrentIdx(idx)
    loadDetail(items[idx]!)
  }

  // ── 提交 ──
  const handleSubmit = async () => {
    if (!user || !currentDetail) return
    // 表单校验
    const errors: string[] = []
    for (const f of parsedFields) {
      if (f.type === 'showitem') continue
      const val = formValues[f.key]
      const strVal = typeof val === 'string' ? val : ''

      // 必填
      if (f.required && !val) {
        errors.push(`[${f.title || f.key}] 为必填项`)
        continue
      }
      if (!val) continue

      // 自定义规则
      if (f.rules) {
        for (const rule of f.rules) {
          if (rule.type === 'minLength' && strVal.length < (Number(rule.value) || 0)) {
            errors.push(`[${f.title || f.key}] ${rule.message || `最少 ${rule.value} 个字符`}`)
          }
          if (rule.type === 'maxLength' && strVal.length > (Number(rule.value) || 99999)) {
            errors.push(`[${f.title || f.key}] ${rule.message || `最多 ${rule.value} 个字符`}`)
          }
          if (rule.type === 'pattern' && rule.value && !new RegExp(rule.value as string, 'u').test(strVal)) {
            errors.push(`[${f.title || f.key}] ${rule.message || '格式不正确'}`)
          }
        }
      }
      // 内联 maxLength
      if (f.maxLength && strVal.length > f.maxLength) {
        errors.push(`[${f.title || f.key}] 最多 ${f.maxLength} 个字符`)
      }
    }
    if (errors.length > 0) {
      message.error(errors.join('；'), 5)
      return
    }

    setSubmitting(true)
    try {
      const lastStatus = currentDetail?.last_result?.status
      const round = lastStatus === 'rejected' ? (currentDetail?.last_result?.round || 1) + 1 : 1
      await submitResultApi(tid, {
        item_id: currentDetail.id,
        data: formValues as Record<string, unknown>,
        round,
      })
      localStorage.removeItem(`${DRAFT_PREFIX}${tid}_${currentDetail.id}`)
      setDraftSaved(false)
      message.success('提交成功')
      // 刷新任务 + 列表 + 统计 + 结果
      const updatedTask = await getTaskApi(tid).catch(() => null)
      if (updatedTask) setTask(updatedTask.data)
      refreshSideData()
      // 移到下一个 pending
      const updatedItems = (await listTaskItemsApi(tid)).data || []
      setItems(updatedItems)
      const nextPending = updatedItems.findIndex((i, idx) => idx > currentIdx && i.status === 'pending')
      if (nextPending >= 0) goTo(nextPending)
      else {
        const firstPending = updatedItems.findIndex((i) => i.status === 'pending')
        if (firstPending >= 0) goTo(firstPending)
      }
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '提交失败') }
    finally { setSubmitting(false) }
  }

  // ── 跳过 ──
  const handleSaveDraft = () => {
    if (!currentDetail || Object.keys(formValues).length === 0) return
    const key = `${DRAFT_PREFIX}${tid}_${currentDetail.id}`
    localStorage.setItem(key, JSON.stringify(formValues))
    setDraftSaved(true)
    message.success('草稿已保存')
  }

  const handleSkip = async () => {
    if (!currentDetail) return
    setSkipping(true)
    try {
      await skipTaskItemApi(tid, currentDetail.id)
      localStorage.removeItem(`${DRAFT_PREFIX}${tid}_${currentDetail.id}`)
      message.success('已跳过')
      const updatedTask = await getTaskApi(tid).catch(() => null)
      if (updatedTask) setTask(updatedTask.data)
      refreshSideData()
      const updatedItems = (await listTaskItemsApi(tid)).data || []
      setItems(updatedItems)
      const nextPending = updatedItems.findIndex((i, idx) => idx > currentIdx && i.status === 'pending')
      if (nextPending >= 0) goTo(nextPending)
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '操作失败') }
    finally { setSkipping(false) }
  }

  // ── 刷新统计数据 ──
  const refreshSideData = async () => {
    const [st, rs, al] = await Promise.all([
      getMyStatsApi(tid).catch(() => null),
      listMyResultsApi(tid).catch(() => ({ data: [] as LabelResultItem[] })),
      listAuditLogsApi(tid, 200).catch(() => ({ data: [] as AuditLogEntry[] })),
    ])
    if (st) setStats(st.data)
    if (Array.isArray(rs.data)) setMyResults(rs.data)
    if (Array.isArray(al.data)) setAuditLogs(al.data)
  }

  // ── 移动端检测 ──
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  // ── loading / 权限 ──
  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center', color: '#9ca3af' }}>加载中...</div>
  }
  if (accessDenied) {
    const isFirstCome = task?.distribution_strategy === 'first_come'
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', minHeight: 400,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: '#fef2f2',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20, fontSize: 32,
          }}>
            <span style={{ opacity: 0.4 }}>!</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>
            无权访问该任务
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.8 }}>
            {isFirstCome
              ? '该任务已被其他标注员抢先认领，看看其他任务吧'
              : '你需要先在任务大厅认领此任务，才能进入标注工作台'}
          </div>
          <Button type="primary" size="large" onClick={() => navigate('/labeling?tab=square')}>
            前往任务大厅
          </Button>
        </div>
      </div>
    )
  }
  if (!task) {
    return <div style={{ padding: 80, textAlign: 'center', color: '#9ca3af' }}>任务不存在</div>
  }

  const current = currentDetail
  const rejected = current?.last_result?.status === 'rejected'

  // ── 左侧面板宽度 ──
  const sidebarW = mobile ? '100%' : 260
  const rightW = mobile ? '100%' : 260

  // ── 渲染 ──
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100dvh - 57px)',
      margin: '-28px -32px',
      background: '#f5f5f8',
    }}>
      {/* ──── 主三栏 ──── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: mobile ? 'column' : 'row',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* ══ 左侧：条目队列 ══ */}
        <div style={{
          width: sidebarW,
          flexShrink: 0,
          borderRight: mobile ? 'none' : '1px solid #e5e7eb',
          background: '#fff',
          overflowY: 'auto',
          display: mobile ? 'none' : 'block',
        }}>
          <ItemQueue
            items={items}
            currentIdx={currentIdx}
            onSelect={goTo}
          />
        </div>

        {/* ══ 中间：核心操作区 ══ */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
          background: '#fff',
        }}>
          {/* 驳回提示 */}
          {rejected && (
            <Alert
              type="warning"
              showIcon
              closable
              message="该条目已被审核打回"
              description={current?.last_result?.comment || current?.last_result?.ai_scores?.summary || '请根据审核意见修改后重新提交'}
              style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid #fde68a' }}
            />
          )}

          {/* 表单区 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            {current ? (
              <>
                {/* 元信息条 */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 16, padding: '8px 14px',
                  background: '#f9fafb', borderRadius: 8, fontSize: 13, color: '#6b7280',
                  flexWrap: 'wrap', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: '#1f2937' }}>
                      {task?.title || '标注任务'} · 第 {currentIdx + 1} 题
                    </span>
                    {schemaDesign && <span>模板 · 题目ID #{current.id}</span>}
                    {task?.reward_per_item && (
                      <span style={{ color: '#f59e0b', fontWeight: 500 }}>
                        奖励 {task.reward_per_item} 元
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: draftSaved ? '#10b981' : '#9ca3af' }}>
                    {draftSaved ? '✓ 草稿已保存' : ''}
                  </span>
                </div>
                <WorkArea
                  item={current as unknown as TaskItemDetail}
                  fields={parsedFields}
                  schemaDesign={schemaDesign}
                  formValues={formValues}
                  onChange={(v) => setFormValues(v)}
                  taskId={tid}
                />
              </>
            ) : (
              <Empty description="请选择一条数据开始标注" style={{ marginTop: 80 }} />
            )}
          </div>

          {/* 底部操作栏 */}
          <BottomBar
            currentIdx={currentIdx}
            total={items.length}
            onPrev={() => goTo(currentIdx - 1)}
            onNext={() => goTo(currentIdx + 1)}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            onSaveDraft={handleSaveDraft}
            submitting={submitting}
            skipping={skipping}
            canSubmit={!!current && (!current.last_result || current.last_result.status === 'rejected')}
            hasDraft={Object.keys(formValues).length > 0}
          />
        </div>

        {/* ══ 右侧：统计 + 时间轴 ══ */}
        <div style={{
          width: rightW,
          flexShrink: 0,
          borderLeft: mobile ? 'none' : '1px solid #e5e7eb',
          background: '#fff',
          overflowY: 'auto',
          display: mobile ? 'none' : 'block',
        }}>
          <MetaPanel stats={stats} results={myResults} auditLogs={auditLogs} currentItem={current} />
        </div>
      </div>

      {/* ──── 移动端：底部 Tab ──── */}
      {mobile && (
        <div style={{
          display: 'flex', borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0,
        }}>
          {[
            { key: 'queue', label: `队列 (${items.length})` },
            { key: 'work', label: '标注' },
            { key: 'meta', label: '数据' },
          ].map((tab) => (
            <button key={tab.key}
              style={{
                flex: 1, height: 48, border: 'none', background: 'transparent',
                fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
