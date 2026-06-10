/** index.tsx — 标注任务路由入口
 * Author: hongchuwudi
 * Description: 嵌套路由：任务大厅 /labeling 与标注工作台 /labeling/:taskId
 */
import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import { Table, Button, Tag, Space, App, Progress, Modal, Descriptions, InputNumber, Input } from 'antd'
import { ThunderboltOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store'
import { listTasksApi, claimTaskApi, type TaskListItem } from '@/api/tasks'
import dayjs from 'dayjs'
import Workbench from './Workbench'

/**
 * 内联 useIsMobile 而非抽取到 hooks/ ——
 * 当前只有本页和 TaskManage 用到，且逻辑仅 5 行，
 * 过早抽象到共享模块反而增加追溯成本。
 */
function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

/**
 * 标签色板 —— 固定 8 色循环，保证同一任务在不同视图下标签颜色一致。
 * 不做动态 hash，避免同标签在不同位置变色造成认知负担。
 */
const TAG_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16']

/** 任务标签在后端以逗号分隔字符串存储，前端拆分为数组渲染 Tag 组件。 */
const parseTags = (t: string) => t ? t.split(',').map((s) => s.trim()).filter(Boolean) : []

/**
 * 任务大厅（路由 /labeling?tab=square|my）：
 * 视图切换通过顶部导航栏的 Select 下拉控制，不在页面内占用纵向空间。
 * 默认展示"任务大厅"（待认领池），?tab=my 展示当前用户已认领的任务。
 */
function TaskSquare() {
  const user = useAppStore((s) => s.user)
  const navigate = useNavigate()
  const mobile = useIsMobile()
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'square'
  const isMyTab = activeTab === 'my'

  const [pubTasks, setPubTasks] = useState<TaskListItem[]>([])
  const [myTasks, setMyTasks] = useState<TaskListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<TaskListItem | null>(null)
  const [claimTask, setClaimTask] = useState<TaskListItem | null>(null)
  const [claimCount, setClaimCount] = useState<number>(10)
  const [claiming, setClaiming] = useState(false)
  const [searchText, setSearchText] = useState('')

  /** 两路并行拉取，不串行 —— 否则 2×RTT 会造成不必要的加载延迟。 */
  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [pubRes, myRes] = await Promise.all([
        listTasksApi({ status: 'published', page_size: 100 }),
        listTasksApi({ assignee_id: user.id, page_size: 100 }),
      ])
      setPubTasks(pubRes.data.items.filter((t) => t.assignee_id !== user.id))
      setMyTasks(myRes.data.items)
      setSearchText('')
    } catch { message.error('加载失败') }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  /** 认领后立即刷新两个列表 —— 任务会从大厅移至"我的任务"，必须同步去重。 */
  const handleClaim = async (taskId: number, count?: number) => {
    if (!user) return
    setClaiming(true)
    try { await claimTaskApi(taskId, count); message.success('认领成功'); fetchData(); setClaimTask(null) }
    catch (e: unknown) { message.error(e instanceof Error ? e.message : '认领失败') }
    finally { setClaiming(false) }
  }

  const openClaim = (task: TaskListItem) => {
    if (task.distribution_strategy === 'quota_grab') {
      setClaimTask(task)
      setClaimCount(task.grab_limit || 10)
    } else {
      handleClaim(task.id)
    }
  }

  /**
   * 列配置：桌面端展示标签/策略/进度/截止共 7 列；
   * 移动端(≤768px)仅保留"任务名称"和"操作"两列，
   * 其余信息通过点击名称弹出的详情 Modal 查看。
   * 用 spread 条件注入而非两个独立数组，避免任务名称和操作列定义重复。
   */
  const mkCols = (isMy: boolean) => [
    { title: '任务名称', dataIndex: 'title', ellipsis: true,
      render: (t: string, r: TaskListItem) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setDetail(r)}>{t}</Button>
      ),
    },
    ...(mobile ? [] : [
      {
        title: '标签', dataIndex: 'tags', width: '12%',
        render: (t: string) => t ? (
          <Space size={2} wrap>{parseTags(t).map((tag, i) => <Tag key={i} color={TAG_COLORS[i % TAG_COLORS.length]} style={{ fontSize: 11, margin: 0 }}>{tag}</Tag>)}</Space>
        ) : '-',
      },
      { title: '策略', dataIndex: 'distribution_strategy', width: '7%', render: (s: string) => s === 'first_come' ? '抢单' : s === 'quota_grab' ? '配额' : '指派' },
      {
        title: '进度', dataIndex: 'progress', width: '16%',
        render: (p: number, r: TaskListItem) => (
          <Space size={8}>
            <Progress percent={Math.round(p || 0)} size="small" style={{ width: 60 }} />
            <span style={{ fontSize: 13, color: '#9ca3af' }}>
              {r.completed_items}/{r.quota}
              {r.distribution_strategy === 'quota_grab' && r.claimed_items > 0 && (
                <span style={{ color: '#f59e0b' }}>（{r.claimed_items} 已认领）</span>
              )}
            </span>
          </Space>
        ),
      },
      { title: '截止', dataIndex: 'deadline', width: '11%', render: (d: string | null) => d ? dayjs.utc(d).local().format('MM/DD HH:mm') : '-' },
    ]),
    {
      title: '操作', key: 'action', width: mobile ? 50 : '10%',
      render: (_: unknown, r: TaskListItem) => (
        isMy ? (
          <Button type="primary" size="small" icon={<PlayCircleOutlined />}
            onClick={() => navigate(`/labeling/${r.id}`)}>{mobile ? '' : '进入标注'}</Button>
        ) : (
          <Button type="primary" size="small" ghost icon={<ThunderboltOutlined />}
            onClick={() => openClaim(r)}>{mobile ? '' : '认领'}</Button>
        )
      ),
    },
  ]

  const dataSource = (isMyTab ? myTasks : pubTasks).filter((t) => {
    if (!searchText.trim()) return true
    const s = searchText.toLowerCase()
    return t.title.toLowerCase().includes(s) || (t.tags || '').toLowerCase().includes(s)
  })

  return (
    <div>
      <div style={{ marginBottom: 16, maxWidth: 400 }}>
        <Input.Search
          placeholder="搜索任务名称或标签..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={(v) => setSearchText(v)}
        />
      </div>
      <Table
        dataSource={dataSource}
        columns={mkCols(isMyTab)}
        rowKey="id"
        loading={loading}
        size={mobile ? 'small' : 'middle'}
        pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (t) => `共 ${t} 条` }}
        locale={{
          emptyText: (
            <div style={{ padding: '100px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
              {isMyTab ? '还没有认领或分配的任务' : '暂无可用任务'}
            </div>
          ),
        }}
      />

      <Modal title="配额抢单" open={!!claimTask} onCancel={() => setClaimTask(null)}
        onOk={() => claimTask && handleClaim(claimTask.id, claimCount)}
        okText="认领" confirmLoading={claiming} width={360}>
        <div style={{ padding: '12px 0' }}>
          <div style={{ marginBottom: 8, fontSize: 13 }}>任务：{claimTask?.title}</div>
          <div style={{ marginBottom: 16, fontSize: 12, color: '#6b7280' }}>
            配额 {claimTask?.quota || '不限'} 条
            {claimTask?.grab_limit ? `，每人最多 ${claimTask.grab_limit} 条` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>认领条数：</span>
            <InputNumber min={1} max={claimTask?.grab_limit || claimTask?.quota || 9999}
              value={claimCount} onChange={(v) => setClaimCount(v ?? 1)} style={{ width: 120 }} />
          </div>
        </div>
      </Modal>

      <Modal title="任务详情" open={!!detail} onCancel={() => setDetail(null)} footer={null} width={600}>
        {detail && (
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="任务名称" span={2}>{detail.title}</Descriptions.Item>
            <Descriptions.Item label="标签" span={2}>
              {detail.tags ? parseTags(detail.tags).map((t, i) => <Tag key={i} color={TAG_COLORS[i % TAG_COLORS.length]}>{t}</Tag>) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color="green">发布中</Tag></Descriptions.Item>
            <Descriptions.Item label="策略">{detail.distribution_strategy === 'first_come' ? '先到先得' : '指派'}</Descriptions.Item>
            <Descriptions.Item label="配额">{detail.quota}</Descriptions.Item>
            <Descriptions.Item label="进度">{detail.completed_items} / {detail.quota}（{Math.round(detail.progress || 0)}%）</Descriptions.Item>
            <Descriptions.Item label="奖励">{detail.reward_per_item != null ? `${detail.reward_per_item} 元/条` : '-'}</Descriptions.Item>
            <Descriptions.Item label="月度封顶">{detail.reward_cap != null ? `${detail.reward_cap} 元` : '-'}</Descriptions.Item>
            <Descriptions.Item label="截止时间" span={2}>{detail.deadline ? dayjs(detail.deadline).format('YYYY/MM/DD HH:mm') : '不限'}</Descriptions.Item>
            {detail.description && (
              <Descriptions.Item label="描述" span={2}>
                {/*
                 * description 由任务创建者通过富文本编辑器填写，后端存储为 HTML。
                 * XSS 风险由任务创建接口的 HTML 清洗逻辑兜底，此处直接渲染。
                 */}
                <div dangerouslySetInnerHTML={{ __html: detail.description }} style={{ maxHeight: 200, overflow: 'auto' }} />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

/** 标注工作区 —— 三栏布局：左侧条目队列 + 中间标注表单 + 右侧统计面板 */
function LabelingWorkspace() {
  return <Workbench />
}

/**
 * 用嵌套 Routes 而非动态组件切换：
 * - /labeling       → TaskSquare（任务大厅）
 * - /labeling/:id   → LabelingWorkspace（标注工作区）
 * 两者 UI 差异大，独立路由方便后续各自扩展状态管理，
 * 且可通过 React Router 的地址栏直接进入具体任务工作区。
 */
export default function Labeling() {
  return (
    <Routes>
      <Route index element={<TaskSquare />} />
      <Route path=":taskId" element={<LabelingWorkspace />} />
    </Routes>
  )
}
