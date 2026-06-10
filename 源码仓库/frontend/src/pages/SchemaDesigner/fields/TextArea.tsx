/** TextArea.tsx — 多行文本输入字段预览
 * Author: hongchuwudi
 * Description: 画布上渲染多行文本输入组件的预览
 */
import { Input } from 'antd'
import type { FieldLabelProps } from './types'

/** TextArea — 多行文本输入组件预览 */
export default function TextArea({ field }: FieldLabelProps) {
  return <Input.TextArea rows={field.rows || 3} placeholder={field.placeholder} disabled />
}
