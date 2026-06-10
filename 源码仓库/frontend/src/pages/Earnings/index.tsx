/** Earnings/index.tsx — 我的收益（占位页面）
 * Author: hongchuwudi
 * Description: 标注员个人收益页面，暂未开发
 */
import { DollarOutlined, TrophyOutlined, RiseOutlined, HistoryOutlined } from '@ant-design/icons'
import useIsMobile from '@/hooks/useIsMobile'

/** 收益统计卡片配置 */
const STATS = [
  { icon: <DollarOutlined />, label: '累计收益', value: '-', color: '#4f46e5', bg: '#eef2ff' },
  { icon: <TrophyOutlined />, label: '完成任务', value: '-', color: '#059669', bg: '#ecfdf5' },
  { icon: <RiseOutlined />, label: '通过率', value: '-', color: '#d97706', bg: '#fffbeb' },
  { icon: <HistoryOutlined />, label: '本月收益', value: '-', color: '#7c3aed', bg: '#f5f3ff' },
]

/** 我的收益页面组件（占位） */
export default function Earnings() {
  const mobile = useIsMobile()

  return (
    <div style={{ padding: mobile ? 16 : 32, height: '100%' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: mobile ? 18 : 22, fontWeight: 700 }}>我的收益</h2>

      {/* 统计卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 16, marginBottom: 32,
      }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            padding: '20px 16px', borderRadius: 12,
            background: s.bg, border: '1px solid #e5e7eb',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'white', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: s.color,
            }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 收益明细占位 */}
      <div style={{
        borderRadius: 12, border: '1px solid #e5e7eb', background: '#ffffff',
        padding: mobile ? 16 : 24, minHeight: 300,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#f3f4f6', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <DollarOutlined style={{ fontSize: 36, color: '#d1d5db' }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          收益功能即将上线
        </div>
        <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 1.8, maxWidth: 360 }}>
          完成后您将在这里看到任务奖励明细、月度统计和收益趋势。
          <br />
          敬请期待。
        </div>
      </div>
    </div>
  )
}
