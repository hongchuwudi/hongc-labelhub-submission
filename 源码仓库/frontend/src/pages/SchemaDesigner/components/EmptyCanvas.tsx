/** EmptyCanvas.tsx — 空画布占位
 * Author: hongchuwudi
 * Description: 画布为空时显示的拖拽引导占位组件
 */
import { InboxOutlined } from '@ant-design/icons'

/** EmptyCanvas — 空画布占位提示组件 */
export default function EmptyCanvas({ isOver }: { isOver: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', minHeight: 300, color: '#9ca3af',
      border: `2px dashed ${isOver ? '#4f46e5' : '#d1d5db'}`,
      borderRadius: 12, background: isOver ? '#eef2ff' : '#fff',
      transition: 'all 200ms ease',
    }}>
      <InboxOutlined style={{ fontSize: 48, marginBottom: 16, color: isOver ? '#4f46e5' : '#d1d5db' }} />
      <div style={{ fontSize: 15, fontWeight: 500 }}>从左侧拖拽组件到此处</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>搭建你的标注表单模板</div>
    </div>
  )
}
