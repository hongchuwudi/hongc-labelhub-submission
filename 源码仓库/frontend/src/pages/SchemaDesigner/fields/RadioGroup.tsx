/** RadioGroup.tsx — 单选字段预览
 * Author: hongchuwudi
 * Description: 画布上渲染单选按钮组件的预览
 */
import { Radio } from 'antd'
import type { FieldLabelProps } from './types'

/** RadioGroup — 单选按钮组预览 */
export default function RadioGroup({ field }: FieldLabelProps) {
  return (
    <Radio.Group disabled value={field.options?.[0]?.value}>
      {field.options?.map((o) => <Radio key={o.value} value={o.value}>{o.label}</Radio>)}
    </Radio.Group>
  )
}
