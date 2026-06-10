/** index.tsx — 注册页
 * Author: hongchuwudi
 * Description: 用户注册页面，表单包含姓名/邮箱/密码/角色选择
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Select, App } from 'antd'
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store'
import { registerApi, getMeApi } from '@/api/auth'
import AuthLayout from '@/components/AuthLayout'
import type { RegisterRequest } from '@/types/api'

/** 注册页面主组件 */
export default function Register() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setTokens, setUser } = useAppStore()
  const { message } = App.useApp()

  const onFinish = async (values: RegisterRequest) => {
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="注册">
      <Form<RegisterRequest> layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
        <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input prefix={<UserOutlined />} placeholder="姓名" />
        </Form.Item>
        <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}>
          <Input prefix={<MailOutlined />} placeholder="邮箱" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少 6 位' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="密码" />
        </Form.Item>
        <Form.Item name="role" initialValue="labeler" rules={[{ required: true, message: '请选择角色' }]}>
          <Select
            options={[
              { value: 'owner', label: '任务负责人 (Owner)' },
              { value: 'labeler', label: '标注员 (Labeler)' },
              { value: 'reviewer', label: '审核员 (Reviewer)' },
            ]}
            placeholder="选择角色"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>注册</Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
        已有账号？<Link to="/login">立即登录</Link>
      </div>
    </AuthLayout>
  )
}
