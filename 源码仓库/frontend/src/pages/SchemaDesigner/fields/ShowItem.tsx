/** ShowItem.tsx — 展示项字段预览
 * Author: hongchuwudi
 * Description: 画布上渲染只读展示项的预览
 */
import type { FieldLabelProps } from './types'

/** ShowItem — 只读展示项组件预览 */
export default function ShowItem({ field }: FieldLabelProps) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8,
      background: '#f0f5ff', border: '1px solid #d6e4ff',
    }}>
      <div style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        展示项 · 只读
      </div>
      <div style={{ fontSize: 14, color: '#1a1a2e', fontWeight: 500 }}>
        {field.title}
      </div>
      <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
        绑定字段: {field.key}
      </div>
    </div>
  )
}
