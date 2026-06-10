import { Button } from 'antd'
import { LeftOutlined, RightOutlined, SendOutlined, MinusCircleOutlined } from '@ant-design/icons'

/** 底部固定操作栏 */
export function BottomBar({ currentIdx, total, onPrev, onNext, onSubmit, onSkip, onSaveDraft, submitting, skipping, canSubmit, hasDraft }: {
  currentIdx: number
  total: number
  onPrev: () => void
  onNext: () => void
  onSubmit: () => void
  onSkip: () => void
  onSaveDraft: () => void
  submitting: boolean
  skipping: boolean
  canSubmit: boolean
  hasDraft: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 24px',
      borderTop: '1px solid #e5e7eb',
      background: '#fafafa',
      flexShrink: 0,
    }}>
      {/* 左侧：导航 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button size="small" icon={<LeftOutlined />} disabled={currentIdx <= 0} onClick={onPrev}>
          上一题
        </Button>
        <span style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
          {currentIdx + 1} / {total}
        </span>
        <Button size="small" icon={<RightOutlined />} disabled={currentIdx >= total - 1} onClick={onNext}>
          下一题
        </Button>
      </div>

      {/* 右侧：操作 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Button size="small" onClick={onSaveDraft} disabled={!canSubmit || !hasDraft}>
          保存草稿
        </Button>
        <Button
          size="small"
          icon={<MinusCircleOutlined />}
          onClick={onSkip}
          loading={skipping}
          disabled={!canSubmit}
        >
          跳过
        </Button>
        <Button
          type="primary"
          size="small"
          icon={<SendOutlined />}
          onClick={onSubmit}
          loading={submitting}
          disabled={!canSubmit}
        >
          提交本题
        </Button>
      </div>
    </div>
  )
}
