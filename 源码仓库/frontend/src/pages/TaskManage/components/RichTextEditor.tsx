/**
 * RichTextEditor.tsx — 富文本编辑器
 * Author: hongchuwudi
 * Description: 基于 react-quill-new 的简易富文本编辑组件
 */
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

/** 富文本编辑器组件 */
export default function RichTextEditor({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return <ReactQuill theme="snow" value={value || ''} onChange={(v) => onChange?.(v)} style={{ height: 180, marginBottom: 40 }} />
}
