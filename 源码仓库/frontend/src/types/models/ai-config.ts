/**
 * ai-config.ts — AI 审核配置类型定义（已废弃）
 * Author: hongchuwudi
 * Description: 定义 AiConfigItem，仅保留用于兼容旧数据
 */

/** AI 配置（已废弃，保留仅用于旧数据兼容） */
export interface AiConfigItem {
  id: number
  name: string
  system_prompt: string
  scoring_dimensions: { name: string; label: string; weight: number }[]
  llm_model: string
  created_by: number
  created_at: string
  updated_at: string
}
