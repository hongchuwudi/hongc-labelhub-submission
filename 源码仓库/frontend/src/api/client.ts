/**
 * client.ts — Axios HTTP 客户端封装
 * Author: hongchuwudi
 * Description: 创建 Axios 实例，统一处理请求/响应拦截、Token 自动携带、401 自动刷新
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAppStore } from '@/store'
import type { ApiResponse } from '@/types'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器：自动带 Access Token
apiClient.interceptors.request.use((config) => {
  const tokens = useAppStore.getState().tokens
  if (tokens?.access_token) {
    config.headers.Authorization = `Bearer ${tokens.access_token}`
  }
  return config
})

// refresh 防竞态：多个 401 同时到达时共用同一个刷新 Promise
let refreshPromise: Promise<{ access_token: string; refresh_token: string }> | null = null

// 响应拦截器：统一解包 data，token 过期自动刷新
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<{ message?: string }>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const tokens = useAppStore.getState().tokens

      // 已登录 → 尝试续签
      if (tokens?.refresh_token) {
        try {
          if (!refreshPromise) {
            refreshPromise = axios
              .post<ApiResponse<{ access_token: string; refresh_token: string; token_type: string }>>(
                '/api/auth/refresh',
                { refresh_token: tokens.refresh_token },
              )
              .then((res) => {
                useAppStore.getState().setTokens(res.data.data!)
                return res.data.data!
              })
              .finally(() => { refreshPromise = null })
          }
          const newTokens = await refreshPromise
          original.headers.Authorization = `Bearer ${newTokens.access_token}`
          return apiClient(original)
        } catch {
          refreshPromise = null
          useAppStore.getState().logout()
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?reason=expired'
          }
          return Promise.reject(new Error('登录已过期，请重新登录'))
        }
      }

      // 未登录且在公开页（登录/注册）→ 不跳转，把错误交给调用方显示
      if (window.location.pathname === '/login' || window.location.pathname === '/register') {
        const msg = error.response?.data?.message || '请求失败'
        return Promise.reject(new Error(msg))
      }

      // 未登录且不在公开页 → 跳转登录
      useAppStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(new Error('请先登录'))
    }

    const msg = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(msg))
  },
)

export default apiClient
