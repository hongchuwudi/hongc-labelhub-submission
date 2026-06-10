/**
 * AuthLayout.tsx — 登录/注册页公共布局
 * Author: hongchuwudi
 * Description: 渐变背景 + 品牌 Logo + 白色卡片容器
 */

import type { ReactNode } from 'react'

// Props: title 为卡片标题，children 为表单内容
interface Props {
  title: string
  children: ReactNode
}

/** 登录/注册页的公共布局组件 */
export default function AuthLayout({ title, children }: Props) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.brand}>
        <div style={styles.logo}>L</div>
        <h1 style={styles.titleText}>LabelHub</h1>
        <p style={styles.subtitle}>AI 数据标注平台</p>
      </div>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  brand: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#fff',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 800,
    color: '#fff',
    margin: '0 auto 16px',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    margin: '4px 0 0',
  },
  card: {
    width: 420,
    maxWidth: '90vw',
    background: '#fff',
    borderRadius: 16,
    padding: '40px 36px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: 28,
    color: '#1a1a2e',
  },
}
