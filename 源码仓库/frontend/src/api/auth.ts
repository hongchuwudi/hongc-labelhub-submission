/**
 * auth.ts — 认证 API
 * Author: hongchuwudi
 * Description: 提供登录、注册、获取当前用户信息接口
 */

import apiClient from './client'
import type { ApiResponse, TokenPair, LoginRequest, RegisterRequest } from '@/types/api'
import type { User } from '@/types'

/** POST /auth/login */
export function loginApi(body: LoginRequest): Promise<ApiResponse<TokenPair>> {
  return apiClient.post<ApiResponse<TokenPair>, ApiResponse<TokenPair>, LoginRequest>('/auth/login', body)
}

/** POST /auth/register */
export function registerApi(body: RegisterRequest): Promise<ApiResponse<TokenPair>> {
  return apiClient.post<ApiResponse<TokenPair>, ApiResponse<TokenPair>, RegisterRequest>('/auth/register', body)
}

/** GET /auth/me */
export function getMeApi(): Promise<ApiResponse<User>> {
  return apiClient.get<ApiResponse<User>, ApiResponse<User>>('/auth/me')
}
