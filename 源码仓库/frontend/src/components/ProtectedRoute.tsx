/**
 * ProtectedRoute.tsx — 路由守卫
 * Author: hongchuwudi
 * Description: 检查 tokens 是否存在，未登录时重定向到 /login，加载中显示 loading
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAppStore } from '@/store'

/** 路由守卫，未登录时重定向到 /login */
export default function ProtectedRoute() {
  const tokens = useAppStore((s) => s.tokens)
  const authReady = useAppStore((s) => s.authReady)

  if (!authReady) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#9ca3af' }}>加载中...</div>
  }

  if (!tokens?.access_token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
