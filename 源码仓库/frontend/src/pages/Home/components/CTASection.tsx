/** CTASection.tsx — 底部行动号召 */
/** 底部行动号召按钮 */
export default function CTASection({ mobile }: { mobile: boolean }) {
  const p = mobile ? 48 : 96
  return (
    <section style={{
      padding: `${p}px 24px`, textAlign: 'center',
      background: 'linear-gradient(180deg, #fff 0%, #fdfbf7 50%, #f8f4ed 100%)',
    }}>
      <h2 style={{ fontSize: mobile ? 26 : 36, fontWeight: 800, color: '#111827', margin: '0 0 12px', letterSpacing: -1 }}>
        准备好开始了吗？
      </h2>
      <p style={{ fontSize: mobile ? 15 : 17, color: '#6b7280', margin: '0 auto 32px', maxWidth: 480, lineHeight: 1.7 }}>
        立即创建您的第一个标注任务，体验完整的 AI 数据标注工作流
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="/login" style={{
          display: 'inline-flex', alignItems: 'center', height: 52, padding: '0 36px',
          borderRadius: 14, fontSize: 16, fontWeight: 600,
          background: 'linear-gradient(135deg, #5B49FF 0%, #6366f1 100%)',
          color: '#fff', textDecoration: 'none',
          boxShadow: '0 6px 24px rgba(99,102,241,0.4)',
        }}>
          免费开始使用
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </section>
  )
}
