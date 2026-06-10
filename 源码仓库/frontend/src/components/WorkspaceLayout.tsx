/**
 * WorkspaceLayout.tsx — 工作台布局
 * Author: hongchuwudi
 * Description: 包含侧边栏菜单（按角色动态渲染）+ TopHeader（workspace 模式）+ Outlet 内容区，适配移动端 Drawer
 */

import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Drawer } from 'antd'
import type { MenuProps } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import {
  DatabaseOutlined,
  FormOutlined,
  AuditOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  ExportOutlined,
  FolderOutlined,
  AppstoreOutlined,
  HomeOutlined,
  ThunderboltOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import TopHeader from './TopHeader'
import { useAppStore } from '@/store'

const { Sider, Content } = Layout

interface NavItem {
  key: string
  icon?: React.ReactNode
  label: string
  children?: NavItem[]
}

const OWNER_MENU: NavItem[] = [
  {
    key: 'data', icon: <FolderOutlined />, label: '数据管理',
    children: [
      { key: '/datasets', icon: <DatabaseOutlined />, label: '数据集' },
      { key: '/schema', icon: <FormOutlined />, label: 'Schema 设计器' },
    ],
  },
  {
    key: 'task', icon: <AppstoreOutlined />, label: '标注管理',
    children: [
      { key: '/dashboard', icon: <ThunderboltOutlined />, label: '数据看板' },
      { key: '/tasks', icon: <UnorderedListOutlined />, label: '任务管理' },
      { key: '/exports', icon: <ExportOutlined />, label: '导出中心' },
    ],
  },
  {
    key: 'audit', icon: <AuditOutlined />, label: '审核与质检',
    children: [
      { key: '/ai-configs', icon: <SettingOutlined />, label: 'AI 审核配置' },
      { key: '/ai-review', icon: <AuditOutlined />, label: 'AI 预审监控' },
      { key: '/review', icon: <AuditOutlined />, label: '复审中心' },
    ],
  },
]

const LABELER_MENU: NavItem[] = [
  {
    key: '/labeling', icon: <UnorderedListOutlined />, label: '标注工作台',
    children: [
      { key: '/labeling?tab=square', label: '任务大厅' },
      { key: '/labeling?tab=my', label: '我的任务' },
    ],
  },
  {
    key: 'earnings', icon: <DollarOutlined />, label: '奖励与收益',
    children: [
      { key: '/earnings', label: '我的收益' },
    ],
  },
]

const REVIEWER_MENU: NavItem[] = [
  { key: '/review', icon: <AuditOutlined />, label: '审核中心' },
]

const MENUS: Record<string, NavItem[]> = {
  owner: OWNER_MENU,
  labeler: LABELER_MENU,
  reviewer: REVIEWER_MENU,
}

function toMenuItems(items: NavItem[]): MenuProps['items'] {
  return items.map((item) => {
    if (item.children) {
      return {
        key: item.key,
        icon: item.icon,
        label: item.label,
        children: item.children.map((c) => ({ key: c.key, icon: c.icon, label: c.label })),
      }
    }
    return { key: item.key, icon: item.icon, label: item.label }
  })
}

/** 工作台布局组件，包含侧边栏菜单与移动端 Drawer */
export default function WorkspaceLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAppStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const items = MENUS[user?.role || 'labeler'] || []
  const fullPath = location.pathname + location.search
  const activeKey = fullPath.startsWith('/labeling') ? fullPath : '/' + location.pathname.split('/')[1]

  const openKeys = items
    .filter((item) => item.children)
    .map((item) => item.key)

  const menu = (
    <Menu
      mode="inline"
      inlineCollapsed={collapsed}
      selectedKeys={[activeKey]}
      defaultOpenKeys={collapsed ? [] : openKeys}
      items={toMenuItems(items)}
      onClick={({ key }) => { navigate(key); setDrawerOpen(false) }}
      style={{ border: 'none', padding: '8px 0' }}
    />
  )

  return (
    <Layout style={{ height: '100dvh', overflow: 'hidden' }}>
      <TopHeader variant="workspace" onMenuClick={() => setDrawerOpen(true)} />

      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        <Sider width={200} collapsedWidth={60} collapsible collapsed={collapsed}
          trigger={null} className="workspace-sider">
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>{menu}</div>
            <div style={{ borderTop: '1px solid #f0f0f0' }}>
              <div
                className="sidebar-home-btn"
                onClick={() => navigate('/')}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                <HomeOutlined />
                {!collapsed && <span style={{ marginLeft: 8 }}>返回首页</span>}
              </div>
              <div
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '12px 0', cursor: 'pointer', color: '#6b7280',
                  borderTop: '1px solid #f0f0f0',
                }}
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </div>
            </div>
          </div>
        </Sider>

        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          size="default"
          styles={{ body: { padding: 0 } }}
          closable={false}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontSize: 14, fontWeight: 600 }}>
            Hongc-LabelHub
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 49px)' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>{menu}</div>
            <div
              className="sidebar-home-btn"
              onClick={() => { navigate('/'); setDrawerOpen(false) }}
            >
              <HomeOutlined />
              <span>返回首页</span>
            </div>
          </div>
        </Drawer>

        <Content className="page-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
