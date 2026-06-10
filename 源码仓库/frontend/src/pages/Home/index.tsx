/** index.tsx — 首页入口
 * Author: hongchuwudi
 * Description: 首页主页面，组合 Hero / 功能 / 角色 / 工作流 / Schema 演示 / AI 演示 / 数据看板 / CTA / 底部等模块
 */
import { useState, useEffect } from 'react'
import HeroSection from './components/HeroSection'
import FeatureSection from './components/FeatureSection'
import RoleSection from './components/RoleSection'
import WorkflowSection from './components/WorkflowSection'
import SchemaDemoSection from './components/SchemaDemoSection'
import AiDemoSection from './components/AiDemoSection'
import DashboardPreviewSection from './components/DashboardPreviewSection'
import CTASection from './components/CTASection'
import FooterSection from './components/FooterSection'
import AnimateSection from './components/AnimateSection'

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

/** 首页主组件 */
export default function HomePage() {
  const mobile = useIsMobile()
  const mg = mobile ? '-20px -16px 0' : '-24px -28px 0'

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#111827', margin: mg }}>
      <HeroSection />
      <AnimateSection><FeatureSection mobile={mobile} /></AnimateSection>
      <AnimateSection><RoleSection mobile={mobile} /></AnimateSection>
      <AnimateSection><WorkflowSection mobile={mobile} /></AnimateSection>
      <AnimateSection><SchemaDemoSection mobile={mobile} /></AnimateSection>
      <AnimateSection><AiDemoSection mobile={mobile} /></AnimateSection>
      <AnimateSection><DashboardPreviewSection mobile={mobile} /></AnimateSection>
      <AnimateSection><CTASection mobile={mobile} /></AnimateSection>
      <FooterSection />
    </div>
  )
}
