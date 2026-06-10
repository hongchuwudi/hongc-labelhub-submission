/** types.ts — Schema 设计器类型定义
 * Author: hongchuwudi
 * Description: 定义 Schema Designer 的所有类型、接口和 reducer action
 */

/** 组件类型枚举 */
export type FieldType =
  | 'text'       // 单行输入
  | 'textarea'   // 多行文本
  | 'radio'      // 单选
  | 'checkbox'   // 多选
  | 'select'     // 下拉选择
  | 'upload'     // 文件/图片上传
  | 'richtext'   // 富文本
  | 'json'       // JSON 编辑器
  | 'llm'        // LLM 交互组件
  | 'showitem'   // 展示项（只读，不提交）

/** 面板分类 */
export type FieldCategory = 'input' | 'select' | 'media' | 'advanced' | 'display'

/** 标签页 */
export interface TabConfig {
  id: string
  title: string
  fieldIds: string[]
  groupIds: string[]
}

/** 字段选项 */
export interface FieldOption {
  label: string
  value: string
}

/** 校验规则 */
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max'
  value?: string | number
  message: string
}

/** 字段联动 */
export interface FieldLinkage {
  targetField: string
  condition: 'equals' | 'notEquals' | 'in'
  value: unknown
  action: 'visible' | 'hidden' | 'required'
}

/** 单个字段完整配置 */
export interface FieldConfig {
  id: string
  type: FieldType
  key: string
  title: string
  description?: string
  placeholder?: string
  required: boolean
  defaultValue?: unknown
  options?: FieldOption[]
  multiple?: boolean
  accept?: string
  maxCount?: number
  maxLength?: number
  rows?: number
  rules?: ValidationRule[]
  linkage?: FieldLinkage[]
  colSpan?: number
  textAlign?: 'left' | 'center' | 'right'
}

/** 分组容器 */
export interface GroupConfig {
  id: string
  title: string
  fieldIds: string[]
}

/** 设计器内部状态 */
export interface SchemaDesign {
  title: string
  description: string
  fields: FieldConfig[]
  groups: GroupConfig[]
  tabs: TabConfig[]
}

/** 面板项元数据 */
export type PaletteItemType = FieldType

export interface PaletteItem {
  type: PaletteItemType
  category: FieldCategory
  label: string
  icon: string
}

/** 设计器 UI 状态 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface DesignerState {
  schema: SchemaDesign
  selectedFieldId: string | null
  selectedGroupId: string | null
  isDirty: boolean
  previewVisible: boolean
  jsonViewVisible: boolean
  saveStatus: SaveStatus
  schemaId: number | null
  schemaVersion: number
  updatedAt: string | null
  hoveredGroupId: string | null
  activeTabId: string | null
}

/** Reducer Action */
export type DesignerAction =
  | { type: 'LOAD_SCHEMA'; payload: SchemaDesign }
  | { type: 'ADD_FIELD'; payload: { field: FieldConfig; index?: number } }
  | { type: 'UPDATE_FIELD'; payload: { id: string; updates: Partial<FieldConfig> } }
  | { type: 'REMOVE_FIELD'; payload: { id: string } }
  | { type: 'DUPLICATE_FIELD'; payload: { id: string } }
  | { type: 'REORDER_FIELDS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SELECT_FIELD'; payload: { id: string | null } }
  | { type: 'SELECT_GROUP'; payload: { id: string | null } }
  | { type: 'SET_PREVIEW'; payload: boolean }
  | { type: 'SET_JSON_VIEW'; payload: boolean }
  | { type: 'SET_SAVE_STATUS'; payload: SaveStatus }
  | { type: 'SET_SCHEMA_ID'; payload: number | null }
  | { type: 'SET_UPDATED_AT'; payload: string | null }
  | { type: 'SET_SCHEMA_VERSION'; payload: number }
  | { type: 'UPDATE_META'; payload: { title?: string; description?: string } }
  | { type: 'ADD_GROUP'; payload: GroupConfig }
  | { type: 'REMOVE_GROUP'; payload: { id: string } }
  | { type: 'UPDATE_GROUP'; payload: { id: string; updates: Partial<GroupConfig> } }
  | { type: 'SET_FIELD_GROUP'; payload: { fieldId: string; groupId: string | null } }
  | { type: 'REORDER_GROUP_FIELDS'; payload: { groupId: string; fromIndex: number; toIndex: number } }
  | { type: 'REORDER_GROUPS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'ADD_TAB'; payload: TabConfig }
  | { type: 'REMOVE_TAB'; payload: { id: string } }
  | { type: 'UPDATE_TAB'; payload: { id: string; updates: Partial<TabConfig> } }
  | { type: 'SET_FIELD_TAB'; payload: { fieldId: string; tabId: string | null } }
  | { type: 'SET_GROUP_TAB'; payload: { groupId: string; tabId: string | null } }
  | { type: 'REORDER_TABS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'REORDER_TAB_FIELDS'; payload: { tabId: string; fromIndex: number; toIndex: number } }
  | { type: 'SET_HOVERED_GROUP'; payload: string | null }
  | { type: 'SET_ACTIVE_TAB'; payload: string | null }
  | { type: 'RESET' }
