/** WorkArea.tsx — 标注操作区组件
 * Author: hongchuwudi
 * Description: 中间操作区，并排展示原始数据与标注表单
 */
import type { TaskItemDetail } from '@/api/tasks'
import type { FieldDef, SchemaField } from '@/types/models/field'
import { SchemaForm, FallbackForm, TabbedForm } from './FieldRenderers'

/** 中间操作区：原始数据 + 表单 */
export function WorkArea({ item, fields, schemaDesign, formValues, onChange, taskId }: {
  item: TaskItemDetail
  fields: FieldDef[]
  schemaDesign: {
    tabs?: { id: string; title: string; fieldIds: string[]; groupIds: string[] }[];
    groups?: { id: string; title: string; fieldIds: string[] }[];
    fields?: SchemaField[];
  } | null
  formValues: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
  taskId?: number
}) {
  return (
    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
      {/* 原始数据 */}
      <div style={{ flex: '1 1 240px', maxWidth: 400 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          原始数据
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {Object.entries(item.data).map(([k, v]) => (
              <tr key={k} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{
                  padding: '7px 10px', fontSize: 12, fontWeight: 500, color: '#6b7280',
                  width: 80, whiteSpace: 'nowrap', verticalAlign: 'top',
                }}>
                  {k}
                </td>
                <td style={{
                  padding: '7px 10px', fontSize: 13, color: '#1a1a2e',
                  wordBreak: 'break-all', lineHeight: 1.5,
                }}>
                  {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '-')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 标注表单 */}
      <div style={{ flex: '1 1 280px', minWidth: 240 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          标注内容
        </div>
        {schemaDesign && schemaDesign.tabs && schemaDesign.tabs.length > 0 ? (
          <TabbedForm tabs={schemaDesign.tabs} groups={schemaDesign.groups || []} allFields={schemaDesign.fields || []} values={formValues} onChange={onChange} taskId={taskId} itemId={item.id} itemData={item.data} />
        ) : fields.length === 0 ? (
          <FallbackForm values={formValues} onChange={onChange} />
        ) : (
          <SchemaForm fields={fields} values={formValues} onChange={onChange} taskId={taskId} itemId={item.id} />
        )}
      </div>
    </div>
  )
}
