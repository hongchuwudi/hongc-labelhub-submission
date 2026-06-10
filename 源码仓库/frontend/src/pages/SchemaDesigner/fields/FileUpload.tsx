/** FileUpload.tsx — 文件上传字段预览
 * Author: hongchuwudi
 * Description: 画布上渲染文件上传组件的预览
 */
import { Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { FieldLabelProps } from './types'

/** FileUpload — 文件上传组件预览 */
export default function FileUpload({ field }: FieldLabelProps) {
  return (
    <Upload accept={field.accept} maxCount={field.maxCount} disabled>
      <Button icon={<UploadOutlined />}>点击上传</Button>
    </Upload>
  )
}
