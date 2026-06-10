/**
 * App.tsx — 根路由组件
 * Author: hongchuwudi
 * Description: 定义应用所有路由配置，包含公共页/工作台/登录等路由层级
 */

import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import WorkspaceLayout from './components/WorkspaceLayout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import Datasets from './pages/Datasets'
import SchemaDesigner from './pages/SchemaDesigner'
import TaskManage from './pages/TaskManage'
import Labeling from './pages/Labeling'
import Review from './pages/Review'
import AiConfigs from './pages/AiConfigs'
import AiReviewMonitor from './pages/AiReview'
import ExportHistory from './pages/ExportHistory'
import Dashboard from './pages/Dashboard'
import Earnings from './pages/Earnings'
import Login from './pages/Login'
import HomePage from './pages/Home'
import TutorialPage from './pages/Tutorial'
import { useAppStore } from '@/store'

function Home() {
  return <HomePage />
}

function Architecture() {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>系统架构</h1>
      <p style={{ color: '#6b7280', marginTop: 8 }}>架构介绍内容即将上线</p>
    </div>
  )
}

function NotFound() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column' }}>
      <div style={{ fontSize: 80, fontWeight: 800, color: '#e5e7eb', lineHeight: 1 }}>404</div>
      <div style={{ fontSize: 18, color: '#374151', margin: '12px 0 24px' }}>页面不存在</div>
      <a href="/" style={{ color: '#4f46e5', fontSize: 14 }}>返回首页</a>
    </div>
  )
}

function LoadingPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid #e5e7eb', borderTopColor: '#4f46e5',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )
}

/** 根应用组件，初始化认证并渲染路由树 */
export default function App() {
  const initAuth = useAppStore((s) => s.initAuth)

  useEffect(() => { initAuth() }, [initAuth])

  return (
    <Routes>
      {/* 无需导航 — 独立布局页 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />

      {/* 公共页 — 顶部导航 + 全宽内容 */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tutorial" element={<TutorialPage />} />
        <Route path="/architecture" element={<Architecture />} />
      </Route>

      {/* 加载过渡页 */}
      <Route path="/loading" element={<LoadingPage />} />

      {/* 工作台 — 受保护 + 侧边栏 */}
      <Route element={<ProtectedRoute />}>
        <Route element={<WorkspaceLayout />}>
          <Route element={<RoleRoute role="owner" />}>
            <Route path="/datasets/*" element={<Datasets />} />
            <Route path="/schema/*" element={<SchemaDesigner />} />
            <Route path="/tasks/*" element={<TaskManage />} />
            <Route path="/exports" element={<ExportHistory />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ai-configs" element={<AiConfigs />} />
            <Route path="/ai-review" element={<AiReviewMonitor />} />
          </Route>
          <Route element={<RoleRoute role={["owner", "reviewer"]} />}>
            <Route path="/review/*" element={<Review />} />
          </Route>
          <Route element={<RoleRoute role={["owner", "labeler"]} />}>
            <Route path="/labeling/*" element={<Labeling />} />
            <Route path="/earnings" element={<Earnings />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
