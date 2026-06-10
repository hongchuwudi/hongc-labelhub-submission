# 字段映射

导出时支持自定义输出哪些字段及重命名。

## 功能

- **字段选择**：勾选需导出的字段，未勾选不出现
- **字段重命名**：`result.category` → `类目`
- **审核记录开关**：控制是否包含 reviewer_id、reviewed_at

## 使用方式

![Export Mapping](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/export-mapping.png)


1. 选择导出格式
2. 勾选需要导出的字段（不选则导出全部）
3. 在重命名区域输入新列名
4. 打开/关闭"包含审核记录"
5. 点击"开始导出"

## 数据结构

前端传给后端的 `field_mapping` 参数：
```json
{
  "include_review": true,
  "fields": ["item_id", "result.category", "result.keywords"],
  "rename": {"result.category": "类目"}
}
```

后端 `_apply_mapping()` 先通过 `_flatten()` 展平嵌套为 `result.category` 格式，再按 `fields` 过滤、`rename` 重命名。

