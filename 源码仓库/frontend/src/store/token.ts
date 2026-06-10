/**
 * token.ts — Token 本地持久化工具
 * Author: hongchuwudi
 * Description: 提供 Token 对在 localStorage 的读写操作
 */

import type { TokenPair } from '@/types'

const TOKEN_KEY = 'labelhub_tokens'

// 从 localStorage 读取 Token 对，解析失败返回 null
export function loadTokens(): TokenPair | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// 将 Token 对写入 localStorage，tokens 为 null 时清除
export function saveTokens(tokens: TokenPair | null) {
  if (tokens) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}
