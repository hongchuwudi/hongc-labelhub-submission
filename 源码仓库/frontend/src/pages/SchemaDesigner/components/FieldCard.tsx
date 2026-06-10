/** FieldCard.tsx — 字段物料卡片
 * Author: hongchuwudi
 * Description: 画布上可拖拽、点击选中、复制/删除的字段卡片
 */
import { useState, useRef, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Tooltip } from 'antd'
import { HolderOutlined, DeleteOutlined, CopyOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useSchemaDesigner } from '../SchemaDesignerContext'
import TextInput from '../fields/TextInput'
import TextArea from '../fields/TextArea'
import RadioGroup from '../fields/RadioGroup'
import CheckboxGroup from '../fields/CheckboxGroup'
import TagSelect from '../fields/TagSelect'
import FileUpload from '../fields/FileUpload'
import JsonEditor from '../fields/JsonEditor'
import LLMInteraction from '../fields/LLMInteraction'
import ShowItem from '../fields/ShowItem'
import RichText from '../fields/RichText'
import type { FieldConfig } from '../types'

const FIELD_RENDERER: Record<string, React.ComponentType<{ field: FieldConfig; label?: React.ReactNode }>> = {
  text: TextInput, textarea: TextArea, radio: RadioGroup,
  checkbox: CheckboxGroup, select: TagSelect, upload: FileUpload,
  json: JsonEditor, llm: LLMInteraction, showitem: ShowItem,
  richtext: RichText,
}

const TYPE_LABELS: Record<string, string> = {
  text: '单行输入', textarea: '多行文本', radio: '单选', checkbox: '多选',
  select: '下拉选择', upload: '文件/图片上传', json: 'JSON 编辑器',
  llm: 'LLM 触发', showitem: '展示项', richtext: '富文本',
}

function FieldPreview({ field }: { field: FieldConfig }) {
  const label = (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>
        {field.title}
        {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
        字段标识: <span style={{ fontFamily: 'monospace' }}>{field.key}</span>
        <span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span>
        {TYPE_LABELS[field.type] || field.type}
      </div>
    </div>
  )

  const Renderer = FIELD_RENDERER[field.type]
  if (!Renderer) return <div style={{ fontSize: 13 }}>{label}</div>

  const needsLabelWrapper = ['textarea', 'radio', 'checkbox', 'upload'].includes(field.type)
  if (needsLabelWrapper) {
    return (
      <div>
        <div style={{ marginBottom: 4 }}>{label}</div>
        <Renderer field={field} />
      </div>
    )
  }

  return <Renderer field={field} label={field.type === 'text' ? label : undefined} />
}

/** FieldCard — 字段卡片组件，支持拖拽排序、选中、复制和删除 */
export default function FieldCard({ field, isSelected }: { field: FieldConfig; isSelected: boolean }) {
  const { state, dispatch } = useSchemaDesigner()
  const [handleHover, setHandleHover] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { source: 'canvas', field },
  })

  // 找到字段所在的上下文和索引
  const groupedFieldIds = new Set(state.schema.groups.flatMap((g) => g.fieldIds))
  const inGroup = state.schema.groups.find((g) => g.fieldIds.includes(field.id))
  const inTab = state.schema.tabs.find((t) => t.fieldIds.includes(field.id))
  const ungroupedFields = state.schema.fields.filter((f) => !groupedFieldIds.has(f.id))

  const currentIndex = inGroup
    ? inGroup.fieldIds.indexOf(field.id)
    : inTab
      ? inTab.fieldIds.indexOf(field.id)
      : ungroupedFields.findIndex((f) => f.id === field.id)

  const maxIndex = inGroup
    ? inGroup.fieldIds.length - 1
    : inTab
      ? inTab.fieldIds.length - 1
      : ungroupedFields.length - 1

  const moveLeft = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex <= 0) return
    if (inGroup) {
      dispatch({ type: 'REORDER_GROUP_FIELDS', payload: { groupId: inGroup.id, fromIndex: currentIndex, toIndex: currentIndex - 1 } })
    } else if (inTab) {
      dispatch({ type: 'REORDER_TAB_FIELDS', payload: { tabId: inTab.id, fromIndex: currentIndex, toIndex: currentIndex - 1 } })
    } else {
      dispatch({ type: 'REORDER_FIELDS', payload: { fromIndex: currentIndex, toIndex: currentIndex - 1 } })
    }
  }

  const moveRight = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex >= maxIndex) return
    if (inGroup) {
      dispatch({ type: 'REORDER_GROUP_FIELDS', payload: { groupId: inGroup.id, fromIndex: currentIndex, toIndex: currentIndex + 1 } })
    } else if (inTab) {
      dispatch({ type: 'REORDER_TAB_FIELDS', payload: { tabId: inTab.id, fromIndex: currentIndex, toIndex: currentIndex + 1 } })
    } else {
      dispatch({ type: 'REORDER_FIELDS', payload: { fromIndex: currentIndex, toIndex: currentIndex + 1 } })
    }
  }

  // dnd-kit PointerSensor 的 preventDefault 会吞掉原生 click 事件。
  // 用手动 pointerdown/up 追踪位移来判断是否是"点击"
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  // 保留 dnd-kit 自己注册的 onPointerDown，只追加位置记录
  const dndPointerDown = (listeners as Record<string, unknown>).onPointerDown as React.PointerEventHandler | undefined

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dndPointerDown?.(e)
    pointerStart.current = { x: e.clientX, y: e.clientY }
  }, [dndPointerDown])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const start = pointerStart.current
    pointerStart.current = null
    if (!start) return
    const dx = Math.abs(e.clientX - start.x)
    const dy = Math.abs(e.clientY - start.y)
    if (dx < 4 && dy < 4) {
      dispatch({ type: 'SELECT_FIELD', payload: { id: field.id } })
    }
  }, [dispatch, field.id])

  // colSpan → 百分比宽度，扣除 gap 份额避免溢出换行
  // offset = gap × (24 - colSpan) / 24  —— 每个元素分摊的 gap 量
  const col = field.colSpan ?? 24
  const pct = ((col / 24) * 100)
  const gap = 10
  const offset = (gap * (24 - col)) / 24
  const width = col === 24 ? '100%' : `calc(${pct}% - ${offset}px)`

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: isSelected ? '#eef2ff' : '#fff',
    border: isSelected ? '2px solid #4f46e5' : '1px solid #e5e7eb',
    borderRadius: 10, padding: '12px 14px',
    display: 'flex', gap: 10, userSelect: 'none',
    width,
    flexShrink: 0,
    textAlign: (field.textAlign || 'left') as React.CSSProperties['textAlign'],
  }

  return (
    <div
      ref={setNodeRef}
      data-field-id={field.id}
      style={{ ...style, cursor: 'grab' }}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <Tooltip title="按住拖拽排序" mouseEnterDelay={0.5}>
        <div
          onMouseEnter={() => setHandleHover(true)}
          onMouseLeave={() => setHandleHover(false)}
          style={{
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26, height: 26,
            borderRadius: 6,
            background: handleHover ? '#eef2ff' : 'transparent',
            color: handleHover ? '#4f46e5' : '#c0c6d1',
            fontSize: 16,
            flexShrink: 0,
            transition: 'background 0.15s, color 0.15s',
            pointerEvents: 'none',
          }}
        >
          <HolderOutlined />
        </div>
      </Tooltip>
      <div style={{ flex: 1, minWidth: 0, alignSelf: 'center' }}>
        <FieldPreview field={field} />
      </div>
      <div className="field-card-actions" style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <span className="field-card-arrows" style={{ display: 'flex', gap: 2 }}>
          <Button type="text" size="small" icon={<LeftOutlined />}
            disabled={currentIndex <= 0}
            onClick={moveLeft}
            style={{ fontSize: 10, width: 22, height: 22, padding: 0, color: '#9ca3af' }} />
          <Button type="text" size="small" icon={<RightOutlined />}
            disabled={currentIndex >= maxIndex}
            onClick={moveRight}
            style={{ fontSize: 10, width: 22, height: 22, padding: 0, color: '#9ca3af' }} />
        </span>
        <div style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 2px' }} />
        <Button type="text" size="small" icon={<CopyOutlined />}
          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DUPLICATE_FIELD', payload: { id: field.id } }) }}
          style={{ fontSize: 12, width: 22, height: 22, padding: 0, color: '#9ca3af' }} />
        <Button type="text" size="small" danger icon={<DeleteOutlined />}
          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_FIELD', payload: { id: field.id } }) }}
          style={{ fontSize: 12, width: 22, height: 22, padding: 0 }} />
      </div>
    </div>
  )
}
