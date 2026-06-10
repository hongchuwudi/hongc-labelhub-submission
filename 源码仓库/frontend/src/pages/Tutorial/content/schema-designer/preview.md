# 预览与 JSON 视图

Schema Designer 提供两种方式查看和验证搭建结果。

## 表单预览

![Schema Preview](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/schema-preview.png)


点击工具栏「预览」按钮打开抽屉面板，展示完全交互的表单。

### 特性

- **实时交互**：单选、多选、文本输入等控件可实际点击操作
- **联动生效**：字段联动规则在预览中实时工作
- **校验模拟**：「校验（模拟提交）」按钮检查必填、长度、正则等规则
- **Tab 切换**：多 Tab 布局支持切换标签页查看
- **与标注台一致**：预览使用相同的 SchemaForm / TabbedForm 渲染器
- **白底高亮**：JSON 代码区和编辑器统一白底亮色主题

## JSON 视图

![Schema Json](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/schema-json.png)


点击工具栏「查看 JSON」按钮打开抽屉面板，展示当前 Schema 的 JSON 结构。

### 特性

- 语法高亮（键蓝色、值绿色、数字橙色、布尔/空紫色、标点灰色）
- 字体选择（JetBrains Mono / Fira Code / Consolas / Monospace）
- 字号调整（11-18px），设置持久化到 localStorage
- JSON 导入：粘贴 JSON Schema 反向解析为 Designer 配置

## JSON Schema 结构

```json
{
  "title": "商品标注",
  "description": "...",
  "fields": [
    {
      "id": "f1",
      "key": "category",
      "type": "radio",
      "title": "商品分类",
      "required": true,
      "colSpan": 12,
      "options": [{"label": "电子产品", "value": "电子产品"}]
    }
  ],
  "groups": [...],
  "tabs": [...]
}
```

Schema 与 JSON 双向互转由 `schemaTransformer.ts`（导出）和 `schemaParser.ts`（导入）实现。


