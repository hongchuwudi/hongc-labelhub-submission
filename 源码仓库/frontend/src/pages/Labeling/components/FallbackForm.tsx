/** 无 Schema 时的兜底表单：JSON 编辑器 */
export function FallbackForm({ values, onChange }: {
  values: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const text = JSON.stringify(values, null, 2)
  return (
    <div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>
        暂无标注模板，请输入 JSON 格式的标注数据
      </div>
      <textarea
        value={text === '{}' ? '' : text}
        onChange={(e) => {
          try { onChange(JSON.parse(e.target.value)) } catch { /* ignore parse errors */ }
        }}
        placeholder='{"key": "value"}'
        rows={8}
        style={{
          width: '100%', padding: 10, fontSize: 13, fontFamily: 'monospace',
          border: '1px solid #e5e7eb', borderRadius: 6, resize: 'vertical',
        }}
      />
    </div>
  )
}
