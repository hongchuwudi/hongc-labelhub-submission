/** index.tsx — Schema 设计器主页面
 * Author: hongchuwudi
 * Description: 提供拖拽式表单 Schema 设计的主界面
 */
import { useState, useEffect } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, rectIntersection, type DragEndEvent, type DragOverEvent } from '@dnd-kit/core'
import { Drawer, Button } from 'antd'
import { AppstoreOutlined, BuildOutlined, SettingOutlined } from '@ant-design/icons'
import { SchemaDesignerProvider, useSchemaDesigner } from './SchemaDesignerContext'
import { createDefaultConfig } from './utils/defaultConfig'
import SchemaToolbar from './components/SchemaToolbar'
import SchemaPreview from './components/SchemaPreview'
import FormPreview from './components/FormPreview'
import Palette from './panels/Palette'
import Canvas from './panels/Canvas'
import PropertyEditor from './panels/PropertyEditor'
import { listSchemasApi, getSchemaApi } from '@/api/schemas'
import type { FieldType } from './types'

/** 跨越 flex-wrap 各行的精确落点计算 */
function computeInsertIndex(
  activeRect: { top: number; left: number; right: number; bottom: number },
  items: { id: string; rect: DOMRect | null }[],
): number {
  const centerX = (activeRect.left + activeRect.right) / 2
  const centerY = (activeRect.top + activeRect.bottom) / 2

  let bestIndex = items.length
  let bestDist = Infinity

  for (let i = 0; i < items.length; i++) {
    const r = items[i]!.rect
    if (!r) continue

    const itemCY = (r.top + r.bottom) / 2
    const rowDiff = Math.abs(centerY - itemCY)

    if (rowDiff < 30) {
      const itemCX = (r.left + r.right) / 2
      if (centerX > itemCX && i + 1 <= items.length) {
        if (i + 1 < bestIndex || rowDiff < bestDist - 20) {
          bestIndex = i + 1
          bestDist = rowDiff
        }
      } else {
        if (i < bestIndex || rowDiff < bestDist - 20) {
          bestIndex = i
          bestDist = rowDiff
        }
      }
    } else if (centerY < itemCY) {
      if (i < bestIndex) {
        bestIndex = i
        bestDist = rowDiff
      }
    }
  }

  return bestIndex
}

function Designer() {
  const { state, dispatch } = useSchemaDesigner()
  const [mobileView, setMobileView] = useState<'palette' | 'canvas' | 'props'>('canvas')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  useEffect(() => {
    if (state.schemaId !== null || state.schema.fields.length > 0) return
    let cancelled = false
    ;(async () => {
      try {
        const list = await listSchemasApi(1, 10)
        const items = list.data.items
        if (items.length === 0 || cancelled) return
        const latest = items[0]!
        const res = await getSchemaApi(latest.id)
        if (cancelled) return
        dispatch({ type: 'LOAD_SCHEMA', payload: res.data.schema })
        dispatch({ type: 'SET_SCHEMA_ID', payload: res.data.id })
        dispatch({ type: 'SET_SCHEMA_VERSION', payload: res.data.version })
        dispatch({ type: 'SET_UPDATED_AT', payload: res.data.updated_at })
      } catch { /* skip */ }
    })()
    return () => { cancelled = true }
  }, [])

  // ── 拖拽辅助 ──

  const findFieldGroup = (fieldId: string): string | null => {
    for (const g of state.schema.groups) {
      if (g.fieldIds.includes(fieldId)) return g.id
    }
    return null
  }

  const findFieldTab = (fieldId: string): string | null => {
    for (const t of state.schema.tabs) {
      if (t.fieldIds.includes(fieldId)) return t.id
    }
    return null
  }

  const resolveTargetGroup = (overId: string): string | null => {
    if (overId.startsWith('group-inner-')) return overId.slice('group-inner-'.length)
    if (overId.startsWith('group-')) return overId.slice('group-'.length)
    const g = findFieldGroup(overId)
    if (g) return g
    return null
  }

  const resolveTargetTab = (overId: string): string | null => {
    if (overId.startsWith('tab-inner-')) return overId.slice('tab-inner-'.length)
    const t = findFieldTab(overId)
    if (t) return t
    return null
  }

  const fieldIndexInGroup = (groupId: string, fieldId: string): number => {
    const g = state.schema.groups.find((x) => x.id === groupId)
    return g ? g.fieldIds.indexOf(fieldId) : -1
  }

  const fieldIndexInTab = (tabId: string, fieldId: string): number => {
    const t = state.schema.tabs.find((x) => x.id === tabId)
    return t ? t.fieldIds.indexOf(fieldId) : -1
  }

  const getItemRects = (excludeId?: string) => {
    const groupedIds = new Set(state.schema.groups.flatMap((g) => g.fieldIds))
    return state.schema.fields
      .filter((f) => f.id !== excludeId && !groupedIds.has(f.id))
      .map((f) => ({
        id: f.id,
        rect: document.querySelector(`[data-field-id="${f.id}"]`)?.getBoundingClientRect() ?? null,
      }))
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (!over) { dispatch({ type: 'SET_HOVERED_GROUP', payload: null }); return }
    const gid = resolveTargetGroup(String(over.id))
    dispatch({ type: 'SET_HOVERED_GROUP', payload: gid })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    dispatch({ type: 'SET_HOVERED_GROUP', payload: null })
    const { active, over } = event
    if (!over) return

    const source = active.data.current?.source as string | undefined

    const activeRect = active.rect.current.translated ?? active.rect.current.initial
    if (!activeRect) return

    const overId = String(over.id)
    const activeId = active.id as string

    // ── 从组件面板拖入新字段 ──
    if (source === 'palette') {
      const fieldType = active.data.current?.fieldType as string
      const key = `field_${state.schema.fields.length + 1}`
      const fieldId = crypto.randomUUID?.() || 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2)
      const newField = createDefaultConfig(fieldType as FieldType, key, fieldId)
      const insertIndex = computeInsertIndex(activeRect, getItemRects())
      dispatch({ type: 'ADD_FIELD', payload: { field: newField, index: insertIndex } })

      // 优先放入容器
      const targetGroup = resolveTargetGroup(overId)
      if (targetGroup) {
        dispatch({ type: 'SET_FIELD_GROUP', payload: { fieldId: newField.id, groupId: targetGroup } })
      } else {
        // 否则放入 Tab
        const targetTab = resolveTargetTab(overId)
        if (targetTab) {
          dispatch({ type: 'SET_FIELD_TAB', payload: { fieldId: newField.id, tabId: targetTab } })
        }
      }
      setMobileView('canvas')
      return
    }

    // ── 分组排序 ──
    if (source === 'group-shell') {
      const extractId = (id: string) => id.startsWith('group-') ? id.slice('group-'.length) : null
      const srcId = extractId(activeId)
      const tgtId = extractId(overId)
      if (srcId && tgtId) {
        const oldIdx = state.schema.groups.findIndex((g) => g.id === srcId)
        const newIdx = state.schema.groups.findIndex((g) => g.id === tgtId)
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          dispatch({ type: 'REORDER_GROUPS', payload: { fromIndex: oldIdx, toIndex: newIdx } })
        }
      }
      return
    }

    // ── Tab 排序 ──
    if (source === 'tab-bar') {
      const extractId = (id: string) => id.startsWith('tab-') ? id.slice('tab-'.length) : null
      const srcId = extractId(activeId)
      const tgtId = extractId(overId)
      if (srcId && tgtId) {
        const oldIdx = state.schema.tabs.findIndex((t) => t.id === srcId)
        const newIdx = state.schema.tabs.findIndex((t) => t.id === tgtId)
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          dispatch({ type: 'REORDER_TABS', payload: { fromIndex: oldIdx, toIndex: newIdx } })
        }
      }
      return
    }

    // ── 画布内拖拽 ──
    if (source === 'canvas' && activeId !== overId) {
      const srcGroup = findFieldGroup(activeId)
      const srcTab = findFieldTab(activeId)
      const tgtGroup = resolveTargetGroup(overId)
      const tgtTab = resolveTargetTab(overId)

      // 同一分组内重排
      if (srcGroup && tgtGroup && srcGroup === tgtGroup) {
        const fromIdx = fieldIndexInGroup(srcGroup, activeId)
        if (fromIdx === -1) return
        let toIdx = fieldIndexInGroup(tgtGroup, overId)
        if (toIdx === -1) {
          const group = state.schema.groups.find((g) => g.id === srcGroup)
          if (group) {
            const groupFields = group.fieldIds
              .map((fid) => state.schema.fields.find((f) => f.id === fid))
              .filter(Boolean) as typeof state.schema.fields
            const items = groupFields.map((f) => ({
              id: f.id,
              rect: document.querySelector(`[data-field-id="${f.id}"]`)?.getBoundingClientRect() ?? null,
            }))
            toIdx = computeInsertIndex(activeRect, items)
          }
        }
        if (toIdx !== -1 && fromIdx !== toIdx) {
          dispatch({ type: 'REORDER_GROUP_FIELDS', payload: { groupId: srcGroup, fromIndex: fromIdx, toIndex: toIdx } })
        }
        return
      }

      // 同一 Tab 内重排（直接字段）
      if (srcTab && tgtTab && srcTab === tgtTab && !tgtGroup) {
        const fromIdx = fieldIndexInTab(srcTab, activeId)
        if (fromIdx === -1) return
        let toIdx = fieldIndexInTab(tgtTab, overId)
        if (toIdx === -1) {
          const tab = state.schema.tabs.find((t) => t.id === srcTab)
          if (tab) {
            const tabFields = tab.fieldIds
              .map((fid) => state.schema.fields.find((f) => f.id === fid))
              .filter(Boolean) as typeof state.schema.fields
            const items = tabFields.map((f) => ({
              id: f.id,
              rect: document.querySelector(`[data-field-id="${f.id}"]`)?.getBoundingClientRect() ?? null,
            }))
            toIdx = computeInsertIndex(activeRect, items)
          }
        }
        if (toIdx !== -1 && fromIdx !== toIdx) {
          dispatch({ type: 'REORDER_TAB_FIELDS', payload: { tabId: srcTab, fromIndex: fromIdx, toIndex: toIdx } })
        }
        return
      }

      // 放入容器（跨区 / 从 Tab 移入容器）
      if (tgtGroup && srcGroup !== tgtGroup) {
        dispatch({ type: 'SET_FIELD_GROUP', payload: { fieldId: activeId, groupId: tgtGroup } })
        return
      }

      // 放入 Tab（跨区 / 从容器移入 Tab）
      if (tgtTab && srcTab !== tgtTab) {
        dispatch({ type: 'SET_FIELD_TAB', payload: { fieldId: activeId, tabId: tgtTab } })
        return
      }

      // 拖出分组 → 变为未分组
      if (!tgtGroup && !tgtTab && srcGroup) {
        dispatch({ type: 'SET_FIELD_GROUP', payload: { fieldId: activeId, groupId: null } })
        return
      }

      // 拖出 Tab → 变为未分配
      if (!tgtGroup && !tgtTab && srcTab) {
        dispatch({ type: 'SET_FIELD_TAB', payload: { fieldId: activeId, tabId: null } })
        return
      }

      // 未分组之间平铺排序
      if (!tgtGroup && !tgtTab && !srcGroup && !srcTab) {
        const oldIdx = state.schema.fields.findIndex((f) => f.id === activeId)
        if (oldIdx === -1) return
        const newIdx = computeInsertIndex(activeRect, getItemRects(activeId))
        if (newIdx !== oldIdx) {
          dispatch({ type: 'REORDER_FIELDS', payload: { fromIndex: oldIdx, toIndex: newIdx } })
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="schema-designer">
        <SchemaToolbar />
        <div className="schema-designer-body">
          <div className="schema-palette-desktop">
            <Palette />
          </div>
          <Canvas />
          <div className="schema-props-desktop">
            <PropertyEditor />
          </div>
        </div>

        {/* 预览模式：渲染表单 */}
        <Drawer
          title="表单预览"
          placement="right"
          size="large"
          open={state.previewVisible}
          onClose={() => dispatch({ type: 'SET_PREVIEW', payload: false })}
          styles={{ body: { padding: '16px 24px' } }}
          getContainer={false}
        >
          <FormPreview />
        </Drawer>

        {/* 查看 JSON */}
        <Drawer
          title="查看 JSON Schema"
          placement="right"
          size="large"
          open={state.jsonViewVisible}
          onClose={() => dispatch({ type: 'SET_JSON_VIEW', payload: false })}
          styles={{ body: { padding: '0 20px' } }}
          getContainer={false}
        >
          <SchemaPreview />
        </Drawer>

        <div className="schema-mobile-toolbar">
          <Button
            type={mobileView === 'palette' ? 'primary' : 'text'}
            icon={<AppstoreOutlined />}
            onClick={() => setMobileView(mobileView === 'palette' ? 'canvas' : 'palette')}
            size="large"
          >
            组件
          </Button>
          <Button
            type={mobileView === 'canvas' ? 'primary' : 'text'}
            icon={<BuildOutlined />}
            onClick={() => setMobileView('canvas')}
            size="large"
          >
            画布
          </Button>
          <Button
            type={mobileView === 'props' ? 'primary' : 'text'}
            icon={<SettingOutlined />}
            onClick={() => setMobileView(mobileView === 'props' ? 'canvas' : 'props')}
            size="large"
          >
            属性
          </Button>
        </div>

        <Drawer
          title="组件面板"
          placement="left"
          size="default"
          open={mobileView === 'palette'}
          onClose={() => setMobileView('canvas')}
          className="schema-mobile-drawer"
          styles={{ body: { padding: 0 } }}
          getContainer={false}
        >
          <Palette />
        </Drawer>

        <Drawer
          title="属性配置"
          placement="right"
          size="default"
          open={mobileView === 'props'}
          onClose={() => setMobileView('canvas')}
          className="schema-mobile-drawer"
          styles={{ body: { padding: 0 } }}
          getContainer={false}
        >
          <PropertyEditor />
        </Drawer>
      </div>
    </DndContext>
  )
}

/** SchemaDesigner — Schema 设计器根组件，包裹 DndContext 和三栏布局 */
export default function SchemaDesigner() {
  return (
    <SchemaDesignerProvider>
      <Designer />
    </SchemaDesignerProvider>
  )
}
