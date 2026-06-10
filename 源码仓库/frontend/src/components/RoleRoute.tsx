/**
 * RoleRoute.tsx — 角色路由守卫
 * Author: hongchuwudi
 * Description: 检查用户角色是否匹配，不匹配时跳转 /labeling
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAppStore } from '@/store'

/** 角色路由守卫，角色不匹配时跳转 /labeling */
export default function RoleRoute({ role }: { role: string | string[] }) {
  const user = useAppStore((s) => s.user)
  const roles = Array.isArray(role) ? role : [role]

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/labeling" replace />
  }

  return <Outlet />
}
