/** TagSelect.tsx — 下拉选择字段预览
 * Author: hongchuwudi
 * Description: 画布上渲染下拉选择组件的预览
 */
import { Select } from 'antd'
import type { FieldLabelProps } from './types'

/** TagSelect — 下拉选择组件预览 */
export default function TagSelect({ field }: FieldLabelProps) {
  return (
    <Select mode="multiple" placeholder={field.placeholder} disabled style={{ width: '100%' }}
      options={field.options?.map((o) => ({ label: o.label, value: o.value }))}
    />
  )
}
