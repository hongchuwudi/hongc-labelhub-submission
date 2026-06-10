# 物料面板

物料面板在 Schema Designer 左侧，集中展示所有可用字段类型。

## 物料类型

![Schema Palette](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/schema-palette.png)


| 物料 | 字段类型 | 说明 |
|------|------|------|
| 单行文本 | `text` | 基础文本输入 |
| 多行文本 | `textarea` | 长文本，可设行数和最大长度 |
| 单选 | `radio` | 按钮样式选项组 |
| 多选 | `checkbox` | 多选框组 |
| 下拉选择 | `select` | 支持多选 / 标签模式 |
| 富文本编辑器 | `richtext` | React Quill 编辑器 |
| JSON 编辑器 | `json` | 语法高亮 + 字体设置 |
| 文件上传 | `upload` | 支持图片/文件，OSS 存储 |
| LLM 触发 | `llm` | 题级 AI 辅助调用 |
| 展示项 | `showitem` | 只读展示原始数据，不提交 |

## 使用

从物料区将字段拖入中间画布即完成添加。拖入分组容器内自动归属。拖入 Tab 区域自动分配到对应 Tab。

