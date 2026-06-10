/**
 * user.ts — 平台用户类型定义
 * Author: hongchuwudi
 * Description: 定义 User 接口，包含 id / name / role / email / avatar
 */

/** 平台用户 */
export interface User {
  id: number
  name: string
  role: 'owner' | 'labeler' | 'reviewer' | 'ai_agent'
  email: string
  avatar: string
}
