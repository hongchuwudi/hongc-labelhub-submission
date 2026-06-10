/**
 * AiReview/index.tsx — AI 预审监控台
 * Author: hongchuwudi
 * Description: AI 审核结果查看与监控页面，三栏布局
 */
import { useState, useEffect, useCallback } from 'react'
import { message, Empty, Spin } from 'antd'
import { listAiReviewsApi, getAiReviewApi } from '@/api/ai-reviews'
import type { AiReviewItem, AiReviewDetail } from '@/types/models/ai-review'
import TaskQueue from './components/TaskQueue'
import ReviewDetail from './components/ReviewDetail'

/** AI 预审监控台组件 */
export default function AiReviewMonitor() {
  const [items, setItems] = useState<AiReviewItem[]>([])
  const [selected, setSelected] = useState<AiReviewItem | null>(null)
  const [detail, setDetail] = useState<AiReviewDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [counts, setCounts] = useState({ done: 0, pending: 0, failed: 0, pass: 0, reject: 0, human_review: 0 })

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listAiReviewsApi({ page: 1, page_size: 100 })
      const data = res.data
      setItems(data.items)

      // 统计各类数量
      let done = 0, pending = 0, failed = 0, pass = 0, reject = 0, human_review = 0
      for (const it of data.items) {
        if (it.status === 'done') done++
        else if (it.status === 'pending' || it.status === 'processing') pending++
        else if (it.status === 'failed') failed++
        if (it.verdict === 'pass') pass++
        else if (it.verdict === 'reject') reject++
        else if (it.verdict === 'human_review') human_review++
      }
      setCounts({ done, pending, failed, pass, reject, human_review })
    } catch { message.error('加载 AI 审核列表失败') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  const handleSelect = async (item: AiReviewItem) => {
    setSelected(item)
    setDetailLoading(true)
    try {
      const res = await getAiReviewApi(item.id)
      setDetail(res.data)
    } catch { message.error('加载审核详情失败') }
    finally { setDetailLoading(false) }
  }

  const filtered = activeTab === 'all' ? items
    : activeTab === 'pending' ? items.filter(i => i.status === 'pending' || i.status === 'processing')
    : activeTab === 'done' ? items.filter(i => i.status === 'done')
    : activeTab === 'failed' ? items.filter(i => i.status === 'failed')
    : activeTab === 'pass' ? items.filter(i => i.verdict === 'pass')
    : activeTab === 'reject' ? items.filter(i => i.verdict === 'reject')
    : items.filter(i => i.verdict === 'human_review')

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100dvh - 57px)', margin: '-28px -32px', background: '#f5f5f8',
    }}>
      {/* 主体三栏 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* 左侧队列 */}
        <div style={{
          width: 280, flexShrink: 0, borderRight: '1px solid #e5e7eb',
          background: '#fff', overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}>
          <TaskQueue
            items={filtered}
            selectedId={selected?.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSelect={handleSelect}
            counts={counts}
            loading={loading}
          />
        </div>

        {/* 右侧详情 */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#fff', minWidth: 0 }}>
          {detailLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spin size="large" />
            </div>
          ) : detail ? (
            <ReviewDetail detail={detail} onRerun={fetchList} />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Empty description="选择左侧审核记录查看详情" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
