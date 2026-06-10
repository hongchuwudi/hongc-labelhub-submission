/** SchemaDesignerContext.tsx — Schema 设计器全局状态
 * Author: hongchuwudi
 * Description: 提供 useReducer 状态管理、Provider 和消费 hook
 */
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import { createDefaultConfig } from './utils/defaultConfig'
import type { SchemaDesign, DesignerState, DesignerAction, FieldConfig, GroupConfig, TabConfig } from './types'

const emptyDesign: SchemaDesign = {
  title: '未命名 Schema',
  description: '',
  fields: [],
  groups: [],
  tabs: [],
}

const initialState: DesignerState = {
  schema: emptyDesign,
  selectedFieldId: null,
  selectedGroupId: null,
  activeTabId: null,
  isDirty: false,
  previewVisible: false,
  jsonViewVisible: false,
  saveStatus: 'idle',
  schemaId: null,
  schemaVersion: 1,
  updatedAt: null,
  hoveredGroupId: null,
}

/** 迁移旧格式：groups 里 type='tab' → tabs[]，type='group' → groups[] */
function migrateSchema(raw: Record<string, unknown>): SchemaDesign {
  const design = raw as unknown as SchemaDesign
  const oldGroups = (raw as { groups?: Array<Record<string, unknown>> }).groups

  if (!oldGroups || oldGroups.length === 0) {
    if (!design.tabs) (design as unknown as Record<string, unknown>).tabs = []
    return design
  }

  const hasOldFormat = oldGroups.some((g) => 'type' in g)
  if (!hasOldFormat) {
    if (!design.tabs) (design as unknown as Record<string, unknown>).tabs = []
    return design
  }

  const tabs: TabConfig[] = []
  const groups: GroupConfig[] = []
  const allGroupIds = new Set(oldGroups.map((g) => g.id as string))

  for (const g of oldGroups) {
    if (g.type === 'tab') {
      const fids = (g.fieldIds as string[]) || []
      tabs.push({
        id: g.id as string,
        title: g.title as string,
        fieldIds: fids.filter((fid) => !allGroupIds.has(fid)),
        groupIds: fids.filter((fid) => allGroupIds.has(fid)),
      })
    } else {
      groups.push({
        id: g.id as string,
        title: g.title as string,
        fieldIds: (g.fieldIds as string[]) || [],
      })
    }
  }

  return { ...design, tabs, groups }
}

function designerReducer(state: DesignerState, action: DesignerAction): DesignerState {
  switch (action.type) {
    case 'LOAD_SCHEMA': {
      const p = action.payload as unknown as Record<string, unknown>
      const migrated = migrateSchema(p)
      return { ...state, schema: migrated, isDirty: false, selectedFieldId: null,
        schemaVersion: (p.version as number) || 1 }
    }

    case 'ADD_FIELD': {
      const fields = [...state.schema.fields]
      const idx = action.payload.index ?? fields.length
      // 自动去重：key 已存在加 _1, _2 后缀
      let key = action.payload.field.key
      let suffix = 1
      while (fields.some((f) => f.key === key)) { key = action.payload.field.key + '_' + (suffix++) }
      const newField = { ...action.payload.field, key }
      fields.splice(idx, 0, newField)
      return { ...state, schema: { ...state.schema, fields }, isDirty: true, selectedFieldId: newField.id }
    }

    case 'UPDATE_FIELD': {
      const fields = state.schema.fields.map((f) =>
        f.id === action.payload.id ? { ...f, ...action.payload.updates } : f
      )
      return { ...state, schema: { ...state.schema, fields }, isDirty: true }
    }

    case 'REMOVE_FIELD': {
      const fields = state.schema.fields.filter((f) => f.id !== action.payload.id)
      const selectedFieldId = state.selectedFieldId === action.payload.id ? null : state.selectedFieldId
      const groups = state.schema.groups.map((g) => ({
        ...g, fieldIds: g.fieldIds.filter((fid) => fid !== action.payload.id),
      }))
      const tabs = state.schema.tabs.map((t) => ({
        ...t, fieldIds: t.fieldIds.filter((fid) => fid !== action.payload.id),
      }))
      return { ...state, schema: { ...state.schema, fields, groups, tabs }, isDirty: true, selectedFieldId }
    }

    case 'DUPLICATE_FIELD': {
      const idx = state.schema.fields.findIndex((f) => f.id === action.payload.id)
      if (idx === -1) return state
      const original = state.schema.fields[idx]!
      const dup: FieldConfig = { ...original, id: crypto.randomUUID(), key: original.key + '_copy' }
      const fields = [...state.schema.fields]
      fields.splice(idx + 1, 0, dup)
      const groups = state.schema.groups.map((g) => {
        const fidx = g.fieldIds.indexOf(action.payload.id)
        if (fidx === -1) return g
        const ids = [...g.fieldIds]
        ids.splice(fidx + 1, 0, dup.id)
        return { ...g, fieldIds: ids }
      })
      const tabs = state.schema.tabs.map((t) => {
        const fidx = t.fieldIds.indexOf(action.payload.id)
        if (fidx === -1) return t
        const ids = [...t.fieldIds]
        ids.splice(fidx + 1, 0, dup.id)
        return { ...t, fieldIds: ids }
      })
      return { ...state, schema: { ...state.schema, fields, groups, tabs }, isDirty: true, selectedFieldId: dup.id }
    }

    case 'REORDER_FIELDS': {
      const fields = [...state.schema.fields]
      const [moved] = fields.splice(action.payload.fromIndex, 1)
      fields.splice(action.payload.toIndex, 0, moved!)
      return { ...state, schema: { ...state.schema, fields }, isDirty: true }
    }

    case 'SELECT_FIELD':
      return { ...state, selectedFieldId: action.payload.id, selectedGroupId: null }
    case 'SELECT_GROUP':
      return { ...state, selectedGroupId: action.payload.id, selectedFieldId: null }

    case 'SET_PREVIEW':
      return { ...state, previewVisible: action.payload }
    case 'SET_JSON_VIEW':
      return { ...state, jsonViewVisible: action.payload }

    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.payload }

    case 'SET_SCHEMA_ID':
      return { ...state, schemaId: action.payload }

    case 'SET_UPDATED_AT':
      return { ...state, updatedAt: action.payload }

    case 'SET_HOVERED_GROUP':
      return { ...state, hoveredGroupId: action.payload }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabId: action.payload }

    // ── Group (container) actions ──

    case 'ADD_GROUP':
      return { ...state, schema: { ...state.schema, groups: [...state.schema.groups, action.payload] }, isDirty: true }

    case 'REMOVE_GROUP': {
      const groups = state.schema.groups.filter((g) => g.id !== action.payload.id)
      const tabs = state.schema.tabs.map((t) => ({
        ...t, groupIds: t.groupIds.filter((gid) => gid !== action.payload.id),
      }))
      return { ...state, schema: { ...state.schema, groups, tabs }, isDirty: true }
    }

    case 'UPDATE_GROUP': {
      const groups = state.schema.groups.map((g) =>
        g.id === action.payload.id ? { ...g, ...action.payload.updates } : g
      )
      return { ...state, schema: { ...state.schema, groups }, isDirty: true }
    }

    case 'SET_FIELD_GROUP': {
      const { fieldId, groupId } = action.payload
      let groups = state.schema.groups.map((g) => ({
        ...g, fieldIds: g.fieldIds.filter((fid) => fid !== fieldId),
      }))
      if (groupId) {
        const idx = groups.findIndex((g) => g.id === groupId)
        if (idx !== -1) {
          groups[idx]! = { ...groups[idx]!, fieldIds: [...groups[idx]!.fieldIds, fieldId] }
        }
      }
      // 互斥：放入容器时从所有 Tab 的 fieldIds 中移除
      const tabs = state.schema.tabs.map((t) => ({
        ...t, fieldIds: t.fieldIds.filter((fid) => fid !== fieldId),
      }))
      return { ...state, schema: { ...state.schema, groups, tabs }, isDirty: true }
    }

    case 'REORDER_GROUP_FIELDS': {
      const groups = state.schema.groups.map((g) => {
        if (g.id !== action.payload.groupId) return g
        const fieldIds = [...g.fieldIds]
        const [moved] = fieldIds.splice(action.payload.fromIndex, 1)
        fieldIds.splice(action.payload.toIndex, 0, moved!)
        return { ...g, fieldIds }
      })
      return { ...state, schema: { ...state.schema, groups }, isDirty: true }
    }

    case 'REORDER_GROUPS': {
      const groups = [...state.schema.groups]
      const [moved] = groups.splice(action.payload.fromIndex, 1)
      groups.splice(action.payload.toIndex, 0, moved!)
      return { ...state, schema: { ...state.schema, groups }, isDirty: true }
    }

    // ── Tab actions ──

    case 'ADD_TAB':
      return { ...state, schema: { ...state.schema, tabs: [...state.schema.tabs, action.payload] }, isDirty: true }

    case 'REMOVE_TAB': {
      const tabs = state.schema.tabs.filter((t) => t.id !== action.payload.id)
      const activeTabId = state.activeTabId === action.payload.id ? null : state.activeTabId
      return { ...state, schema: { ...state.schema, tabs }, isDirty: true, activeTabId }
    }

    case 'UPDATE_TAB': {
      const tabs = state.schema.tabs.map((t) =>
        t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
      )
      return { ...state, schema: { ...state.schema, tabs }, isDirty: true }
    }

    case 'SET_FIELD_TAB': {
      const { fieldId, tabId } = action.payload
      let tabs = state.schema.tabs.map((t) => ({
        ...t, fieldIds: t.fieldIds.filter((fid) => fid !== fieldId),
      }))
      if (tabId) {
        const idx = tabs.findIndex((t) => t.id === tabId)
        if (idx !== -1) {
          tabs[idx]! = { ...tabs[idx]!, fieldIds: [...tabs[idx]!.fieldIds, fieldId] }
        }
      }
      // 互斥：放入 Tab 时从所有容器中移除
      const groups = state.schema.groups.map((g) => ({
        ...g, fieldIds: g.fieldIds.filter((fid) => fid !== fieldId),
      }))
      return { ...state, schema: { ...state.schema, tabs, groups }, isDirty: true }
    }

    case 'SET_GROUP_TAB': {
      const { groupId, tabId } = action.payload
      let tabs = state.schema.tabs.map((t) => ({
        ...t, groupIds: t.groupIds.filter((gid) => gid !== groupId),
      }))
      if (tabId) {
        const idx = tabs.findIndex((t) => t.id === tabId)
        if (idx !== -1) {
          tabs[idx]! = { ...tabs[idx]!, groupIds: [...tabs[idx]!.groupIds, groupId] }
        }
      }
      return { ...state, schema: { ...state.schema, tabs }, isDirty: true }
    }

    case 'REORDER_TABS': {
      const tabs = [...state.schema.tabs]
      const [moved] = tabs.splice(action.payload.fromIndex, 1)
      tabs.splice(action.payload.toIndex, 0, moved!)
      return { ...state, schema: { ...state.schema, tabs }, isDirty: true }
    }

    case 'REORDER_TAB_FIELDS': {
      const tabs = state.schema.tabs.map((t) => {
        if (t.id !== action.payload.tabId) return t
        const fieldIds = [...t.fieldIds]
        const [moved] = fieldIds.splice(action.payload.fromIndex, 1)
        fieldIds.splice(action.payload.toIndex, 0, moved!)
        return { ...t, fieldIds }
      })
      return { ...state, schema: { ...state.schema, tabs }, isDirty: true }
    }

    case 'UPDATE_META':
      return { ...state, schema: { ...state.schema, ...action.payload }, isDirty: true }

    case 'SET_SCHEMA_VERSION':
      return { ...state, schemaVersion: action.payload }

    case 'RESET':
      return { ...initialState, schema: emptyDesign }

    default:
      return state
  }
}

const DesignerContext = createContext<DesignerState | null>(null)
const DispatchContext = createContext<Dispatch<DesignerAction> | null>(null)

/** SchemaDesignerProvider — 设计器状态提供者组件 */
export function SchemaDesignerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(designerReducer, initialState)
  return (
    <DesignerContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </DesignerContext.Provider>
  )
}

/** useSchemaDesigner — 获取设计器状态和 dispatch 的 hook */
export function useSchemaDesigner() {
  const state = useContext(DesignerContext)
  const dispatch = useContext(DispatchContext)
  if (!state || !dispatch) throw new Error('useSchemaDesigner must be used within SchemaDesignerProvider')
  return { state, dispatch }
}

/** createDefaultConfig — 根据字段类型创建默认配置 */
export { createDefaultConfig }
