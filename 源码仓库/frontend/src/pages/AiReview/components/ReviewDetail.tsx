/**
 * ReviewDetail.tsx — 右侧 AI 审核详情主面板
 * Author: hongchuwudi
 * Description: 2x2 网格 + 底部处理日志
 */
import { useState } from 'react'
import { Tag, Button, Space, message, Select } from 'antd'
import { ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { AiReviewDetail } from '@/types/models/ai-review'
import { rerunAiReviewApi } from '@/api/ai-reviews'
import DimensionScores from './DimensionScores'
import SubmittedContent from './SubmittedContent'
import AiComments from './AiComments'
import AuditTimeline from './AuditTimeline'

const VERDICT_TAG: Record<string, { color: string; label: string }> = {
  pass: { color: '#10b981', label: '建议通过' },
  reject: { color: '#ef4444', label: '建议驳回' },
  human_review: { color: '#f59e0b', label: '转人工审核' },
}

/** AI 审核详情面板组件 */
export default function ReviewDetail({ detail, onRerun }: {
  detail: AiReviewDetail
  onRerun: () => void
}) {
  const navigate = useNavigate()
  const [rerunning, setRerunning] = useState(false)

  const vConfig = detail.verdict ? VERDICT_TAG[detail.verdict] : null

  const handleRerun = async () => {
    setRerunning(true)
    try {
      await rerunAiReviewApi(detail.id)
      message.success('已重新投递')
      onRerun()
    } catch { message.error('重跑失败') }
    finally { setRerunning(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 顶部标题栏 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', borderBottom: '1px solid #e5e7eb', background: '#fafafa',
        flexShrink: 0, gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Button type="text" size="small" onClick={() => navigate('/ai-configs')}
            style={{ flexShrink: 0 }}>←</Button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {detail.task_title || `任务 #${detail.task_id}`}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>
              AI-Review #{detail.id} | 结果 #{detail.result_id}
            </div>
          </div>
        </div>
        <Space size={8} style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            {detail.agent_name} · {detail.agent_model || detail.model || '-'}
          </span>
          {vConfig && (
            <Tag color={vConfig.color} style={{ margin: 0, fontWeight: 600 }}>
              {vConfig.label}
            </Tag>
          )}
          {detail.status === 'failed' && (
            <Button size="small" icon={<ReloadOutlined />} loading={rerunning}
              onClick={handleRerun} danger>失败重跑</Button>
          )}
          <Button size="small" icon={<SettingOutlined />}
            onClick={() => navigate('/ai-configs')}>规则配置</Button>
        </Space>
      </div>

      {/* 内容区：2x2 网格 + 底部日志 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* 上排：提交内容 + 维度评分 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <SubmittedContent data={detail.result_data} itemData={detail.item_data} />
          <DimensionScores
            dimensions={detail.dimensions}
            overallScore={detail.overall_score}
            model={detail.model}
          />
        </div>

        {/* 中排：Prompt 模板(左) + AI 评语(右) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <PromptViewer template={detail.prompt_template} vars={detail.prompt_vars} />
          <AiComments summary={detail.summary} verdict={detail.verdict} />
        </div>

        {/* 底部：处理日志 */}
        <AuditTimeline detail={detail} />
      </div>
    </div>
  )
}

/** Prompt 模板查看器 */
function PromptViewer({ template, vars }: { template: string | null; vars: Record<string, unknown> | null }) {
  const [fontSize, setFontSize] = useState(12)
  const [fontFamily, setFontFamily] = useState('"JetBrains Mono", monospace')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          审核 Prompt 模板
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Select size="small" value={fontSize}
            onChange={setFontSize} options={[10, 11, 12, 13, 14, 16].map((n) => ({ value: n, label: `${n}px` }))}
            style={{ width: 60 }} dropdownMatchSelectWidth={false} />
          <Select size="small" value={fontFamily}
            onChange={setFontFamily}
            options={[
              { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
              { label: 'Fira Code', value: '"Fira Code", monospace' },
              { label: 'Consolas', value: 'Consolas, monospace' },
              { label: 'Monospace', value: 'monospace' },
            ]}
            style={{ width: 130 }} dropdownMatchSelectWidth={false} />
        </div>
      </div>
      <div style={{
        padding: 14, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb',
        fontFamily, fontSize, lineHeight: 1.7,
        color: '#1a1a2e', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        maxHeight: 280, overflow: 'auto',
      }}>
        {template || '无 Prompt 记录'}
      </div>
      {vars && (
        <details style={{ marginTop: 8, fontSize: 11 }}>
          <summary style={{ cursor: 'pointer', color: '#6b7280' }}>查看变量</summary>
          <pre style={{
            marginTop: 6, padding: 8, background: '#f3f4f6', borderRadius: 4,
            fontSize: 10, whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto',
          }}>{JSON.stringify(vars, null, 2)}</pre>
        </details>
      )}
    </div>
  )
}
