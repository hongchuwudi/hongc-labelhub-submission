/**
 * AppLayout.tsx — 公共页布局
 * Author: hongchuwudi
 * Description: 公共页面外层布局：TopHeader（public 模式）+ Outlet 内容区
 */

import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import TopHeader from './TopHeader'

const { Content } = Layout

// 公共页面布局容器，不含侧边栏
export default function AppLayout() {
  return (
    <Layout style={{ height: '100dvh', overflow: 'hidden' }}>
      <TopHeader variant="public" />
      <Content className="page-content">
        <Outlet />
      </Content>
    </Layout>
  )
}
