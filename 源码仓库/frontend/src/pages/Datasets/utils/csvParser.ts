/** csvParser.ts — CSV/JSON/JSONL/Excel 数据解析工具
 * Author: hongchuwudi
 * Description: 自动检测数据格式并解析为统一结构，支持 CSV、JSON、JSONL、XLSX
 */
import * as XLSX from 'xlsx'

/** 解析单行 CSV（处理引号转义） */
export function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = false
      } else current += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      result.push(current.trim()); current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

/** 解析 CSV 文本为对象数组 */
export function parseCsv(text: string): { items: unknown[]; format: 'csv' } | { error: string } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { error: 'CSV 至少需要标题行和一行数据' }

  const headers = parseCsvLine(lines[0]!)
  if (headers.length === 0 || headers.every((h) => !h)) return { error: 'CSV 标题行为空' }

  const items: unknown[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim()
    if (!line) continue
    const cols = parseCsvLine(line)
    if (cols.length !== headers.length) return { error: `第 ${i + 1} 行列数(${cols.length})与标题(${headers.length})不匹配` }
    const obj: Record<string, unknown> = {}
    headers.forEach((h, j) => { obj[h] = cols[j] })
    items.push(obj)
  }
  if (items.length === 0) return { error: 'CSV 无有效数据行' }
  return { items, format: 'csv' }
}

// ── Excel 解析（仅文件上传，不做文本粘贴自动检测）──

/** 解析 Excel 文件（xlsx/xls）为对象数组 */
export function parseExcel(buffer: ArrayBuffer): { items: unknown[]; format: 'xlsx' } | { error: string } {
  try {
    const wb = XLSX.read(buffer, { type: 'array' })
    const sheetName = wb.SheetNames[0]
    if (!sheetName) return { error: 'Excel 文件中无工作表' }
    const sheet = wb.Sheets[sheetName]
    if (!sheet) return { error: 'Excel 工作表不可读' }
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
    if (rows.length < 2) return { error: 'Excel 至少需要标题行和一行数据' }
    const headers = rows[0]!.map((h) => String(h).trim()).filter((h) => h)
    if (headers.length === 0) return { error: 'Excel 标题行为空' }
    const items: unknown[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.every((c) => !String(c).trim())) continue
      const obj: Record<string, unknown> = {}
      headers.forEach((h, j) => { obj[h] = row[j] ?? '' })
      items.push(obj)
    }
    if (items.length === 0) return { error: 'Excel 无有效数据行' }
    return { items, format: 'xlsx' }
  } catch {
    return { error: 'Excel 文件解析失败' }
  }
}

// ── 数据解析：自动检测 JSON / JSONL / CSV ──

/** 自动检测并解析输入数据（JSON/JSONL/CSV） */
export function parseInput(value: string, hintFormat?: string): { items: unknown[]; format: string } | { error: string } {
  const trimmed = value.trim()
  if (!trimmed) return { items: [], format: hintFormat || 'json' }

  // JSON 数组
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (!Array.isArray(parsed)) return { error: 'JSON 数据必须是数组（以 [ 开头）' }
      return { items: parsed, format: 'json' }
    } catch {
      return { error: 'JSON 数组格式错误' }
    }
  }

  // 单个 JSON 对象 → 自动包成数组
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { items: [parsed], format: 'json' }
      }
    } catch { /* 不是合法 JSON 对象，继续尝试 JSONL */ }
  }

  // CSV 检测：非 JSON 开头
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim())
  if (!trimmed.startsWith('{') && !trimmed.startsWith('"') && !trimmed.startsWith('[')) {
    const csvResult = parseCsv(trimmed)
    if (!('error' in csvResult)) return csvResult
    if (hintFormat === 'csv') return csvResult
  }

  // JSONL：每行一个 JSON 对象
  const items: unknown[] = []
  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]!))
    } catch {
      return { error: `第 ${i + 1} 行 JSON 解析失败: ${lines[i]!.slice(0, 60)}...` }
    }
  }
  if (items.length === 0) return { error: '未检测到有效数据（JSON 数组 / JSONL / CSV）' }
  return { items, format: 'jsonl' }
}
