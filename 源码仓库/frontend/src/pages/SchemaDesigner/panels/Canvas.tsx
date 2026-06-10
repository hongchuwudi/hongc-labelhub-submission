/** Canvas.tsx — Schema 设计器画布
 * Author: hongchuwudi
 * Description: 中间画布区域，支持 Tab 切换、分组容器、拖拽排序
 */
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Input } from 'antd'
import { useRef, useState } from 'react'
import { CloseOutlined, FolderOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons'
import { useSchemaDesigner } from '../SchemaDesignerContext'
import FieldCard from '../components/FieldCard'
import EmptyCanvas from '../components/EmptyCanvas'
import type { FieldConfig } from '../types'

function GroupShell({ groupId }: { groupId: string }) {
  const { state, dispatch } = useSchemaDesigner()
  const group = state.schema.groups.find((g) => g.id === groupId)
  if (!group) return null

  const groupFields = group.fieldIds
    .map((fid) => state.schema.fields.find((f) => f.id === fid))
    .filter(Boolean) as NonNullable<typeof state.schema.fields[number]>[]

  const fieldIds = groupFields.map((f) => f.id)
  const isEmptyGroup = groupFields.length === 0

  const {
    attributes, listeners, setNodeRef: setSortableRef,
    transform, transition, isDragging,
  } = useSortable({ id: `group-${group.id}`, data: { source: 'group-shell', groupId: group.id } })

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `group-inner-${group.id}`,
    data: { source: 'group', groupId: group.id },
  })

  const isHovered = state.hoveredGroupId === group.id
  const isSelected = state.selectedGroupId === group.id

  return (
    <div
      ref={setSortableRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        marginBottom: 14,
      }}
    >
      <div
        ref={setDroppableRef}
        style={{
          border: isSelected ? '2px solid #4f46e5' : isHovered ? '2px solid #4f46e5' : '2px dashed #cbd5e1',
          borderRadius: 10,
          background: isSelected ? '#eef2ff' : isHovered ? '#eef2ff' : '#f8fafc',
          boxShadow: isSelected ? '0 0 0 3px rgba(79, 70, 229, 0.25)' : isHovered ? '0 0 0 3px rgba(79, 70, 229, 0.25)' : undefined,
          transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
        }}
      >
        <div
          onClick={() => dispatch({ type: 'SELECT_GROUP', payload: { id: group.id } })}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px',
            background: isSelected ? '#ddd6fe' : '#f5f3ff',
            borderRadius: '8px 8px 0 0',
            borderBottom: '1px solid #e5e7eb',
            cursor: 'pointer',
          }}>
          <span {...attributes} {...listeners}
            style={{ cursor: 'grab', color: '#9ca3af', fontSize: 14, display: 'flex', alignItems: 'center' }}
          >
            <HolderOutlined />
          </span>
          <FolderOutlined style={{ fontSize: 14 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            分组
          </span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{group.title}</span>
          <Button type="text" size="small" danger icon={<CloseOutlined />}
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_GROUP', payload: { id: group.id } }) }} />
        </div>

        <div style={{ padding: isEmptyGroup ? '20px 14px' : '8px 14px 14px', minHeight: 50 }}>
          {isEmptyGroup ? (
            <div style={{ fontSize: 12, color: isHovered ? '#4f46e5' : '#9ca3af', textAlign: 'center' }}>
              {isHovered ? '松开放入' : '拖拽字段到此分组'}
            </div>
          ) : (
            <SortableContext items={fieldIds} strategy={rectSortingStrategy}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>
                {groupFields.map((field) => (
                  <FieldCard key={field.id} field={field} isSelected={state.selectedFieldId === field.id} />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  )
}

function SortableTab({ tab, active }: { tab: { id: string; title: string }; active: boolean }) {
  const { dispatch } = useSchemaDesigner()
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(tab.title)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `tab-${tab.id}`,
    data: { source: 'tab-bar', tabId: tab.id },
  })

  const ptrRef = useRef<{ x: number; y: number } | null>(null)

  if (editing) {
    return (
      <div style={{ padding: '6px 10px' }}>
        <Input
          size="small"
          value={editText}
          autoFocus
          onChange={(e) => setEditText(e.target.value)}
          onPressEnter={() => {
            dispatch({ type: 'UPDATE_TAB', payload: { id: tab.id, updates: { title: editText || tab.title } } })
            setEditing(false)
          }}
          onBlur={() => {
            dispatch({ type: 'UPDATE_TAB', payload: { id: tab.id, updates: { title: editText || tab.title } } })
            setEditing(false)
          }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setEditText(tab.title); setEditing(false) } }}
          style={{ width: 120, fontSize: 13 }}
        />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      onPointerDown={(e) => { ptrRef.current = { x: e.clientX, y: e.clientY } }}
      onPointerUp={(e) => {
        const s = ptrRef.current; ptrRef.current = null
        if (s && Math.abs(e.clientX - s.x) < 4 && Math.abs(e.clientY - s.y) < 4) {
          dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id })
        }
      }}
      onDoubleClick={() => { setEditText(tab.title); setEditing(true) }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        padding: '10px 16px', fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? '#4f46e5' : '#6b7280',
        borderBottom: active ? '2px solid #4f46e5' : '2px solid transparent',
        cursor: 'pointer', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center',
      }}
      title="双击编辑名称"
    >
      <span {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', marginRight: 6, color: '#9ca3af' }}
        title="拖拽排序">
        <HolderOutlined />
      </span>
      {tab.title}
      <span
        onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_TAB', payload: { id: tab.id } }) }}
        style={{
          marginLeft: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 18, height: 18, borderRadius: '50%', fontSize: 10,
          color: '#9ca3af', background: 'transparent', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fee2e2'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}
        title="删除 Tab"
      >
        <CloseOutlined />
      </span>
    </div>
  )
}

/** Tab 内容区，带 droppable 支持字段拖入 */
function TabContent({ tabId, directFields, tabGroups }: {
  tabId: string
  directFields: FieldConfig[]
  tabGroups: { id: string }[]
}) {
  const { state } = useSchemaDesigner()
  const { setNodeRef } = useDroppable({
    id: `tab-inner-${tabId}`,
    data: { source: 'tab-area', tabId },
  })

  if (directFields.length === 0 && tabGroups.length === 0) {
    return (
      <div ref={setNodeRef} style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ color: '#9ca3af', textAlign: 'center', padding: 40, border: '2px dashed #e5e7eb', borderRadius: 10 }}>
          此 Tab 暂无内容，将字段拖入此处或在属性面板中分配
        </div>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={{ minHeight: 100 }}>
      {directFields.length > 0 && (
        <SortableContext items={directFields.map((f) => f.id)} strategy={rectSortingStrategy}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start', marginBottom: tabGroups.length > 0 ? 14 : 0 }}>
            {directFields.map((field) => (
              <FieldCard key={field.id} field={field} isSelected={state.selectedFieldId === field.id} />
            ))}
          </div>
        </SortableContext>
      )}
      {tabGroups.length > 0 && (
        <SortableContext items={tabGroups.map((g) => `group-${g.id}`)} strategy={verticalListSortingStrategy}>
          {tabGroups.map((group) => (
            <GroupShell key={group.id} groupId={group.id} />
          ))}
        </SortableContext>
      )}
    </div>
  )
}

/** Canvas — 中间画布组件 */
export default function Canvas() {
  const { state, dispatch } = useSchemaDesigner()
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' })

  const tabs = state.schema.tabs
  const groups = state.schema.groups
  const activeTabId = state.activeTabId || tabs[0]?.id || null

  const isEmpty = state.schema.fields.length === 0 && groups.length === 0 && tabs.length === 0

  const handleAddTab = () => {
    const id = crypto.randomUUID?.() || 't_' + Date.now()
    dispatch({
      type: 'ADD_TAB',
      payload: { id, title: `Tab ${tabs.length + 1}`, fieldIds: [], groupIds: [] },
    })
  }

  const handleAddGroup = () => {
    const id = crypto.randomUUID?.() || 'g_' + Date.now()
    dispatch({
      type: 'ADD_GROUP',
      payload: { id, title: `分组 ${groups.length + 1}`, fieldIds: [] },
    })
  }

  return (
    <div ref={setNodeRef} style={{ flex: 1, overflow: 'hidden', background: '#f9fafb', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {isEmpty ? (
        <div style={{ flex: 1, padding: 20 }}>
          <EmptyCanvas isOver={isOver} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
            <Button size="small" icon={<PlusOutlined />} onClick={handleAddTab}>添加 Tab</Button>
            <Button size="small" icon={<PlusOutlined />} onClick={handleAddGroup}>添加分组</Button>
          </div>
        </div>
      ) : (
        <>
          {/* 工具栏 */}
          <div style={{
            display: 'flex', gap: 4, padding: '6px 12px',
            borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0,
          }}>
            <Button size="small" icon={<PlusOutlined />} onClick={handleAddTab}>Tab</Button>
            <Button size="small" icon={<PlusOutlined />} onClick={handleAddGroup}>分组</Button>
          </div>

          {/* Tab 栏 */}
          {tabs.length > 0 && (
            <SortableContext items={tabs.map((t) => `tab-${t.id}`)} strategy={horizontalListSortingStrategy}>
              <div style={{
                display: 'flex', gap: 0, background: '#fff',
                borderBottom: '1px solid #e5e7eb', padding: '0 12px',
                flexShrink: 0, overflowX: 'auto',
              }}>
                {tabs.map((tab) => (
                  <SortableTab key={tab.id} tab={tab} active={activeTabId === tab.id} />
                ))}
              </div>
            </SortableContext>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: 20, minHeight: 0 }}>
            {/* Tab 模式 */}
            {tabs.length > 0 && (() => {
              const activeTab = tabs.find((t) => t.id === activeTabId)
              const allTabFieldIds = new Set(tabs.flatMap((t) => t.fieldIds))
              const allGroupFieldIds = new Set(groups.flatMap((g) => g.fieldIds))
              const unassignedFields = state.schema.fields.filter((f) =>
                !allTabFieldIds.has(f.id) && !allGroupFieldIds.has(f.id))
              const allTabGroupIds = new Set(tabs.flatMap((t) => t.groupIds))
              const unassignedGroups = groups.filter((g) => !allTabGroupIds.has(g.id))
              const hasUnassigned = unassignedFields.length > 0 || unassignedGroups.length > 0

              return (
                <>
                  {hasUnassigned && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                        paddingBottom: 8, borderBottom: '1px dashed #e5e7eb',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>未分配区域</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>— 在右侧属性面板中分配到 Tab</span>
                      </div>
                      {unassignedFields.length > 0 && (
                        <SortableContext items={unassignedFields.map((f) => f.id)} strategy={rectSortingStrategy}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start', marginBottom: unassignedGroups.length > 0 ? 10 : 0 }}>
                            {unassignedFields.map((field) => (
                              <FieldCard key={field.id} field={field} isSelected={state.selectedFieldId === field.id} />
                            ))}
                          </div>
                        </SortableContext>
                      )}
                      {unassignedGroups.length > 0 && (
                        <SortableContext items={unassignedGroups.map((g) => `group-${g.id}`)} strategy={verticalListSortingStrategy}>
                          {unassignedGroups.map((group) => (
                            <GroupShell key={group.id} groupId={group.id} />
                          ))}
                        </SortableContext>
                      )}
                    </div>
                  )}

                  {hasUnassigned && activeTab && (
                    <div style={{ borderTop: '2px dashed #e5e7eb', marginBottom: 14 }} />
                  )}

                  {activeTab ? (
                    <TabContent
                      tabId={activeTab.id}
                      directFields={activeTab.fieldIds
                        .map((fid) => state.schema.fields.find((f) => f.id === fid))
                        .filter((f): f is NonNullable<typeof f> => !!f && !allGroupFieldIds.has(f.id))}
                      tabGroups={groups.filter((g) => activeTab.groupIds.includes(g.id))}
                    />
                  ) : (
                    <div style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>
                      请选择一个 Tab 或添加新的 Tab
                    </div>
                  )}
                </>
              )
            })()}

            {/* 无 Tab：传统模式 */}
            {tabs.length === 0 && (
              <>
                {state.schema.fields.length > 0 && (() => {
                  const groupedFieldIds = new Set(groups.flatMap((g) => g.fieldIds))
                  const ungroupedFields = state.schema.fields.filter((f) => !groupedFieldIds.has(f.id))
                  return ungroupedFields.length > 0 ? (
                    <SortableContext items={ungroupedFields.map((f) => f.id)} strategy={rectSortingStrategy}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start', marginBottom: groups.length > 0 ? 14 : 0 }}>
                        {ungroupedFields.map((field) => (
                          <FieldCard key={field.id} field={field} isSelected={state.selectedFieldId === field.id} />
                        ))}
                      </div>
                    </SortableContext>
                  ) : null
                })()}
                {groups.length > 0 && (
                  <SortableContext items={groups.map((g) => `group-${g.id}`)} strategy={verticalListSortingStrategy}>
                    {groups.map((group) => (
                      <GroupShell key={group.id} groupId={group.id} />
                    ))}
                  </SortableContext>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
