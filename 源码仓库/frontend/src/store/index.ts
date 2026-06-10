/**
 * store/index.ts — 全局状态管理（Zustand）
 * Author: hongchuwudi
 * Description: 使用 Zustand 管理用户、Token 及认证状态，提供 initAuth 登录态恢复
 */

import { create } from 'zustand'
import type { User, TokenPair } from '@/types'
import { loadTokens, saveTokens } from './token'

// 全局应用状态接口
interface AppState {
  user: User | null
  tokens: TokenPair | null
  authReady: boolean
  setUser: (user: User | null) => void
  setTokens: (tokens: TokenPair | null) => void
  logout: () => void
  isLoggedIn: () => boolean
  initAuth: () => Promise<void>
}

// Zustand store — 全局唯一状态管理器
export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  tokens: loadTokens(),
  authReady: false,

  setUser: (user) => set({ user }),

  setTokens: (tokens) => { saveTokens(tokens); set({ tokens }) },

  logout: () => { saveTokens(null); set({ user: null, tokens: null }) },

  isLoggedIn: () => !!(get().tokens?.access_token),

  initAuth: async () => {
    const tokens = get().tokens
    if (!tokens?.access_token) { set({ authReady: true }); return }
    try {
      const { getMeApi } = await import('@/api/auth')
      const res = await getMeApi()
      set({ user: res.data, authReady: true })
    } catch {
      // Access Token 过期 → 尝试用 Refresh Token 续签
      if (tokens?.refresh_token) {
        try {
          const { default: axios } = await import('axios')
          const { data } = await axios.post('/api/auth/refresh', { refresh_token: tokens.refresh_token })
          if (data.data) {
            saveTokens(data.data)
            set({ tokens: data.data })
            const { getMeApi } = await import('@/api/auth')
            const res = await getMeApi()
            set({ user: res.data, authReady: true })
            return
          }
        } catch { /* refresh also failed, fall through to logout */ }
      }
      saveTokens(null)
      set({ tokens: null, user: null, authReady: true })
    }
  },
}))
