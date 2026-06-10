# 画布操作

画布是 Schema Designer 中间区域，字段在此排列、编辑和管理。

## 字段操作

![Schema Canvas](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/schema-canvas.png)


- **拖拽排序** — 字段在画布内自由拖拽调整顺序
- **放入容器** — 拖入分组框内自动归属到该容器
- **拖入 Tab** — 拖入 Tab 内自动分配到对应 Tab
- **点击选中** — 右侧属性面板同步显示配置项
- **复制 / 删除** — 每个字段卡片支持按钮操作

## 布局规则

- 字段按 24 列网格布局，`colSpan` 控制宽度
- `colSpan=12` 半宽，`colSpan=24` 全宽
- 字段通过 `flexWrap: wrap` 自动换行

## Tab + 容器

![Schema Tabs](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/schema-tabs.png)


- 工具栏 [Tab] 按钮创建标签页
- 工具栏 [分组] 按钮创建分组容器
- 字段可分配到 Tab 或容器（互斥）
- 未分配字段在有 Tab 时显示在虚线分隔的"未分配区域"


