/**
 * TopHeader.tsx — 可复用顶部导航栏
 * Author: hongchuwudi
 * Description: 支持 public（首页/教程）和 workspace（汉堡+侧边栏联动）两种模式，含用户信息与登出
 */

import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Avatar, Dropdown, Button } from 'antd'
import { LogoutOutlined, MenuOutlined, SwapOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store'

const WS = ['/datasets', '/schema', '/tasks', '/labeling', '/review', '/ai-configs']
const inWorkspace = (path: string) => WS.some((p) => path.startsWith(p))

// Props: variant 控制导航模式，onMenuClick 供移动端汉堡回调
interface Props {
  variant?: 'public' | 'workspace'
  onMenuClick?: () => void
}

/** 顶部导航栏组件 */
export default function TopHeader({ variant = 'public', onMenuClick }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAppStore()

  const isWorkspace = useMemo(() => inWorkspace(location.pathname), [location.pathname])
  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="top-header">
      <div className="top-header-inner">
        {/* 移动端汉堡 */}
        {variant === 'workspace' && (
          <Button type="text" className="hamburger-btn" icon={<MenuOutlined />} onClick={onMenuClick} />
        )}

        {/* Logo */}
        <div className="header-logo" onClick={() => navigate(variant === 'workspace' ? '/datasets' : '/')}>
          <div className="header-logo-icon">L</div>
          <span className="header-logo-text">Hongc-LabelHub</span>
        </div>

        {/* 公共路由链接 — 仅公共页显示 */}
        {variant === 'public' && (
          <nav className="desktop-nav">
            <button
              className={`nav-btn${isActive('/') ? ' active' : ''}`}
              onClick={() => navigate('/')}
            >首页</button>
            <button
              className={`nav-btn${isActive('/tutorial') ? ' active' : ''}`}
              onClick={() => navigate('/tutorial')}
            >教程</button>
          </nav>
        )}

        <div style={{ flex: 1 }} />

        {/* 工作台入口/退出 — 公共页进入，工作台内退出 */}
        <button
          className={`nav-btn${isWorkspace ? ' active' : ''}`}
          onClick={() => navigate(isWorkspace ? '/' : '/datasets')}
        >
          {isWorkspace ? <><SwapOutlined /> 返回首页</> : '工作台'}
        </button>

        {/* 用户 */}
        <Dropdown
          menu={{
            items: [
              {
                key: 'info', label: (
                  <div style={{ padding: '2px 0' }}>
                    <div style={{ fontWeight: 500 }}>{user?.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {user?.role === 'owner' ? '管理员' : user?.role === 'reviewer' ? '审核员' : '标注员'}
                    </div>
                  </div>
                ),
                disabled: true,
              },
              { type: 'divider' },
              { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
            ],
            onClick: ({ key }) => { if (key === 'logout') handleLogout() },
          }}
          placement="bottomRight"
          trigger={['click']}
        >
          <div className="header-user">
            <Avatar size={26} style={{ background: '#4f46e5', fontSize: 11, flexShrink: 0 }}>
              {(user?.name || '管')[0]}
            </Avatar>
            <span className="header-user-name">{user?.name || '未登录'}</span>
          </div>
        </Dropdown>
      </div>
    </header>
  )
}
