/** Palette.tsx — 组件物料面板
 * Author: hongchuwudi
 * Description: 左侧面板，展示可拖拽的表单组件物料
 */
import { useDraggable } from '@dnd-kit/core'
import ScrollPanel from '../components/ScrollPanel'
import type { PaletteItem } from '../types'

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'text',     category: 'input',   label: '单行输入', icon: 'Aa' },
  { type: 'textarea', category: 'input',   label: '多行文本', icon: '¶' },
  { type: 'radio',    category: 'select',  label: '单选',     icon: '◉' },
  { type: 'checkbox', category: 'select',  label: '多选',     icon: '☑' },
  { type: 'select',   category: 'select',  label: '下拉选择', icon: '▼' },
  { type: 'upload',   category: 'media',   label: '文件/图片上传', icon: '↑' },
  { type: 'json',     category: 'advanced', label: 'JSON 编辑器', icon: '{ }' },
  { type: 'llm',      category: 'advanced', label: 'LLM 触发组件', icon: '⚡' },
  { type: 'showitem', category: 'display',  label: '展示项', icon: '⊙' },
  { type: 'richtext', category: 'display',  label: '富文本', icon: '✎' },
]

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  input:    { label: '物料',     color: '#3b82f6' },
  select:   { label: '选择类',   color: '#8b5cf6' },
  media:    { label: '媒体',     color: '#10b981' },
  advanced: { label: '高级组件', color: '#f59e0b' },
  display:  { label: '展示',     color: '#6b7280' },
}

function PaletteItem({ item }: { item: PaletteItem }) {
  const isAdvanced = item.type === 'llm'
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { source: 'palette', fieldType: item.type },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 8, cursor: 'grab',
        background: isDragging ? '#eef2ff' :
          isAdvanced ? '#f5f3ff' : '#fff',
        border: isAdvanced ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 150ms ease', fontSize: 13,
        fontWeight: isAdvanced ? 600 : 400,
        color: isAdvanced ? '#5b21b6' : '#374151',
      }}
    >
      <span style={{ fontSize: 14, width: 24, textAlign: 'center', flexShrink: 0 }}>
        {item.icon}
      </span>
      <span>{item.label}</span>
      {isAdvanced && (
        <span style={{ fontSize: 10, color: '#a78bfa', marginLeft: 'auto' }}>AI</span>
      )}
    </div>
  )
}

/** Palette — 左侧物料面板 */
export default function Palette() {
  const categories = [...new Set(PALETTE_ITEMS.map((i) => i.category))]

  return (
    <ScrollPanel
      style={{
        width: 230, flexShrink: 0, background: '#fafbfc',
        borderRight: '1px solid #e5e7eb', height: '100%',
      }}
    >
      <div style={{ padding: '16px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 14, paddingLeft: 4, letterSpacing: 0.5 }}>
          组件面板
        </div>
        {categories.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat] || { label: cat, color: '#6b7280' }
          return (
            <div key={cat} style={{ marginBottom: 18 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, marginBottom: 8, paddingLeft: 4,
                color: cfg.color, textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {cfg.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {PALETTE_ITEMS.filter((i) => i.category === cat).map((item) => (
                  <PaletteItem key={item.type} item={item} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollPanel>
  )
}
