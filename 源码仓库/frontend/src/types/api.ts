/**
 * api.ts — 通用 API 类型定义
 * Author: hongchuwudi
 * Description: 定义后端统一响应格式、分页响应、令牌对及认证请求体
 */

/** 后端统一响应格式 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页响应 */
export interface PageData<T> {
  total: number
  page: number
  page_size: number
  items: T[]
}

/** 双 JWT 令牌对 */
export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

/** POST /auth/login 请求体 */
export interface LoginRequest {
  email: string
  password: string
}

/** POST /auth/register 请求体 */
export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: string
}
