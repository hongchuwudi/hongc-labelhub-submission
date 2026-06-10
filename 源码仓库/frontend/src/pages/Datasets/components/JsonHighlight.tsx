/** JsonHighlight.tsx — JSON 语法高亮组件
 * Author: hongchuwudi
 * Description: 递归渲染 JSON 对象/数组，对键名、字符串、数字、布尔值分别着色
 */
import type { ReactNode } from 'react'

// 白底亮色高亮
const C = { K: '#1d4ed8', S: '#047857', N: '#b45309', B: '#9333ea', P: '#6b7280' }

/** 递归渲染 JSON 节点，语法高亮 */
function JsonHighlight({ data }: { data: unknown }): ReactNode {
  if (data === null) return <span style={{ color: C.B }}>null</span>
  if (data === undefined) return <span style={{ color: C.P }}>undefined</span>
  if (typeof data === 'boolean') return <span style={{ color: C.B }}>{String(data)}</span>
  if (typeof data === 'number') return <span style={{ color: C.N }}>{data}</span>
  if (typeof data === 'string') return <span style={{ color: C.S }}>"{data}"</span>

  if (Array.isArray(data)) {
    return (
      <>
        <span style={{ color: C.P }}>[</span>
        <div style={{ paddingLeft: 20 }}>
          {data.map((item, i) => (
            <div key={i}>
              <JsonHighlight data={item} />
              {i < data.length - 1 ? <span style={{ color: C.P }}>,</span> : null}
            </div>
          ))}
        </div>
        <span style={{ color: C.P }}>]</span>
      </>
    )
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>)
    return (
      <>
        <span style={{ color: C.P }}>{'{'}</span>
        <div style={{ paddingLeft: 20 }}>
          {entries.map(([k, v], i) => (
            <div key={k}>
              <span style={{ color: C.K }}>"{k}"</span>
              <span style={{ color: C.P }}>: </span>
              <JsonHighlight data={v} />
              {i < entries.length - 1 ? <span style={{ color: C.P }}>,</span> : null}
            </div>
          ))}
        </div>
        <span style={{ color: C.P }}>{'}'}</span>
      </>
    )
  }

  return <span>{String(data)}</span>
}

export default JsonHighlight
