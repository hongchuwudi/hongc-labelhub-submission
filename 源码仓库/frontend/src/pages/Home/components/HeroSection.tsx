/** HeroSection.tsx — 首页 Hero 区：满屏高 + 动画入场 */
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

const FEATURES = [
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>, title: '可视化搭建', desc: '拖拽组件动态搭建标注表单，JSON Schema 驱动渲染' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>, title: 'AI 预审', desc: '可配置评分维度，LLM 结构化输出，异步队列' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, title: '审核流转', desc: '复审 / 终审 / 入库，打回附理由，完整审计' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, title: '多格式导出', desc: 'JSON / JSONL / CSV / Excel，异步下载' },
]

const PALETTE = [
  { label: '单行文本', color: '#eef2ff' },
  { label: '多行文本', color: '#ecfdf5' },
  { label: '单选', color: '#fffbeb' },
  { label: '图片上传', color: '#f5f3ff' },
]

const ANIM = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes glowPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
@keyframes twinkle {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.4); }
}
@keyframes twinkleSlow {
  0%, 100% { opacity: 0.1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
@keyframes drift {
  0% { transform: translateY(0) translateX(0); }
  33% { transform: translateY(-8px) translateX(4px); }
  66% { transform: translateY(4px) translateX(-4px); }
  100% { transform: translateY(0) translateX(0); }
}
@keyframes bounceDown {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}
`

// 星星位置生成
const STARS = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  left: `${(i * 67 + 11) % 92}%`,
  top: `${(i * 43 + 17) % 85}%`,
  size: 12 + (i % 3) * 8,
  delay: `${(i * 0.43).toFixed(2)}s`,
  duration: 2.5 + (i % 3) * 1.3,
  drift: 6 + (i % 4) * 2,
}))

/** 首页 Hero 区：满屏高 + 动画入场 + Schema 演示卡片 */
export default function HeroSection() {
  const mobile = useIsMobile()
  const navigate = useNavigate()
  const tokens = useAppStore((s) => s.tokens)
  const isLoggedIn = !!(tokens?.access_token)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 触发入场动画
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate(isLoggedIn ? '/datasets' : '/login')
  }

  const anim = (delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(30px)',
    transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
  })

  return (
    <section style={s.section(mobile)} ref={ref}>
      <style>{ANIM}</style>

      {/* 底部渐变遮罩 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '20%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(253,251,247,0.7) 60%, #fdfbf7 100%)',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* 向下滚动提示 */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        opacity: visible ? 0.6 : 0,
        transition: 'opacity 0.8s ease 1.2s',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 11, color: '#9ca3af', letterSpacing: 1 }}>向下滚动</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: 'bounceDown 2s ease-in-out infinite' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      {/* 闪烁星星 */}
      {STARS.map((star) => (
        <svg
          key={star.id}
          width={star.size} height={star.size}
          style={{
            position: 'absolute', left: star.left, top: star.top,
            pointerEvents: 'none',
            animation: `twinkle${star.id % 2 === 0 ? '' : 'Slow'} ${star.duration}s ease-in-out ${star.delay} infinite, drift ${star.drift}s ease-in-out ${star.delay} infinite`,
          }}
          viewBox="0 0 24 24" fill="none"
        >
          <path
            d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z"
            fill="rgba(99,102,241,0.35)"
            stroke="rgba(99,102,241,0.15)"
            strokeWidth="0.5"
          />
        </svg>
      ))}

      {/* 光晕 */}
      <div style={{ ...s.glowOrb(mobile), animation: visible ? 'glowPulse 4s ease-in-out infinite' : 'none' }} />

      <div style={s.inner(mobile)}>
        {/* ====== 左侧文字区 ====== */}
        <div style={s.leftCol(mobile)}>
          <div style={{ maxWidth: mobile ? '100%' : 500 }}>

            <h1 style={{ ...s.title(mobile), ...anim(0) }}>
              让数据标注{' '}
              <span style={s.gradientText}>更高效</span>
            </h1>

            <p style={{ ...s.tagline(mobile), ...anim(150) }}>
              从模板设计到 AI 审核，一站式解决数据标注难题
            </p>

            {/* 功能网格 */}
            <div style={{ ...s.featureGrid(mobile), ...anim(300) }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={s.featItem}>
                  <div style={s.featIcon}>{f.icon}</div>
                  <div>
                    <div style={s.featTitle}>{f.title}</div>
                    <div style={s.featDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ ...anim(450), display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href={isLoggedIn ? '/datasets' : '/login'} onClick={handleStart} style={s.btnPrimary}>
                立即开始
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
              <a href="/tutorial" style={s.btnGhost}>查看教程</a>
            </div>

            {/* 数据统计 */}
            <div style={{ ...s.stats, ...anim(600) }}>
              <div style={s.statItem}><span style={s.statNum}>3</span><span style={s.statLabel}>角色协作</span></div>
              <div style={s.statDivider} />
              <div style={s.statItem}><span style={s.statNum}>4</span><span style={s.statLabel}>导出格式</span></div>
              <div style={s.statDivider} />
              <div style={s.statItem}><span style={s.statNum}>1000+</span><span style={s.statLabel}>标注条目</span></div>
            </div>
          </div>
        </div>

        {/* ====== 右侧演示区 ====== */}
        <div style={{ ...s.rightCol(mobile), ...anim(250) }}>
          <div style={s.cardGlow} />
          <div style={s.demoCard}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span style={s.miniTag}>Schema Designer</span>
              <span style={{ ...s.miniTag, background: '#ecfdf5', color: '#059669' }}>实时预览</span>
            </div>

            <div style={{ display: 'flex', height: mobile ? 180 : 240 }}>
              {/* 物料区 */}
              <div style={s.panel('right')}>
                <div style={s.panelLabel}>物料区</div>
                {PALETTE.map((item, i) => (
                  <div key={i} style={s.paletteItem}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* 画布 */}
              <div style={s.canvas}>
                <div style={s.panelLabel}>画布</div>
                <div style={s.canvasField}>
                  <div style={s.fieldLabel}>商品标题 <span style={{ color: '#ef4444' }}>*</span></div>
                  <div style={s.fieldPlaceholder} />
                </div>
                <div style={s.canvasField}>
                  <div style={s.fieldLabel}>商品分类 <span style={{ color: '#ef4444' }}>*</span></div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <span style={s.radioTag(true)}>电子产品</span>
                    <span style={s.radioTag(false)}>服装</span>
                    <span style={s.radioTag(false)}>食品</span>
                  </div>
                </div>
                <div style={s.dropTarget}>+ 拖入新字段</div>
              </div>

              {/* 属性面板 */}
              <div style={s.panel('left')}>
                <div style={s.panelLabel}>属性</div>
                {['字段名: 商品分类', '类型: 单选', '必填: 是', '选项: 3个'].map((t, i) => (
                  <div key={i} style={s.propRow}>{t}</div>
                ))}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ ...s.radioTag(true), fontSize: 9 }}>联动</span>
                  <span style={{ ...s.radioTag(false), fontSize: 9 }}>校验</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#9ca3af' }}>
            Schema Designer — 可视化搭建标注模板
          </div>
        </div>
      </div>
    </section>
  )
}

// ── 样式 ──

const s = {
  section: (m: boolean): React.CSSProperties => ({
    minHeight: 'calc(100vh - 57px)',
    padding: m ? 28 : 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse 80% 60% at 50% 10%, #ffffff 0%, #fdfbf7 40%, #f8f4ed 100%)',
    position: 'relative', overflow: 'hidden',
  }),

  glowOrb: (m: boolean): React.CSSProperties => ({
    position: 'absolute', top: m ? '-15%' : '-25%', right: m ? '-15%' : '-10%',
    width: m ? 280 : 500, height: m ? 280 : 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.03) 40%, transparent 70%)',
    pointerEvents: 'none',
  }),

  inner: (m: boolean): React.CSSProperties => ({
    display: 'flex', gap: m ? 32 : 56, alignItems: 'center',
    flexDirection: m ? 'column' : 'row',
    maxWidth: 1100, width: '100%', padding: m ? 0 : '0 48px',
    position: 'relative', zIndex: 1,
  }),

  leftCol: (m: boolean): React.CSSProperties => ({
    flex: m ? 'none' : '1 1 50%', textAlign: m ? 'center' : 'left',
    maxWidth: m ? '100%' : 500,
  }),

  title: (m: boolean): React.CSSProperties => ({
    fontSize: m ? 36 : 52, fontWeight: 800, color: '#111827',
    margin: '0 0 8px', lineHeight: 1.12, letterSpacing: -2,
  }),

  gradientText: {
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #7c3aed 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.25))',
  } as React.CSSProperties,

  tagline: (m: boolean): React.CSSProperties => ({
    fontSize: m ? 15 : 17, color: '#6b7280', margin: '0 0 32px', lineHeight: 1.7,
  }),

  featureGrid: (m: boolean): React.CSSProperties => ({
    display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : '1fr 1fr', gap: 16, marginBottom: 28,
  }),

  featItem: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    padding: '10px 12px', borderRadius: 10,
    background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.04)',
  } as React.CSSProperties,

  featIcon: { fontSize: 18, color: '#6366f1', flexShrink: 0, marginTop: 1, width: 24, textAlign: 'center' as const },
  featTitle: { fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 },
  featDesc: { fontSize: 11, color: '#9ca3af', lineHeight: 1.5 },

  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    height: 48, padding: '0 28px', borderRadius: 12, fontSize: 15, fontWeight: 600,
    background: 'linear-gradient(135deg, #5B49FF 0%, #6366f1 100%)',
    color: '#fff', textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,

  btnGhost: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    height: 48, padding: '0 28px', borderRadius: 12, fontSize: 15, fontWeight: 500,
    background: '#fff', color: '#374151', textDecoration: 'none',
    border: '1px solid #e5e7eb', transition: 'all 0.2s ease',
  } as React.CSSProperties,

  stats: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 28, opacity: 0.6 } as React.CSSProperties,
  statItem: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  statNum: { fontSize: 18, fontWeight: 700, color: '#374151' },
  statLabel: { fontSize: 11, color: '#9ca3af' },
  statDivider: { width: 1, height: 24, background: '#e5e7eb' } as React.CSSProperties,

  rightCol: (m: boolean): React.CSSProperties => ({
    flex: m ? 'none' : '1 1 50%', width: m ? '100%' : 'auto',
    maxWidth: m ? '100%' : 500, position: 'relative',
  }),

  cardGlow: {
    position: 'absolute', inset: -16, borderRadius: 20,
    background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)',
    filter: 'blur(16px)', pointerEvents: 'none', animation: 'glowPulse 4s ease-in-out infinite',
  } as React.CSSProperties,

  demoCard: {
    background: '#fff', borderRadius: 14, overflow: 'hidden', padding: 14,
    boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 20px 50px rgba(0,0,0,0.06), 0 0 80px rgba(99,102,241,0.03)',
    position: 'relative', transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  } as React.CSSProperties,

  miniTag: {
    padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600,
    background: '#eef2ff', color: '#4f46e5',
  } as React.CSSProperties,

  panel: (side: 'left' | 'right'): React.CSSProperties => ({
    width: 110, flexShrink: 0, background: '#fafafc', padding: 10,
    borderLeft: side === 'left' ? '1px solid #f3f4f6' : undefined,
    borderRight: side === 'right' ? '1px solid #f3f4f6' : undefined,
  }),

  panelLabel: { fontSize: 9, fontWeight: 600, color: '#d1d5db', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 10 },

  paletteItem: {
    padding: '6px 8px', borderRadius: 5, background: '#fff',
    border: '1px solid #f3f4f6', marginBottom: 5, fontSize: 10, color: '#374151',
    display: 'flex', alignItems: 'center', gap: 6,
  } as React.CSSProperties,

  canvas: {
    flex: 1, background: '#fff', padding: 10,
    backgroundImage: 'radial-gradient(circle, #f3f4f6 1px, transparent 1px)',
    backgroundSize: '14px 14px',
  } as React.CSSProperties,

  canvasField: {
    borderRadius: 7, border: '1px solid #f3f4f6', padding: '8px 10px', marginBottom: 8,
    background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  } as React.CSSProperties,

  fieldLabel: { fontSize: 11, fontWeight: 500, color: '#374151' },
  fieldPlaceholder: { height: 16, borderRadius: 4, background: '#f5f5f5', marginTop: 3, width: '65%' } as React.CSSProperties,

  radioTag: (active: boolean): React.CSSProperties => ({
    padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 500,
    background: active ? '#eef2ff' : '#f9fafb',
    color: active ? '#4f46e5' : '#9ca3af',
    border: `1px solid ${active ? '#c7d2fe' : '#f3f4f6'}`,
  }),

  dropTarget: {
    borderRadius: 7, border: '2px dashed #e5e7eb', background: '#fafafc',
    padding: '8px', textAlign: 'center' as const, fontSize: 10, color: '#9ca3af',
  },

  propRow: { fontSize: 9, color: '#6b7280', marginBottom: 5 } as React.CSSProperties,
}
