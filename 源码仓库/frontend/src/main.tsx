/**
 * main.tsx — 应用入口
 * Author: hongchuwudi
 * Description: React 应用挂载点，配置 Ant Design 主题、路由及国际化
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#3b82f6',
          borderRadius: 8,
          borderRadiusLG: 10,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          fontSize: 14,
          controlHeight: 36,
          lineHeight: 1.6,
          colorBgContainer: '#ffffff',
          colorBorder: '#e5e7eb',
          colorText: '#1a1a2e',
          colorTextSecondary: '#6b7280',
        },
        components: {
          Table: {
            headerBg: '#f9fafb',
            headerColor: '#6b7280',
            rowHoverBg: '#f9fafb',
            borderColor: '#e5e7eb',
          },
          Card: {
            paddingLG: 24,
          },
          Button: {
            primaryShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
          },
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>,
)
