/** AnimateSection.tsx — 滚动触发淡入动画包裹器 */
import { useEffect, useRef, useState, type ReactNode } from 'react'

export default function AnimateSection({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      filter: visible ? 'blur(0)' : 'blur(4px)',
      transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease',
      ...style,
    }}>
      {children}
    </div>
  )
}
