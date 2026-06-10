/** useEditorSettings.ts — 编辑器设置 Hook
 * Author: hongchuwudi
 * Description: 管理数据导入页编辑器的字体与字号设置，持久化到 localStorage
 */
import { useState } from 'react'

/** 编辑器字体与字号配置 */
export interface EditorSettings {
  fontSize: number
  fontFamily: string
}

/** 字体选项列表 */
export const FONT_OPTIONS = [
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { label: 'Fira Code', value: '"Fira Code", monospace' },
  { label: 'Consolas', value: 'Consolas, monospace' },
  { label: 'Monospace', value: 'monospace' },
]

/** localStorage 存储键名 */
export const SETTINGS_KEY = 'labelhub_editor_settings'

function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { fontSize: 16, fontFamily: '"JetBrains Mono", monospace' }
}

function saveSettings(s: EditorSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

/** 编辑器设置 Hook，返回 [settings, update] */
function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(loadSettings)

  const update = (partial: Partial<EditorSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }

  return [settings, update] as const
}

export default useEditorSettings
