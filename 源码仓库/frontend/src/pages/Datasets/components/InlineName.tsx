/** InlineName.tsx — 内联编辑名称组件
 * Author: hongchuwudi
 * Description: 点击后变为 Input 输入框，支持回车/失焦保存、Escape 取消
 */
import { useState } from 'react'
import { Input } from 'antd'

/** 内联编辑名称组件 */
function InlineName({ value, onSave }: { value: string; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)

  if (!editing) {
    return (
      <span
        onClick={() => { setText(value); setEditing(true) }}
        style={{ cursor: 'pointer', borderBottom: '1px dashed #d1d5db', paddingBottom: 2 }}
        title="点击编辑名称"
      >
        {value}
      </span>
    )
  }

  return (
    <Input
      size="small"
      value={text}
      autoFocus
      onChange={(e) => setText(e.target.value)}
      onPressEnter={async () => { await onSave(text); setEditing(false) }}
      onBlur={async () => { await onSave(text); setEditing(false) }}
      onKeyDown={(e) => { if (e.key === 'Escape') { setText(value); setEditing(false) } }}
      style={{ width: '100%' }}
    />
  )
}

export default InlineName
