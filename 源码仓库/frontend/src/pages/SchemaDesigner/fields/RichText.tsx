/** RichText.tsx — 富文本字段预览
 * Author: hongchuwudi
 * Description: 画布上渲染富文本编辑器的预览
 */
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import type { FieldLabelProps } from './types'

/** RichText — 富文本编辑器预览 */
export default function RichText({ field }: FieldLabelProps) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontFamily: 'monospace' }}>
        {field.key || 'richtext'}
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
        <div className="schema-richtext-preview">
          <ReactQuill
            theme="snow"
            value={field.defaultValue as string || ''}
            readOnly
            modules={{ toolbar: false }}
            placeholder={field.placeholder || '富文本内容...'}
          />
        </div>
      </div>
      <style>{`
        .schema-richtext-preview .ql-container.ql-snow {
          border: none !important;
          font-size: 13px;
        }
        .schema-richtext-preview .ql-editor {
          min-height: 60px;
          padding: 10px 12px;
        }
      `}</style>
    </div>
  )
}
