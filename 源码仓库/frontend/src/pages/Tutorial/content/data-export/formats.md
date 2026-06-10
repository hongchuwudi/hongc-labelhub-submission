# 导出格式

LabelHub 支持四种标注结果导出格式，满足不同下游系统需求。

## 四种格式

![Export Formats](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/export-formats.png)


| 格式 | 扩展名 | 特点 | 适用场景 |
|------|:---:|------|------|
| JSON | `.json` | 结构化数组，`indent=2` | API 对接、程序处理 |
| JSONL | `.jsonl` | 每行一个 JSON 对象 | 大数据量、流式处理 |
| CSV | `.csv` | UTF-8 BOM 编码，Excel 友好 | 数据分析、表格查看 |
| Excel | `.xlsx` | openpyxl 生成，直接打开 | 非技术用户查看 |

## 数据来源

导出数据来自 `LabelResult` 表，筛选 `status IN ('warehouse', 'final_review')` 的结果。每条导出记录包含：
- 数据集原始字段（`original`）
- 标注结果字段（`result`）
- item_id、labeler_id、round
- 可选：reviewer_id、reviewed_at

