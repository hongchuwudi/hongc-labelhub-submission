/** PropertyEditor.tsx — 属性配置面板
 * Author: hongchuwudi
 * Description: 右侧面板，编辑字段或分组的各项属性和校验规则
 */
import { Form, Input, Switch, Select, InputNumber, Button, Empty, Tabs, Slider, Radio } from 'antd'
import { PlusOutlined, DeleteOutlined, AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined, BlockOutlined, FolderOutlined } from '@ant-design/icons'
import { useSchemaDesigner } from '../SchemaDesignerContext'
import ScrollPanel from '../components/ScrollPanel'
import type { FieldOption, ValidationRule, FieldLinkage } from '../types'

const VALIDATION_PRESETS: { label: string; rule: ValidationRule }[] = [
  { label: '必填', rule: { type: 'required', message: '此字段为必填项' } },
  { label: '最小长度', rule: { type: 'minLength', value: 1, message: '内容过短' } },
  { label: '最大长度', rule: { type: 'maxLength', value: 100, message: '内容过长' } },
  { label: '仅中文', rule: { type: 'pattern', value: '^[\\u4e00-\\u9fa5]+$', message: '仅允许中文字符' } },
  { label: '仅数字', rule: { type: 'pattern', value: '^[0-9]+$', message: '仅允许阿拉伯数字' } },
  { label: '禁止 Emoji', rule: { type: 'pattern', value: '^[^\\u{1F600}-\\u{1F64F}\\u{1F300}-\\u{1F5FF}\\u{1F680}-\\u{1F6FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}]+$', message: '不允许包含 Emoji' } },
  { label: '正则表达式', rule: { type: 'pattern', value: '', message: '' } },
]

/** PropertyEditor — 右侧属性编辑面板 */
export default function PropertyEditor() {
  const { state, dispatch } = useSchemaDesigner()
  const field = state.schema.fields.find((f) => f.id === state.selectedFieldId)
  const group = state.schema.groups.find((g) => g.id === state.selectedGroupId)

  // ── 分组属性 ──
  if (group) {
    return (
      <ScrollPanel style={panelOuter}>
        <div style={{ padding: '14px 16px 0', fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>分组属性</div>
        <div style={{ padding: '2px 16px 8px', fontSize: 11, color: '#9ca3af' }}>容器 · {group.id.slice(0, 8)}</div>
        <Form layout="vertical" size="small" style={{ padding: '0 16px', marginTop: 8 }}>
          <Form.Item label={<span style={{ fontSize: 11 }}>标题</span>}>
            <Input value={group.title} onChange={(e) =>
              dispatch({ type: 'UPDATE_GROUP', payload: { id: group.id, updates: { title: e.target.value } } })} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 11 }}>所属 Tab</span>}>
            <Select
              allowClear
              size="small"
              style={{ fontSize: 11 }}
              placeholder="未分配"
              value={state.schema.tabs.find((t) => t.groupIds.includes(group.id))?.id ?? undefined}
              onChange={(v) => dispatch({ type: 'SET_GROUP_TAB', payload: { groupId: group.id, tabId: v ?? null } })}
              options={state.schema.tabs.map((t) => ({
                value: t.id,
                label: <span><BlockOutlined style={{ marginRight: 4 }} />{t.title}</span>,
              }))}
            />
          </Form.Item>
        </Form>
      </ScrollPanel>
    )
  }

  // ── 字段属性 ──
  if (field && state.schema) {
    const update = (updates: Record<string, unknown>) => {
      dispatch({ type: 'UPDATE_FIELD', payload: { id: field.id, updates } })
    }

    // key 重复检测：当前字段的 key 是否在其他字段中出现
    const duplicateKey = state.schema.fields.some((f) => f.id !== field.id && f.key === field.key)

    const inGroup = state.schema.groups.find((g) => g.fieldIds.includes(field.id))
    const groupTab = inGroup
      ? state.schema.tabs.find((t) => t.groupIds.includes(inGroup.id))
      : null
    const directTab = state.schema.tabs.find((t) => t.fieldIds.includes(field.id))

    return (
      <ScrollPanel style={panelOuter}>
        <div style={{ padding: '14px 16px 0', fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>属性配置</div>
        <div style={{ padding: '2px 16px 8px', fontSize: 11, color: '#9ca3af' }}>{field.type} · {field.key}</div>

      <Tabs size="small" style={{ padding: '0 8px' }} items={[
        {
          key: 'basic', label: '基础',
          children: (
            <Form layout="vertical" size="small" style={{ padding: '0 4px' }}>
              <Form.Item label={<span style={{ fontSize: 11 }}>字段标识 (key)</span>}
                validateStatus={duplicateKey ? 'error' : undefined}
                help={duplicateKey ? 'key 重复，请修改为唯一值' : undefined}>
                <Input value={field.key} onChange={(e) => update({ key: e.target.value })}
                  status={duplicateKey ? 'error' : undefined} />
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 11 }}>标题 (title)</span>}>
                <Input value={field.title} onChange={(e) => update({ title: e.target.value })} />
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 11 }}>占位符</span>}>
                <Input value={field.placeholder} onChange={(e) => update({ placeholder: e.target.value })} />
              </Form.Item>
              {field.type === 'text' && (
                <>
                  <Form.Item label={<span style={{ fontSize: 11 }}>最小长度</span>}>
                    <InputNumber
                      value={field.rules?.find((r) => r.type === 'minLength')?.value as number}
                      onChange={(v) => {
                        const rules = field.rules?.filter((r) => r.type !== 'minLength') || []
                        if (v) rules.push({ type: 'minLength', value: v, message: `至少 ${v} 个字符` })
                        update({ rules })
                      }}
                      min={0} style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label={<span style={{ fontSize: 11 }}>最大长度</span>}>
                    <InputNumber
                      value={field.rules?.find((r) => r.type === 'maxLength')?.value as number}
                      onChange={(v) => {
                        const rules = field.rules?.filter((r) => r.type !== 'maxLength') || []
                        if (v) rules.push({ type: 'maxLength', value: v, message: `不超过 ${v} 个字符` })
                        update({ rules })
                      }}
                      min={1} style={{ width: '100%' }}
                    />
                  </Form.Item>
                </>
              )}
              <Form.Item label={<span style={{ fontSize: 11 }}>必填</span>}>
                <Switch checked={field.required} onChange={(v) => {
                  const rules = [...(field.rules || [])]
                  if (v) {
                    // 开启必填 → 校验列表自动添加 required 规则
                    if (!rules.some((r) => r.type === 'required')) {
                      rules.push({ type: 'required', message: '此字段为必填项' })
                    }
                  } else {
                    // 关闭必填 → 移除所有 required 规则
                    update({ rules: rules.filter((r) => r.type !== 'required') })
                    update({ required: false })
                    return
                  }
                  update({ required: true, rules })
                }} size="small" />
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 11 }}>所属 Tab</span>}>
                {groupTab && !directTab ? (
                  <Select
                    size="small"
                    style={{ fontSize: 11 }}
                    disabled
                    value={groupTab.id}
                    options={[{
                      value: groupTab.id,
                      label: <span><BlockOutlined style={{ marginRight: 4 }} />{groupTab.title}（继承自容器）</span>,
                    }]}
                  />
                ) : (
                  <Select
                    allowClear
                    size="small"
                    style={{ fontSize: 11 }}
                    placeholder="未分配"
                    value={directTab?.id ?? undefined}
                    onChange={(v) => {
                      dispatch({ type: 'SET_FIELD_TAB', payload: { fieldId: field.id, tabId: v ?? null } })
                    }}
                    options={state.schema.tabs.map((t) => ({
                      value: t.id,
                      label: <span><BlockOutlined style={{ marginRight: 4 }} />{t.title}</span>,
                    }))}
                  />
                )}
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 11 }}>所属容器</span>}>
                <Select
                  allowClear
                  size="small"
                  style={{ fontSize: 11 }}
                  placeholder="未分配"
                  value={inGroup?.id ?? undefined}
                  onChange={(v) => {
                    dispatch({ type: 'SET_FIELD_GROUP', payload: { fieldId: field.id, groupId: v ?? null } })
                  }}
                  options={state.schema.groups.map((g) => ({
                    value: g.id,
                    label: <span><FolderOutlined style={{ marginRight: 4 }} />{g.title}</span>,
                  }))}
                />
              </Form.Item>
              {field.type === 'upload' && (
                <>
                  <Form.Item label={<span style={{ fontSize: 11 }}>最大数量</span>}>
                    <InputNumber value={field.maxCount} onChange={(v) => update({ maxCount: v ?? 1 })} min={1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label={<span style={{ fontSize: 11 }}>文件类型</span>}>
                    <Select size="small" value={field.accept ?? 'image/*'} onChange={(v) => update({ accept: v })}
                      options={[
                        { value: 'image/*', label: '图片' },
                        { value: '.pdf,.doc,.docx', label: '文档' },
                        { value: '*', label: '不限' },
                      ]} />
                  </Form.Item>
                </>
              )}
              {field.type === 'textarea' && (
                <Form.Item label={<span style={{ fontSize: 11 }}>行数</span>}>
                  <InputNumber value={field.rows} onChange={(v) => update({ rows: v ?? 4 })} min={1} style={{ width: '100%' }} />
                </Form.Item>
              )}
              {field.type === 'select' && (
                <Form.Item label={<span style={{ fontSize: 11 }}>多选模式</span>}>
                  <Switch checked={field.multiple} onChange={(v) => update({ multiple: v })} size="small" />
                </Form.Item>
              )}
              {(field.type === 'radio' || field.type === 'checkbox' || field.type === 'select') && (
                <Form.Item label={<span style={{ fontSize: 11 }}>选项列表</span>}>
                  <OptionEditor options={field.options || []} onChange={(opts) => update({ options: opts })} />
                </Form.Item>
              )}
            </Form>
          ),
        },
        {
          key: 'validation', label: '校验',
          children: (
            <div style={{ padding: '0 4px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                {VALIDATION_PRESETS.map((p) => (
                  <Button key={p.label} size="small" style={{ fontSize: 11 }}
                    onClick={() => {
                      if (p.label === '正则表达式') {
                        const pattern = prompt('请输入正则表达式：')
                        if (!pattern) return
                        const msg = prompt('请输入错误提示：') || '格式不正确'
                        update({ rules: [...(field.rules || []), { type: 'pattern', value: pattern, message: msg }] })
                      } else {
                        const updates: Record<string, unknown> = { rules: [...(field.rules || []), { ...p.rule }] }
                        if (p.label === '必填') updates.required = true
                        update(updates)
                      }
                    }}>
                    + {p.label}
                  </Button>
                ))}
              </div>
              <ValidationList rules={field.rules || []} onChange={(rules) => update({ rules })}
                onRequiredChange={(v) => update({ required: v })} />
            </div>
          ),
        },
        {
          key: 'linkage', label: '联动',
          children: (
            <div style={{ padding: '0 4px' }}>
              <LinkageEditor
                allFields={state.schema.fields}
                linkages={field.linkage || []}
                currentFieldKey={field.key}
                onChange={(linkage) => update({ linkage })}
              />
            </div>
          ),
        },
        {
          key: 'layout', label: '布局',
          children: (
            <div style={{ padding: '12px 4px' }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>宽度 (24 栅格)</div>
              <Slider
                min={6} max={24} step={6}
                value={field.colSpan ?? 12}
                onChange={(v) => update({ colSpan: v })}
                marks={{ 6: '1/4', 12: '1/2', 18: '3/4', 24: '100%' }}
              />
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>对齐方式</div>
                <Radio.Group
                  value={field.textAlign ?? 'left'}
                  onChange={(e) => update({ textAlign: e.target.value })}
                  size="small"
                >
                  <Radio.Button value="left"><AlignLeftOutlined /> 左对齐</Radio.Button>
                  <Radio.Button value="center"><AlignCenterOutlined /> 居中</Radio.Button>
                  <Radio.Button value="right"><AlignRightOutlined /> 右对齐</Radio.Button>
                </Radio.Group>
              </div>
            </div>
          ),
        },
      ]} />
      </ScrollPanel>
    )
  }

  // ── 空状态 ──
  return (
    <ScrollPanel style={panelOuter}>
      <div style={{ padding: 24 }}>
        <Empty description="点击画布中的字段或分组以编辑属性" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    </ScrollPanel>
  )
}

const panelOuter: React.CSSProperties = {
  width: 320, flexShrink: 0, background: '#fff', height: '100%',
  borderLeft: '1px solid #e5e7eb',
}

// ── 选项编辑器 ──

function OptionEditor({ options, onChange }: { options: FieldOption[]; onChange: (opts: FieldOption[]) => void }) {
  const add = () => onChange([...options, { label: '', value: '' }])
  const remove = (idx: number) => onChange(options.filter((_, i) => i !== idx))
  const edit = (idx: number, field: 'label' | 'value', val: string) => {
    const next = [...options]
    next[idx] = { ...next[idx]!, [field]: val }
    onChange(next)
  }
  return (
    <div>
      {options.map((opt, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          <Input size="small" placeholder="标签" value={opt.label} onChange={(e) => edit(i, 'label', e.target.value)} style={{ flex: 1 }} />
          <Input size="small" placeholder="值" value={opt.value} onChange={(e) => edit(i, 'value', e.target.value)} style={{ flex: 1 }} />
          <Button size="small" icon={<DeleteOutlined />} onClick={() => remove(i)} danger type="text" />
        </div>
      ))}
      <Button size="small" icon={<PlusOutlined />} onClick={add} type="dashed" block style={{ fontSize: 12 }}>添加选项</Button>
    </div>
  )
}

// ── 校验规则列表 ──

function ValidationList({ rules, onChange, onRequiredChange }: {
  rules: ValidationRule[]
  onChange: (r: ValidationRule[]) => void
  onRequiredChange?: (v: boolean) => void
}) {
  const remove = (idx: number) => {
    if (rules[idx]?.type === 'required') onRequiredChange?.(false)
    onChange(rules.filter((_, i) => i !== idx))
  }
  const edit = (idx: number, field: string, val: string | number) => {
    const next = [...rules]
    if (field === 'type') {
      // 切换规则类型：从 required 切走 → 关 required；切到 required → 开 required
      if (rules[idx]?.type === 'required' && val !== 'required') onRequiredChange?.(false)
      if (val === 'required') onRequiredChange?.(true)
    }
    next[idx] = { ...next[idx]!, [field]: val }
    onChange(next)
  }
  if (rules.length === 0) return <div style={{ fontSize: 12, color: '#d1d5db', textAlign: 'center', padding: 20 }}>暂无校验规则</div>
  return (
    <div>
      {rules.map((rule, i) => (
        <div key={i} style={{ padding: 8, marginBottom: 6, borderRadius: 6, background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Select size="small" value={rule.type} onChange={(v) => edit(i, 'type', v)} style={{ width: 100, fontSize: 11 }}
              options={[
                { value: 'required', label: '必填' }, { value: 'minLength', label: '最小长度' },
                { value: 'maxLength', label: '最大长度' }, { value: 'pattern', label: '正则表达式' },
              ]} />
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(i)} />
          </div>
          {(rule.type === 'minLength' || rule.type === 'maxLength') && (
            <InputNumber size="small" placeholder="数值" value={rule.value as number} onChange={(v) => edit(i, 'value', v ?? 0)} min={1} style={{ width: '100%', marginBottom: 4 }} />
          )}
          {rule.type === 'pattern' && (
            <Input size="small" placeholder="正则表达式" value={rule.value as string} onChange={(e) => edit(i, 'value', e.target.value)} style={{ marginBottom: 4, fontSize: 10, fontFamily: 'monospace' }} />
          )}
          <Input size="small" placeholder="错误提示" value={rule.message} onChange={(e) => edit(i, 'message', e.target.value)} style={{ fontSize: 11 }} />
        </div>
      ))}
    </div>
  )
}

// ── 字段联动编辑器 ──

function LinkageEditor({ allFields, linkages, currentFieldKey, onChange }: {
  allFields: { id: string; key: string; title: string; type: string; options?: { label: string; value: string }[] }[]
  linkages: FieldLinkage[]; currentFieldKey?: string; onChange: (l: FieldLinkage[]) => void
}) {
  const add = () => onChange([...linkages, { targetField: '', condition: 'equals', value: '', action: 'visible' }])
  const remove = (idx: number) => onChange(linkages.filter((_, i) => i !== idx))
  const edit = (idx: number, f: string, v: unknown) => {
    const next = [...linkages]
    if (f === 'targetField') {
      next[idx] = { ...next[idx]!, targetField: v as string, condition: 'equals', value: '' }
    } else {
      next[idx] = { ...next[idx]!, [f]: v }
    }
    onChange(next)
  }

  const getTargetField = (key: string) => allFields.find((f) => f.key === key)
  const isCheckbox = (key: string) => getTargetField(key)?.type === 'checkbox'
  const isSelect = (key: string) => {
    const f = getTargetField(key)
    return f?.type === 'select' || f?.type === 'radio'
  }

  return (
    <div>
      {linkages.map((lk, i) => {
        const target = getTargetField(lk.targetField)
        const showSelect = isCheckbox(lk.targetField) || isSelect(lk.targetField)
        return (
          <div key={i} style={{ padding: 8, marginBottom: 8, borderRadius: 6, background: '#faf5ff', border: '1px solid #e9d5ff', fontSize: 11 }}>
            <div style={{ marginBottom: 4, color: '#7c3aed', fontWeight: 600, fontSize: 10 }}>联动规则 {i + 1}</div>
            <div style={{ marginBottom: 4, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>当 </span>
              <Select size="small" value={lk.targetField || undefined} onChange={(v) => edit(i, 'targetField', v)} placeholder="目标字段" style={{ width: 110, fontSize: 11 }}
                options={allFields.filter((f) => f.key !== currentFieldKey).map((f) => ({ value: f.key, label: f.title || f.key }))} />
              <Select size="small" value={lk.condition} onChange={(v) => edit(i, 'condition', v)} style={{ width: 70, fontSize: 11 }}
                options={
                  isCheckbox(lk.targetField)
                    ? [{ value: 'in', label: '包含' }, { value: 'notEquals', label: '不包含' }]
                    : [{ value: 'equals', label: '等于' }, { value: 'notEquals', label: '不等于' }]
                } />
              {showSelect && target?.options ? (
                <Select size="small" value={lk.value as string} onChange={(v) => edit(i, 'value', v)}
                  placeholder="选择" style={{ width: 100, fontSize: 11 }}
                  options={target.options.map((o) => ({ value: o.value, label: o.label }))} />
              ) : (
                <Input size="small" placeholder="值" value={lk.value as string} onChange={(e) => edit(i, 'value', e.target.value)} style={{ width: 70, fontSize: 11 }} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Select size="small" value={lk.action} onChange={(v) => edit(i, 'action', v)} style={{ width: 90, fontSize: 11 }}
                options={[{ value: 'visible', label: '显示' }, { value: 'hidden', label: '隐藏' }, { value: 'required', label: '设为必填' }]} />
              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(i)} />
            </div>
          </div>
        )
      })}
      <Button size="small" icon={<PlusOutlined />} onClick={add} type="dashed" block style={{ fontSize: 12 }}>添加联动规则</Button>
    </div>
  )
}
