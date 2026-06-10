/**
 * types/index.ts — 类型统一出口
 * Author: hongchuwudi
 * Description: 汇集所有模型类型与 API 类型，对外统一导出
 */

// 统一出口：所有类型从这里 import
export type { ApiResponse, PageData, TokenPair, LoginRequest, RegisterRequest } from './api'

// models
export type { User } from './models/user'
export type { Dataset, DatasetItem, DatasetRecord, ApiDatasetItem } from './models/dataset'
export type { LabelSchema, SchemaListItem, SchemaDetail } from './models/schema'
export type {
  LabelTask,
  LabelResult,
  TaskListItem,
  TaskDetail,
  CreateTaskData,
  UpdateTaskData,
  SubmitResultData,
  TaskItemResponse,
  TaskItemDetail,
  LabelerStats,
  LabelResultItem,
  AuditLogEntry,
  ExportJob,
} from './models/task'
export type { AiAgentItem, CreateAgentData, UpdateAgentData } from './models/agent'
export type { AiConfigItem } from './models/ai-config'
export type { AiScoreData } from './models/ai'
export type { FieldDef, SchemaField, SchemaTab, SchemaGroup } from './models/field'
