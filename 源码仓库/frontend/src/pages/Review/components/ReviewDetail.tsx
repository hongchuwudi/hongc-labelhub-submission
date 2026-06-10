/**
 * ReviewDetail.tsx — 人工审核详情面板
 * Author: hongchuwudi
 */
import { useState } from 'react'
import { Tag, Button, Select, message, Modal, Input, Progress } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, EditOutlined, RobotOutlined, FormOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import type { LabelResultItem, AuditLogEntry, LabelerStats } from '@/api/tasks'
import type { AiScoreData } from '@/types/models/ai'
import { AuditTimeline } from '@/components/StatusFlow'
dayjs.extend(utc)

/** 审核详情面板组件 */
export default function ReviewDetail({ result, allResults, auditLogs, stats, isReviewer, mobile, onApprove, onReject, onEdit }: {
  result: LabelResultItem
  allResults: LabelResultItem[]
  auditLogs: AuditLogEntry[]
  stats: LabelerStats | null
  isReviewer: boolean
  mobile?: boolean
  onApprove: () => void
  onReject: (comment: string) => void
  onEdit: (newData: Record<string, unknown>) => Promise<void>
}) {
  const itemRounds = allResults.filter(r => r.item_id === result.item_id).sort((a, b) => a.round - b.round)
  const prevRound = itemRounds.find(r => r.round === result.round - 1)
  const hasPrev = prevRound != null
  const ai = result.ai_scores as AiScoreData | null
  const prevAi = prevRound?.ai_scores as AiScoreData | null
  const canReview = isReviewer && (result.status === 'review' || result.status === 'final_review')

  const [fontSize, setFontSize] = useState(12)
  const [prevFontSize, setPrevFontSize] = useState(11)
  const [editOpen, setEditOpen] = useState(false)
  const [editJson, setEditJson] = useState('')
  const [editing, setEditing] = useState(false)
  const [reviewComment, setReviewComment] = useState('')

  // 当前项的审计日志
  const itemLogs = auditLogs.filter(l => l.entity_type === 'LabelResult' && itemRounds.some(r => r.id === l.entity_id))

  const handleOpenEdit = () => { setEditJson(JSON.stringify(result.data, null, 2)); setEditOpen(true) }
  const handleEditSubmit = async () => {
    try { const parsed = JSON.parse(editJson); setEditing(true); await onEdit(parsed); message.success('修订已提交'); setEditOpen(false) }
    catch { message.error('JSON 格式错误') }
    finally { setEditing(false) }
  }

  const handleReject = () => {
    if (!reviewComment.trim()) { message.error('驳回必须填写理由'); return }
    onReject(reviewComment)
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
      {/* ═══ 中间主区域 ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 头部 */}
        <div style={{ padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e8e8e8', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#9ca3af' }}>条目 #{result.item_id}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>第 {result.round} 轮</span>
            {hasPrev && <Tag color="error">上轮已打回</Tag>}
            <span style={{ fontSize: 12, color: '#6b7280' }}>标注员 #{result.labeler_id} | {dayjs.utc(result.created_at).local().format('MM/DD HH:mm')}</span>
          </div>
          {ai?.verdict && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 8, fontWeight: 700, fontSize: 13,
              background: ai.verdict === 'reject' ? '#fef2f2' : '#ecfdf5', border: `1.5px solid ${ai.verdict === 'reject' ? '#ef4444' : '#10b981'}`,
              color: ai.verdict === 'reject' ? '#ef4444' : '#10b981' }}>
              <RobotOutlined /> AI 评分: {ai.overall_score != null ? Math.round(ai.overall_score) : '-'}
            </div>
          )}
        </div>

        {/* 滚动内容 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f5f5f8' }}>
          {/* === 对比区 === */}
          {hasPrev && prevRound && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, background: '#fff', borderRadius: 8, border: '1px solid #fecaca', overflow: 'hidden' }}>
                <div style={{ padding: '6px 12px', background: '#fef2f2', fontSize: 12, fontWeight: 600, color: '#ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><CloseCircleOutlined /> 第 {prevRound.round} 轮（已打回）{prevAi?.overall_score != null ? ` · AI ${Math.round(prevAi.overall_score)}分` : ''}</span>
                  <Select size="small" value={prevFontSize} onChange={setPrevFontSize} options={[10, 11, 12, 13, 14, 16].map(n => ({ value: n, label: `${n}px` }))} style={{ width: 68 }} popupMatchSelectWidth={false} />
                </div>
                <div style={{ padding: 10, maxHeight: 240, overflow: 'auto' }}>
                  <pre style={{ margin: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: prevFontSize, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#374151' }}>{JSON.stringify(prevRound.data, null, 2)}</pre>
                </div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: 8, border: '2px solid #4f46e5', overflow: 'hidden' }}>
                <div style={{ padding: '6px 12px', background: '#eef2ff', fontSize: 12, fontWeight: 600, color: '#4f46e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><FormOutlined /> 第 {result.round} 轮（修改后）</span>
                  <Select size="small" value={fontSize} onChange={setFontSize} options={[10, 11, 12, 13, 14, 16].map(n => ({ value: n, label: `${n}px` }))} style={{ width: 68 }} popupMatchSelectWidth={false} />
                </div>
                <div style={{ padding: 10, maxHeight: 240, overflow: 'auto', background: '#fafbfc' }}>
                  {ai?.overall_score != null && prevAi?.overall_score != null && ai.overall_score > prevAi.overall_score && (
                    <div style={{ fontSize: 11, color: '#10b981', marginBottom: 6 }}>AI 评分提升 +{Math.round(ai.overall_score - prevAi.overall_score)}</div>
                  )}
                  <pre style={{ margin: 0, fontFamily: '"JetBrains Mono", monospace', fontSize, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#1a1a2e' }}>{JSON.stringify(result.data, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
          {!hasPrev && (
            <div style={{ marginBottom: 16, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: '#eef2ff', fontSize: 12, fontWeight: 600, color: '#4f46e5', display: 'flex', justifyContent: 'space-between' }}>
                <span><FormOutlined /> 第 {result.round} 轮提交</span>
                <Select size="small" value={fontSize} onChange={setFontSize} options={[10, 11, 12, 13, 14, 16].map(n => ({ value: n, label: `${n}px` }))} style={{ width: 68 }} popupMatchSelectWidth={false} />
              </div>
              <div style={{ padding: 12, maxHeight: 320, overflow: 'auto', background: '#fafbfc' }}>
                <pre style={{ margin: 0, fontFamily: '"JetBrains Mono", monospace', fontSize, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#1a1a2e' }}>{JSON.stringify(result.data, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* === AI 评语 + 维度评分 === */}
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8', padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}><RobotOutlined /> AI 预审摘要</div>
            {ai?.dimensions && ai.dimensions.length > 0 ? (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {ai.dimensions.map((d, i) => {
                  const pct = Math.round(d.score * 100)
                  return (
                    <div key={i} style={{ flex: '1 1 180px', minWidth: 140 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span>{d.name}</span><span style={{ fontWeight: 600, color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444' }}>{pct}%</span>
                      </div>
                      <Progress percent={pct} size="small" showInfo={false} strokeColor={pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'} />
                    </div>
                  )
                })}
                <div style={{ flex: '1 1 100px', minWidth: 100, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>综合</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: (ai.overall_score || 0) >= 70 ? '#10b981' : '#ef4444' }}>
                    {ai.overall_score != null ? Math.round(ai.overall_score) : '-'}
                  </div>
                </div>
              </div>
            ) : <div style={{ color: '#9ca3af', textAlign: 'center', padding: 16 }}>暂无 AI 评分</div>}
            {ai?.summary && <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: '#f9fafb', fontSize: 13, lineHeight: 1.8, color: '#374151' }}>{ai.summary}</div>}
            {prevRound?.comment && (
              <div style={{ marginTop: 10, padding: '6px 10px', borderRadius: 6, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 12, color: '#c2410c' }}>
                上轮驳回: {prevRound.comment}
              </div>
            )}
          </div>

          {/* === Prompt + 日志 === */}
          <div style={{ marginBottom: 16, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8', padding: '10px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>审核 Prompt 模板</div>
            <pre style={{ padding: 10, borderRadius: 6, background: '#fafbfc', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200, overflow: 'auto', color: '#374151' }}>{ai?.prompt_template || '无'}</pre>
          </div>
          <div style={{ marginBottom: 16, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8', padding: '10px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>处理日志 ({itemLogs.length})</div>
            <AuditTimeline entries={itemLogs} maxHeight={200} />
          </div>
        </div>

        {/* === 底部操作区 === */}
        {isReviewer && (
          <div style={{ padding: '12px 20px', background: '#fff', borderTop: '2px solid #e8e8e8', flexShrink: 0 }}>
            {/* 核查意见 */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} placeholder="核查意见（选填）" value={reviewComment}
                onChange={e => setReviewComment(e.target.value)} disabled={!canReview}
                style={{ flex: 1 }} />
            </div>
            {/* 标签 + 按钮 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['关键词缺失', '类目错误', '格式问题', '数据不完整'].map(tag =>
                  <Button key={tag} size="small" disabled={!canReview} style={{ fontSize: 11 }}
                    onClick={() => setReviewComment(prev => prev ? prev + '; ' + tag : tag)}>{tag}</Button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button size="large" icon={<CloseCircleOutlined />} onClick={handleReject} disabled={!canReview}
                  style={{ background: '#fff7ed', borderColor: '#fdba74', color: '#ea580c', fontWeight: 600 }}>打回</Button>
                <Button size="large" icon={<EditOutlined />} onClick={handleOpenEdit} disabled={!canReview}
                  style={{ background: '#fefce8', borderColor: '#fde047', color: '#ca8a04', fontWeight: 600 }}>直接修订</Button>
                <Button size="large" type="primary" icon={<CheckCircleOutlined />} onClick={onApprove} disabled={!canReview}
                  style={{ fontWeight: 600 }}>通过 → {result.status === 'final_review' ? '入库' : '终审'}</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ 右侧统计面板（移动端隐藏） ═══ */}
      {!mobile && (
      <div style={{ width: 220, flexShrink: 0, borderLeft: '1px solid #e8e8e8', background: '#fafafa', overflowY: 'auto', padding: 14 }}>
        {stats && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>审核统计</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <StatCard label="待标注" value={stats.pending} color="#9ca3af" />
              <StatCard label="审核中" value={stats.in_review} color="#3b82f6" />
              <StatCard label="需修改" value={stats.rejected} color="#ef4444" />
              <StatCard label="已归档" value={stats.done} color="#10b981" />
            </div>
          </>
        )}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>审计时间线</div>
        <AuditTimeline entries={itemLogs} maxHeight={400} />
      </div>
      )}
      <Modal title="直接修订" open={editOpen} onOk={handleEditSubmit} onCancel={() => setEditOpen(false)} confirmLoading={editing} okText="提交修订" width={600}>
        <Input.TextArea rows={15} value={editJson} onChange={e => setEditJson(e.target.value)} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }} />
      </Modal>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return <div style={{ padding: '8px 10px', borderRadius: 6, background: '#fff', border: '1px solid #f0f0f0', textAlign: 'center' }}>
    <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 10, color: '#9ca3af' }}>{label}</div>
  </div>
}
