/** CheckboxGroup.tsx — 多选字段预览
 * Author: hongchuwudi
 * Description: 画布上渲染复选框组件的预览
 */
import { Checkbox } from 'antd'
import type { FieldLabelProps } from './types'

/** CheckboxGroup — 多选复选框组预览 */
export default function CheckboxGroup({ field }: FieldLabelProps) {
  return <Checkbox.Group disabled options={field.options?.map((o) => ({ label: o.label, value: o.value }))} />
}
