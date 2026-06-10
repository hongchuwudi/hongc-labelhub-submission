# 功能概述

Schema Designer 是 LabelHub 的可视化标注表单搭建工具。三栏布局（物料区 / 画布 / 属性面板），拖拽式操作，无需代码即可定义标注字段结构。

## 核心设计

![Schema Designer](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/schema-designer.png)


- **Designer / Renderer 解耦** — 搭建产出为可序列化 JSON Schema，同一份 Schema 在 Designer 预览和 Workbench 运行时渲染
- **JSON Schema 驱动** — 字段定义、校验规则、联动关系全部 JSON 存储
- **版本管理** — 每次保存自动 +1，历史版本可追溯

## 核心能力

- 10+ 种物料类型（单行/多行文本、单选/多选、下拉选择、文件上传、JSON 编辑器、LLM 触发、ShowItem 等）
- 字段校验规则（必填、长度、正则、最小/最大值）
- 字段联动（条件显示/隐藏，多字段级联）
- 分组容器（GroupConfig）+ Tab 多标签布局（TabConfig）
- 实时表单预览 + JSON Schema 查看 + 校验模拟


