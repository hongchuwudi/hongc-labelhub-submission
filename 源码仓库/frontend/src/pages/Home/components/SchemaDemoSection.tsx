/** SchemaDemoSection.tsx — Schema 搭建功能展示 */
/** Schema Designer 可视化搭建标注模板功能展示 */
export default function SchemaDemoSection({ mobile }: { mobile: boolean }) {
  const p = mobile ? 32 : 80
  return (
    <section style={{ padding: `${p}px 24px`, background: '#fafafc' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: mobile ? 32 : 60, alignItems: 'center', flexDirection: mobile ? 'column' : 'row' }}>
        {/* 左侧文字 */}
        <div style={{ flex: '1 1 45%', textAlign: mobile ? 'center' : 'left' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1 }}>Schema Designer</span>
          <h2 style={{ fontSize: mobile ? 26 : 32, fontWeight: 700, margin: '8px 0 16px' }}>可视化搭建标注模板</h2>
          <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.8, margin: 0 }}>
            拖拽组件到画布，实时预览表单效果。支持单行/多行文本、单选/多选、上传、JSON
            编辑器、LLM 触发等 10+ 种物料。字段联动、校验规则、分组容器、Tab
            布局，一份 Schema 同时驱动 Designer 预览和 Workbench 运行。
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 24, justifyContent: mobile ? 'center' : 'flex-start' }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>10+</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>物料类型</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>JSON</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Schema 驱动</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>Tab</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>分组布局</div>
            </div>
          </div>
        </div>
        {/* 右侧示意图 */}
        <div style={{ flex: '1 1 55%', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.06)', padding: mobile ? 16 : 24 }}>
          <div style={{ display: 'flex', height: mobile ? 160 : 220, gap: 0 }}>
            <div style={{ width: 80, background: '#fafafc', borderRadius: 8, padding: 8 }}>
              <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, marginBottom: 10, width: '60%' }} />
              {[1,2,3,4].map(i => <div key={i} style={{ height: 6, background: '#f3f4f6', borderRadius: 2, marginBottom: 6, width: `${60 + i * 10}%` }} />)}
            </div>
            <div style={{ flex: 1, margin: '0 8px', background: '#fff', borderRadius: 8, border: '1px solid #f3f4f6', padding: 8, backgroundImage: 'radial-gradient(circle, #f3f4f6 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
              <div style={{ border: '1px solid #f3f4f6', borderRadius: 6, padding: '6px 8px', marginBottom: 6, background: '#fff' }}>
                <div style={{ height: 3, background: '#e5e7eb', borderRadius: 1, width: '30%', marginBottom: 4 }} />
                <div style={{ height: 6, background: '#f5f5f5', borderRadius: 2, width: '70%' }} />
              </div>
              <div style={{ border: '1px solid #f3f4f6', borderRadius: 6, padding: '6px 8px', marginBottom: 6, background: '#fff' }}>
                <div style={{ height: 3, background: '#e5e7eb', borderRadius: 1, width: '30%', marginBottom: 4 }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{ padding: '2px 6px', borderRadius: 3, background: '#eef2ff', color: '#4f46e5', fontSize: 8 }}>选项A</span>
                  <span style={{ padding: '2px 6px', borderRadius: 3, background: '#f3f4f6', fontSize: 8 }}>选项B</span>
                </div>
              </div>
              <div style={{ border: '1px dashed #e5e7eb', borderRadius: 6, padding: '8px', textAlign: 'center', color: '#d1d5db', fontSize: 10 }}>
                + 拖拽添加字段
              </div>
            </div>
            <div style={{ width: 80, background: '#fafafc', borderRadius: 8, padding: 8 }}>
              <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, marginBottom: 8, width: '50%' }} />
              {[1,2,3,4].map(i => <div key={i} style={{ height: 3, background: '#f3f4f6', borderRadius: 1, marginBottom: 6, width: `${70 - i * 10}%` }} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
