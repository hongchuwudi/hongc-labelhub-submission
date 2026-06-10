/**
 * agent.ts — AI 标注员类型定义
 * Author: hongchuwudi
 * Description: 定义 AiAgentItem 及创建/更新 AI 标注员的数据结构
 */

/** AI 标注员 */
export interface AiAgentItem {
  id: number
  name: string
  email: string
  system_prompt: string
  scoring_dimensions: { name: string; label: string; weight: number }[]
  llm_model: string
  created_by: number
  created_at: string
  updated_at: string
}

/** 创建 AI 标注员请求数据 */
export interface CreateAgentData {
  name: string
  email: string
  password: string
  system_prompt: string
  scoring_dimensions: { name: string; label: string; weight: number }[]
  llm_model?: string
}

/** 更新 AI 标注员请求数据 */
export interface UpdateAgentData {
  name?: string
  system_prompt?: string
  scoring_dimensions?: { name: string; label: string; weight: number }[]
  llm_model?: string
}
