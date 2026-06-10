/**
 * AiComments.tsx — AI 评语区块
 * Author: hongchuwudi
 * Description: AI 审核综合评语，核心内容突出展示
 */
import { Tag } from 'antd'
import {
  CheckCircleFilled, CloseCircleFilled, QuestionCircleFilled,
  BulbOutlined,
} from '@ant-design/icons'

interface VerdictStyle { color: string; bg: string; border: string; icon: React.ReactNode; label: string; text: string }

const VERDICT_STYLE: Record<string, VerdictStyle> = {
  pass: {
    color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0',
    icon: <CheckCircleFilled />, label: '合格', text: 'AI 认为标注质量合格，建议通过',
  },
  reject: {
    color: '#ef4444', bg: '#fef2f2', border: '#fecaca',
    icon: <CloseCircleFilled />, label: '不合格', text: 'AI 认为标注存在质量问题，建议打回修改',
  },
  human_review: {
    color: '#f59e0b', bg: '#fffbeb', border: '#fde68a',
    icon: <QuestionCircleFilled />, label: '待定', text: 'AI 无法确定，建议人工审核员介入判断',
  },
}

/** AI 评语区组件 */
export default function AiComments({ summary, verdict }: {
  summary: string | null
  verdict: string | null
}) {
  const style = verdict ? VERDICT_STYLE[verdict] : null

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        <BulbOutlined style={{ marginRight: 4 }} /> AI 评语与建议
      </div>

      {style ? (
        <div style={{
          padding: '18px 20px', borderRadius: 12, border: `1.5px solid ${style.border}`,
          background: style.bg,
        }}>
          {/* 判定头 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10,
              background: style.color, color: '#fff', fontSize: 18,
            }}>
              {style.icon}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color={style.color} style={{ margin: 0, fontWeight: 700, fontSize: 13, padding: '2px 10px' }}>
                  {style.label}
                </Tag>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{style.text}</span>
              </div>
            </div>
          </div>

          {/* 评语正文 */}
          <div style={{
            padding: '14px 16px', borderRadius: 8,
            background: '#fff', border: `1px solid ${style.border}`,
            fontSize: 14, lineHeight: 1.9, color: '#1a1a2e',
          }}>
            {summary || 'AI 未提供详细评语'}
          </div>
        </div>
      ) : (
        <div style={{
          padding: 32, textAlign: 'center', borderRadius: 12,
          background: '#fafafa', border: '1px solid #f0f0f0',
          color: '#9ca3af', fontSize: 13,
        }}>
          {summary || '暂无 AI 评语'}
        </div>
      )}
    </div>
  )
}
