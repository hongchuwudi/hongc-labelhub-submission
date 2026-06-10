/**
 * ReviewMain.tsx — 右侧 AI 审核详情主区域
 * Author: hongchuwudi
 * Description: 4 区布局——头部元数据 + 内容/评分 + AI评语/Prompt + 处理日志
 */
import { useState } from 'react'
import { Tag, Button, message, Select } from 'antd'
import { ReloadOutlined, SettingOutlined, CheckCircleFilled, CloseCircleFilled, QuestionCircleFilled } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import type { AiReviewDetail } from '@/types/models/ai-review'
import { rerunAiReviewApi } from '@/api/ai-reviews'
import DimensionScores from './DimensionScores'
import ProcessLogs from './ProcessLogs'

const VERDICT_TAG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  pass: { color: '#10b981', label: 'AI 建议: 通过', icon: <CheckCircleFilled /> },
  reject: { color: '#ef4444', label: 'AI 建议: 打回', icon: <CloseCircleFilled /> },
  human_review: { color: '#f59e0b', label: 'AI 建议: 转人工', icon: <QuestionCircleFilled /> },
}

/** AI 审核详情主区域组件 */
export default function ReviewMain({ detail, onRerun }: {
  detail: AiReviewDetail
  onRerun: () => void
}) {
  const navigate = useNavigate()
  const [rerunning, setRerunning] = useState(false)

  const vConfig = detail.verdict ? VERDICT_TAG[detail.verdict] : null

  const handleRerun = async () => {
    setRerunning(true)
    try { await rerunAiReviewApi(detail.id); message.success('已重新投递'); onRerun() }
    catch { message.error('重跑失败') }
    finally { setRerunning(false) }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      {/* ══════ A. 头部元数据 ══════ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px', background: '#fff', borderBottom: '1px solid #e8e8e8', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>
            SUB-{String(detail.task_id).padStart(4, '0')}-{String(detail.id).padStart(5, '0')}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
            {detail.task_title || `任务 #${detail.task_id}`}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: '#6b7280' }}>
            <span>提交 {dayjs.utc(detail.created_at).local().format('MM/DD HH:mm')}</span>
            <span>标注员 #{detail.result_id}</span>
            <span>Agent {detail.agent_name}</span>
            {detail.agent_model && <Tag style={{ margin: 0, fontSize: 10 }}>{detail.agent_model}</Tag>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {vConfig && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, background: vConfig.color + '15',
              border: `1.5px solid ${vConfig.color}`, fontWeight: 700, fontSize: 13,
              color: vConfig.color,
            }}>
              {vConfig.icon} {vConfig.label}
              {detail.overall_score != null && <span style={{ marginLeft: 4 }}>({Math.round(detail.overall_score)})</span>}
            </div>
          )}
          {detail.status === 'failed' && (
            <Button size="small" icon={<ReloadOutlined />} loading={rerunning} onClick={handleRerun} danger>
              失败重跑
            </Button>
          )}
          <Button size="small" icon={<SettingOutlined />} onClick={() => navigate('/ai-configs')}>规则配置</Button>
        </div>
      </div>

      {/* ══════ 内容区（滚动） ══════ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#f5f5f8' }}>
        {/* B. 提交内容 + 维度评分 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <SubmittedContentCard detail={detail} />
          <DimensionScores dimensions={detail.dimensions} overallScore={detail.overall_score} model={detail.model} />
        </div>

        {/* C. AI 评语 (全宽) */}
        {detail.verdict && (
          <AiCommentsCard detail={detail} vColor={vConfig?.color || '#f59e0b'} />
        )}

        {/* D. Prompt 模板 + 处理日志 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <PromptViewer template={detail.prompt_template} vars={detail.prompt_vars} />
          <ProcessLogs detail={detail} />
        </div>
      </div>
    </div>
  )
}

/** B-left: 提交内容（可切换原始数据） */
function SubmittedContentCard({ detail }: { detail: AiReviewDetail }) {
  const [view, setView] = useState<'result' | 'item'>('result')
  const [fontSize, setFontSize] = useState(12)
  const [fontFamily, setFontFamily] = useState('"JetBrains Mono", monospace')
  const current = view === 'result' ? detail.result_data : detail.item_data

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e8', padding: 16, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {view === 'result' ? '提交内容' : '原始数据'}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Select size="small" value={fontSize} onChange={setFontSize}
            options={[10, 11, 12, 13, 14, 16].map(n => ({ value: n, label: `${n}px` }))}
            style={{ width: 60 }} dropdownMatchSelectWidth={false} />
          <Select size="small" value={fontFamily} onChange={setFontFamily}
            options={[
              { label: 'JetBrains', value: '"JetBrains Mono", monospace' },
              { label: 'Consolas', value: 'Consolas, monospace' },
              { label: 'Mono', value: 'monospace' },
            ]}
            style={{ width: 100 }} dropdownMatchSelectWidth={false} />
        </div>
      </div>
      {/* Toggle buttons */}
      <div style={{ display: 'flex', marginBottom: 10 }}>
        <button onClick={() => setView('result')} style={{
          padding: '2px 10px', fontSize: 11, border: `1.5px solid ${view === 'result' ? '#4f46e5' : '#e5e7eb'}`,
          borderRadius: '4px 0 0 4px', background: view === 'result' ? '#eef2ff' : '#fff',
          color: view === 'result' ? '#4f46e5' : '#6b7280', cursor: 'pointer',
        }}>提交内容</button>
        <button onClick={() => setView('item')} style={{
          padding: '2px 10px', fontSize: 11, border: `1.5px solid ${view === 'item' ? '#4f46e5' : '#e5e7eb'}`,
          borderRadius: '0 4px 4px 0', borderLeft: 0, background: view === 'item' ? '#eef2ff' : '#fff',
          color: view === 'item' ? '#4f46e5' : '#6b7280', cursor: 'pointer',
        }}>原始数据</button>
      </div>
      <div style={{
        height: 340, overflow: 'auto', padding: 12, borderRadius: 6,
        background: '#fafbfc', border: '1px solid #e5e7eb',
        fontFamily, fontSize, lineHeight: 1.7, color: '#1a1a2e',
        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>
        {current ? <JsonHighlight data={current} /> : <span style={{ color: '#9ca3af' }}>无数据</span>}
      </div>
    </div>
  )
}

/** C: AI 评语卡片 */
function AiCommentsCard({ detail, vColor }: { detail: AiReviewDetail; vColor: string }) {
  return (
    <div style={{
      marginTop: 16, padding: '14px 18px', borderRadius: 10, background: '#fff',
      border: `1.5px solid ${vColor}`, borderLeft: `5px solid ${vColor}`,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        AI 综合评语
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.9, color: '#1f2937' }}>
        {detail.summary || 'AI 未生成详细评语'}
      </div>
      {detail.dimensions && detail.dimensions.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>
          综合得分 {detail.overall_score != null ? Math.round(detail.overall_score) : '-'} | {detail.dimensions.length} 维度已评分 | 模型 {detail.model || '-'}
        </div>
      )}
    </div>
  )
}

/** D-right: Prompt 模板 */
function PromptViewer({ template, vars }: { template: string | null; vars: Record<string, unknown> | null }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e8', padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        审核 Prompt 模板
      </div>
      <div style={{
        maxHeight: 260, overflow: 'auto', padding: 12, borderRadius: 6,
        background: '#f8f9fa', fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#374151',
      }}>
        {template || '无 Prompt 记录'}
      </div>
      {vars && (
        <details style={{ marginTop: 8, fontSize: 11 }}>
          <summary style={{ cursor: 'pointer', color: '#6b7280' }}>查看变量</summary>
          <pre style={{ marginTop: 6, padding: 8, background: '#f3f4f6', borderRadius: 4, fontSize: 10, whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>
            {JSON.stringify(vars, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

/** JSON 语法高亮 */
function JsonHighlight({ data }: { data: unknown }): React.ReactNode {
  if (data === null) return <span style={{ color: '#7c3aed' }}>null</span>
  if (typeof data === 'boolean') return <span style={{ color: '#7c3aed' }}>{String(data)}</span>
  if (typeof data === 'number') return <span style={{ color: '#d97706' }}>{data}</span>
  if (typeof data === 'string') return <span style={{ color: '#059669' }}>"{data}"</span>
  if (Array.isArray(data)) {
    return <><span style={{ color: '#9ca3af' }}>[</span>
      {data.map((item, i) => <span key={i}><JsonHighlight data={item} />{i < data.length - 1 && ', '}</span>)}
    <span style={{ color: '#9ca3af' }}>]</span></>
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>)
    return <><span style={{ color: '#9ca3af' }}>{'{'}</span>
      <div style={{ paddingLeft: 16 }}>
        {entries.map(([k, v], i) => (
          <div key={k}><span style={{ color: '#60a5fa' }}>"{k}"</span>: <JsonHighlight data={v} />{i < entries.length - 1 && ','}</div>
        ))}
      </div>
    <span style={{ color: '#9ca3af' }}>{'}'}</span></>
  }
  return <span>{String(data)}</span>
}
