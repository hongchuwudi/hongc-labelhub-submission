/** index.tsx — 登录/注册页
 * Author: hongchuwudi
 * Description: 登录 + 注册双模式页面，左侧表单右侧品牌展示区
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Form, Input, Button, App, Alert, Select } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store'
import { loginApi, registerApi, getMeApi } from '@/api/auth'
import type { LoginRequest, RegisterRequest } from '@/types/api'

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

/** 登录/注册页面主组件，支持登录与注册表单切换 */
export default function Login() {
  const mobile = useIsMobile()
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setTokens, setUser } = useAppStore()
  const { message } = App.useApp()

  const handleLogin = async (values: LoginRequest) => {
    setLoading(true)
    try {
      const res = await loginApi(values)
      setTokens(res.data)
      try { localStorage.setItem('lh_remember', values.email) } catch { /* */ }
      const me = await getMeApi()
      setUser(me.data)
      message.success('登录成功')
      navigate('/datasets', { replace: true })
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '登录失败')
    } finally { setLoading(false) }
  }

  const handleRegister = async (values: RegisterRequest) => {
    setLoading(true)
    try {
      const res = await registerApi(values)
      setTokens(res.data)
      const me = await getMeApi()
      setUser(me.data)
      message.success('注册成功')
      navigate('/datasets', { replace: true })
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '注册失败')
    } finally { setLoading(false) }
  }

  const defaultEmail = (() => {
    try { return localStorage.getItem('lh_remember') || '' } catch { return '' }
  })()

  const formArea = (
    <div style={{ width: '100%', maxWidth: mobile ? '100%' : 340 }}>
      {/* Logo */}
      <div style={s.logoRow}>
        <div style={s.logoIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#4f46e5"/>
            <path d="M12 22V12" stroke="#fff" strokeWidth="2"/>
            <path d="M3 7l9 5" stroke="#fff" strokeWidth="2"/>
            <path d="M21 7l-9 5" stroke="#fff" strokeWidth="2"/>
          </svg>
        </div>
        <span style={s.logoText}>LabelHub</span>
      </div>

      <h1 style={s.title}>欢迎回来</h1>
      <p style={s.subtitle}>登录您的账户继续标注工作</p>

      {/* 胶囊切换 */}
      <div style={s.tabRow}>
        <button onClick={() => setTab('login')}
          style={{ ...s.tabBtn, ...(tab === 'login' ? s.tabActive : s.tabInactive) }}
        >登录</button>
        <button onClick={() => setTab('register')}
          style={{ ...s.tabBtn, ...(tab === 'register' ? s.tabActive : s.tabInactive) }}
        >注册</button>
      </div>

      {searchParams.get('reason') === 'expired' && (
        <Alert message="登录已过期，请重新登录" type="info" showIcon style={{ marginBottom: 20, borderRadius: 8 }} />
      )}

      {tab === 'login' ? (
        <Form<LoginRequest> onFinish={handleLogin} initialValues={{ email: defaultEmail }}>
          <Form.Item name="email" rules={[{ required: true }, { type: 'email' }]}>
            <Input prefix={<MailOutlined style={{ color: '#9ca3af' }} />} placeholder="邮箱地址" style={s.input} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockIcon />} placeholder="密码"
              style={s.input} iconRender={(v) => v ? <EyeIcon /> : <EyeOffIcon />} />
          </Form.Item>
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <a style={{ fontSize: 13, color: '#4f46e5', cursor: 'pointer' }}>忘记密码？</a>
          </div>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={s.cta}>登录</Button>
          </Form.Item>
        </Form>
      ) : (
        <Form<RegisterRequest> onFinish={handleRegister}>
          <Form.Item name="name" rules={[{ required: true }]}>
            <Input prefix={<UserIcon />} placeholder="姓名" style={s.input} />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true }, { type: 'email' }]}>
            <Input prefix={<MailOutlined style={{ color: '#9ca3af' }} />} placeholder="邮箱地址" style={s.input} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }, { min: 6 }]}>
            <Input.Password prefix={<LockIcon />} placeholder="密码（至少 6 位）"
              style={s.input} iconRender={(v) => v ? <EyeIcon /> : <EyeOffIcon />} />
          </Form.Item>
          <Form.Item name="role" initialValue="labeler" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'owner', label: '任务负责人 (Owner)' },
                { value: 'labeler', label: '标注员 (Labeler)' },
                { value: 'reviewer', label: '审核员 (Reviewer)' },
              ]}
              placeholder="选择角色"
              style={{ height: 46 }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={s.cta}>创建账号</Button>
          </Form.Item>
        </Form>
      )}

      <div style={s.terms}>
        <span style={s.termsCircle}>○</span>
        <span style={s.termsText}>
          {tab === 'login' ? '登录' : '注册'}即表示您同意 LabelHub 的服务条款和隐私政策
        </span>
      </div>
    </div>
  )

  const heroArea = (
    <div style={{ ...s.hero, maxWidth: mobile ? '100%' : 540 }}>
      <h1 style={{ ...s.heroTitle, fontSize: mobile ? 26 : 42 }}>高效的数据标注平台</h1>
      <p style={{ ...s.heroSub, fontSize: mobile ? 14 : 16, marginBottom: mobile ? 32 : 48 }}>
        可视化搭建 Schema · AI 自动预审 · 多角色流转审核 · 多格式数据导出
      </p>

      <div style={s.terminal}>
        <div style={s.termHeader}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>LabelHub Console</span>
          <span />
        </div>
        <div style={s.termBody}>
          <div style={s.termLine}><span style={s.termPrompt}>$</span> labelhub task create --title "商品标注任务"</div>
          <div style={{ ...s.termLine, color: '#34d399' }}>✓ 任务已创建，ID: 42，状态: 发布中</div>
          <div style={s.termLine}><span style={s.termPrompt}>$</span> labelhub review --batch-approve</div>
          <div style={{ ...s.termLine, color: '#e2e8f0' }}>审核中... AI 预审通过率 87.3%</div>
          <div style={{ ...s.termLine, color: '#34d399' }}>✓ 批量审核完成，23 条入库</div>
          <div style={s.termLine}><span style={s.termPrompt}>$</span><span style={s.cursor}>▌</span></div>
        </div>
      </div>

      <div style={{ ...s.tags, justifyContent: mobile ? 'center' : 'flex-start' }}>
        <span style={s.tag}>Schema 可视化搭建</span>
        <span style={s.tag}>AI 自动预审</span>
        <span style={s.tag}>多角色审核流转</span>
        <span style={s.tag}>多格式导出</span>
      </div>
    </div>
  )

  return (
    <div style={{
      ...s.root,
      flexDirection: mobile ? 'column' : 'row',
    }}>
      {/* 移动端：表单在上，品牌在下 */}
      {mobile ? (
        <>
          <div style={{ background: '#fff', padding: '60px 24px 0', display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
            {formArea}
          </div>
          <div style={{
            background: 'linear-gradient(180deg, #fdfbf7 0%, #f9f0e8 100%)',
            padding: '40px 24px 60px', display: 'flex', justifyContent: 'center',
          }}>
            {heroArea}
          </div>
        </>
      ) : (
        <>
          <div style={s.left}>
            <div style={{ width: 340 }}>
              {formArea}
            </div>
          </div>
          <div style={s.right}>
            {heroArea}
          </div>
        </>
      )}
    </div>
  )
}

// ── 内联图标 ──

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

// ── 样式 ──

const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex', minHeight: '100vh', width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  },
  // 左侧
  left: {
    flex: '0 0 440px', width: 440, background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 },
  logoIcon: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontWeight: 700, color: '#111827' },
  title: { fontSize: 28, fontWeight: 700, color: '#111827', margin: '0 0 6px', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#9ca3af', margin: '0 0 24px' },
  tabRow: { display: 'inline-flex', background: '#f1f5f9', borderRadius: 10, padding: 3, marginBottom: 28 },
  tabBtn: { border: 'none', borderRadius: 8, padding: '8px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all .15s' },
  tabActive: { background: '#fff', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  tabInactive: { background: 'transparent', color: '#9ca3af' },
  input: { height: 46, borderRadius: 8, fontSize: 14, background: '#F3F6FD', border: '1px solid transparent' },
  cta: { height: 46, borderRadius: 8, fontSize: 15, fontWeight: 600, background: '#4f46e5', border: 'none' },
  terms: { display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 24 },
  termsCircle: { color: '#d1d5db', fontSize: 16, lineHeight: '18px', flexShrink: 0 },
  termsText: { fontSize: 11, color: '#9ca3af', lineHeight: 1.6 },
  // 右侧
  right: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(160deg, #fdfbf7 0%, #f9f0e8 30%, #f5e6d8 60%, #fdf0e8 100%)',
    padding: 60,
  },
  hero: { width: '100%' },
  heroTitle: { fontWeight: 800, color: '#111827', margin: '0 0 12px', letterSpacing: -1, lineHeight: 1.15 },
  heroSub: { color: '#6b7280', margin: 0, lineHeight: 1.6 },
  terminal: {
    background: '#1a1a2e', borderRadius: 12, overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginBottom: 24,
  },
  termHeader: { background: '#2d2d44', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  termBody: { padding: '18px 20px', fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: 13, lineHeight: 2 },
  termLine: { color: '#e2e8f0', whiteSpace: 'pre' },
  termPrompt: { color: '#34d399', marginRight: 8 },
  cursor: { color: '#4f46e5', animation: 'blink 1s infinite' },
  tags: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  tag: { padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500, background: '#fff', border: '1px solid rgba(0,0,0,0.06)', color: '#374151' },
}
