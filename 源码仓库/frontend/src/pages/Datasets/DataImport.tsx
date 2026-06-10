/** DataImport.tsx — 数据导入页
 * Author: hongchuwudi
 * Description: 支持粘贴 JSON/JSONL/CSV 或上传 Excel 文件，预览后批量导入数据集
 */
import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Space, Select, Tag, Alert, App } from 'antd'
import { LeftOutlined, FormatPainterOutlined, UploadOutlined, ImportOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { batchImportApi } from '@/api/datasets'
import { parseInput, parseExcel } from './utils/csvParser'
import useEditorSettings, { FONT_OPTIONS } from './useEditorSettings'
import JsonHighlight from './components/JsonHighlight'
import useIsMobile from '@/hooks/useIsMobile'

/** 数据导入页面组件 */
function DataImport() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { message } = App.useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<unknown[] | null>(null)
  const [detectedFormat, setDetectedFormat] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [settings, updateSettings] = useEditorSettings()
  const [dragOver, setDragOver] = useState(false)

  const parse = (value: string, hint?: string) => {
    setText(value)
    if (!value.trim()) { setParsed(null); setDetectedFormat(''); setError(null); return }
    const result = parseInput(value, hint)
    if ('error' in result) {
      setParsed(null); setDetectedFormat(''); setError(result.error)
    } else {
      setParsed(result.items); setDetectedFormat(result.format); setError(null)
    }
  }

  const handleTextChange = (value: string) => parse(value)

  // 文件读取
  const readFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = () => {
        const result = parseExcel(reader.result as ArrayBuffer)
        if ('error' in result) {
          setParsed(null); setDetectedFormat(''); setError(result.error); setText('')
        } else {
          setParsed(result.items); setDetectedFormat(result.format); setError(null)
          setText(JSON.stringify(result.items, null, 2))
        }
        message.success(`已加载: ${file.name}`)
      }
      reader.onerror = () => message.error('文件读取失败')
      reader.readAsArrayBuffer(file)
      return
    }
    const hint = ext === 'csv' ? 'csv' : ext === 'jsonl' || ext === 'txt' ? 'jsonl' : undefined
    const reader = new FileReader()
    reader.onload = () => {
      parse(reader.result as string, hint)
      message.success(`已加载: ${file.name}`)
    }
    reader.onerror = () => message.error('文件读取失败')
    reader.readAsText(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleFormat = () => {
    if (parsed) {
      setText(JSON.stringify(parsed, null, 2))
      setDetectedFormat('json')
    }
  }

  const handleImport = async () => {
    if (!parsed || parsed.length === 0) { message.warning('没有可导入的数据'); return }
    setImporting(true)
    try {
      const payload = parsed.map((item) => ({ data: item as Record<string, unknown> }))
      await batchImportApi(Number(id), payload)
      message.success(`成功导入 ${payload.length} 条`)
      navigate(`/datasets/${id}`, { replace: true })
    } catch (e: unknown) { message.error(e instanceof Error ? e.message : '导入失败') }
    finally { setImporting(false) }
  }

  const editorStyle: React.CSSProperties = {
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    lineHeight: 1.7,
  }

  return (
    <div style={{ padding: isMobile ? 12 : 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Space>
          <Button icon={<LeftOutlined />} onClick={() => navigate(`/datasets/${id}`)}>
            {isMobile ? '' : '返回数据集'}
          </Button>
          {!isMobile && <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>导入数据</h2>}
        </Space>

        <Space wrap size={isMobile ? 'small' : 'middle'}>
          <Select size="small" value={settings.fontFamily}
            onChange={(v) => updateSettings({ fontFamily: v })}
            options={FONT_OPTIONS} style={{ width: isMobile ? 120 : 160 }}
            popupMatchSelectWidth={false}
          />
          <Select size="small" value={settings.fontSize}
            onChange={(v) => updateSettings({ fontSize: v })}
            options={[14, 16, 18, 20, 24].map((n) => ({ value: n, label: `${n}px` }))}
            style={{ width: 64 }}
          />
          <Button icon={<FormatPainterOutlined />} onClick={handleFormat}>格式化</Button>
          <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>上传文件</Button>
          <input ref={fileRef} type="file" accept=".json,.jsonl,.csv,.xlsx,.xls,.txt" style={{ display: 'none' }}
            onChange={handleFileSelect} />
          <Button type="primary" icon={<ImportOutlined />} loading={importing}
            disabled={!parsed || parsed.length === 0} onClick={handleImport}>
            导入 {parsed ? `${parsed.length} 条` : ''}
          </Button>
        </Space>
      </div>

      {/* 编辑器 + 预览 */}
      {isMobile ? (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
            <Button size="small" type="link" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? '← 返回编辑' : '预览 →'}
            </Button>
          </div>

          {showPreview ? (
            /* 预览 */
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                {parsed && <span style={{ color: '#10b981' }}><CheckCircleOutlined /> {parsed.length} 条数据</span>}
              </div>
              <div style={{
                padding: 16, borderRadius: 8, border: '1px solid #e5e7eb',
                background: '#ffffff', color: '#1a1a2e',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                minHeight: 300, ...editorStyle,
              }}>
                {parsed ? (
                  <JsonHighlight data={parsed} />
                ) : (
                  <span style={{ color: '#9ca3af' }}>
                    {text.trim() ? '格式错误，请检查输入' : '粘贴数据或拖拽文件后此处显示预览'}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* 输入 */
            <div
              style={{ display: 'flex', flexDirection: 'column', minHeight: 300 }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false)
                const file = e.dataTransfer.files[0]
                if (file) readFile(file)
              }}
            >
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                粘贴数据（JSON / JSONL / CSV）或上传 Excel
                {detectedFormat && <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>{detectedFormat.toUpperCase()}</Tag>}
              </div>
              <textarea
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={[
                  '粘贴 JSON / JSONL / CSV 数据，或拖拽文件到此处',
                  '',
                  '[{"id":1,"text":"..."},{"id":2,"text":"..."}]          ← JSON 数组',
                  '{"id":1,"text":"..."}                                   ← 单个 JSON',
                  '{"id":1}\n{"id":2}                                      ← JSONL',
                  'id,text\n1,hello\n2,world                               ← CSV',
                ].join('\n')}
                style={{
                  flex: 1, resize: 'none', padding: 16, borderRadius: 8,
                  border: dragOver ? '2px dashed #4f46e5' : error ? '1px solid #ef4444' : '1px solid #e5e7eb',
                  outline: 'none', background: dragOver ? '#eef2ff' : '#fafbfc',
                  transition: 'border-color 120ms, background 120ms',
                  ...editorStyle,
                }}
                spellCheck={false}
              />
              {error && (
                <Alert type="error" title={error} showIcon icon={<ExclamationCircleOutlined />}
                  style={{ marginTop: 8 }} />
              )}
            </div>
          )}
        </div>
      ) : (
        /* 桌面端：双栏 */
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minHeight: 0, overflow: 'hidden' }}>
          {/* 输入 */}
          <div
            style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragOver(false)
              const file = e.dataTransfer.files[0]
              if (file) readFile(file)
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
              粘贴数据（JSON / JSONL / CSV）或上传 Excel
              {detectedFormat && <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>{detectedFormat.toUpperCase()}</Tag>}
            </div>
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={[
                '粘贴 JSON / JSONL / CSV 数据，或拖拽文件到此处',
                '',
                '[{"id":1,"text":"..."},{"id":2,"text":"..."}]          ← JSON 数组',
                '{"id":1,"text":"..."}                                   ← 单个 JSON',
                '{"id":1}\n{"id":2}                                      ← JSONL',
                'id,text\n1,hello\n2,world                               ← CSV',
              ].join('\n')}
              style={{
                flex: 1, resize: 'none', padding: 16, borderRadius: 8,
                border: dragOver ? '2px dashed #4f46e5' : error ? '1px solid #ef4444' : '1px solid #e5e7eb',
                outline: 'none', background: dragOver ? '#eef2ff' : '#fafbfc',
                transition: 'border-color 120ms, background 120ms',
                ...editorStyle,
              }}
              spellCheck={false}
            />
            {error && (
              <Alert type="error" title={error} showIcon icon={<ExclamationCircleOutlined />}
                style={{ marginTop: 8 }} />
            )}
          </div>

          {/* 预览 */}
          <div style={{ minHeight: 0, overflow: 'auto' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>预览</span>
              {parsed && <span style={{ color: '#10b981' }}><CheckCircleOutlined /> {parsed.length} 条数据</span>}
            </div>
            <div style={{
              padding: 16, borderRadius: 8, border: '1px solid #e5e7eb',
              background: '#ffffff', color: '#1a1a2e',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              minHeight: 200, ...editorStyle,
            }}>
              {parsed ? (
                <JsonHighlight data={parsed} />
              ) : (
                <span style={{ color: '#9ca3af' }}>
                  {text.trim() ? '格式错误，请检查输入' : '粘贴数据或拖拽文件后此处显示预览'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataImport
