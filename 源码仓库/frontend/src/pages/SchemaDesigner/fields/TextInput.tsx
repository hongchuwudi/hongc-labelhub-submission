/** TextInput.tsx — 单行输入字段预览
 * Author: hongchuwudi
 * Description: 画布上渲染单行文本输入组件的预览
 */
import { Input } from 'antd'
import type { FieldLabelProps } from './types'

/** TextInput — 单行文本输入组件预览 */
export default function TextInput({ field, label }: FieldLabelProps) {
  if (label) {
    return (
      <div>
        <div style={{ marginBottom: 4 }}>{label}</div>
        <Input placeholder={field.placeholder} disabled />
      </div>
    )
  }
  return <Input placeholder={field.placeholder} disabled />
}
