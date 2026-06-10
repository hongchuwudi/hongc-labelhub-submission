/** ScrollPanel.tsx — 带渐变指示器的滚动容器
 * Author: hongchuwudi
 * Description: 自动检测滚动位置并在顶部/底部显示渐变箭头指示
 */
import { useRef, useState, useEffect, useCallback } from 'react'

interface ScrollPanelProps {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

/** ScrollPanel — 带滚动方向指示器的容器 */
export default function ScrollPanel({ children, style, className }: ScrollPanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'top' | 'both' | 'bottom' | 'none'>('none')

  const check = useCallback(() => {
    const el = ref.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const atTop = scrollTop <= 2
    const atBottom = scrollTop + clientHeight >= scrollHeight - 2
    if (scrollHeight <= clientHeight + 4) setState('none')
    else if (atTop) setState('bottom')
    else if (atBottom) setState('top')
    else setState('both')
  }, [])

  useEffect(() => {
    check()
    const el = ref.current
    if (el) {
      el.addEventListener('scroll', check, { passive: true })
      const ro = new ResizeObserver(check)
      ro.observe(el)
      return () => { el.removeEventListener('scroll', check); ro.disconnect() }
    }
  }, [check])

  const showTop = state === 'top' || state === 'both'
  const showBottom = state === 'bottom' || state === 'both'

  const indicatorStyle: React.CSSProperties = {
    position: 'absolute', left: 0, right: 0, zIndex: 2,
    height: 36, pointerEvents: 'none',
    display: 'flex', justifyContent: 'center',
  }

  const arrowStyle: React.CSSProperties = {
    fontSize: 14, fontWeight: 700,
    color: '#6b7280', lineHeight: 1,
    background: 'rgba(250,251,252,0.85)',
    borderRadius: 10, padding: '2px 10px',
  }

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
        {showTop && (
          <div style={{
            ...indicatorStyle, top: 0, alignItems: 'flex-start', paddingTop: 6,
            background: 'linear-gradient(to bottom, rgba(250,251,252,1) 0%, rgba(250,251,252,0) 100%)',
          }}>
            <span style={arrowStyle}>▲</span>
          </div>
        )}
        <div
          ref={ref}
          style={{ height: '100%', overflowY: 'auto', scrollbarWidth: 'none' }}
        >
          {children}
        </div>
        {showBottom && (
          <div style={{
            ...indicatorStyle, bottom: 0, alignItems: 'flex-end', paddingBottom: 6,
            background: 'linear-gradient(to top, rgba(250,251,252,1) 0%, rgba(250,251,252,0) 100%)',
          }}>
            <span style={arrowStyle}>▼</span>
          </div>
        )}
      </div>
  )
}
