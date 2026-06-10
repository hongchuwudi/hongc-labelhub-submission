/** LLMInteraction.tsx — LLM 触发组件预览
 * Author: hongchuwudi
 * Description: 画布上渲染 LLM 交互触发组件的预览
 */
import { ThunderboltOutlined } from '@ant-design/icons'
import type { FieldLabelProps } from './types'

/** LLMInteraction — LLM 交互触发组件预览 */
export default function LLMInteraction({ field }: FieldLabelProps) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 8,
      background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
      border: '1px solid #c4b5fd',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <ThunderboltOutlined style={{ color: '#7c3aed', fontSize: 16 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6' }}>
          {field.title || 'AI 建议'}
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#7c3aed' }}>
        LLM 触发组件 · {field.key || '未配置'}
      </div>
    </div>
  )
}
