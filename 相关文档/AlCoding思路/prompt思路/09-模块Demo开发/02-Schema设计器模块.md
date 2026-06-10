# Schema 设计器模块 Demo

## 提示词

```
请帮我实现 Schema 设计器（可视化表单搭建器）的 MVP 版本。

这是项目的核心模块，先做一个可工作的 Demo。

后端部分：
1. 创建 LabelSchema 模型：
   - id, name, version(默认1), schema(JSON), version_history(JSON数组), owner_id, created_at

2. Schema API (api/v1/schemas/)：
   - GET /api/schemas — 列表（分页）
   - POST /api/schemas — 创建
   - GET /api/schemas/:id — 详情（含完整 schema JSON）
   - PUT /api/schemas/:id — 更新（自动 version+1，旧版存入 version_history）
   - DELETE /api/schemas/:id — 删除

前端部分（核心）：
1. 状态管理 (SchemaDesignerContext.tsx)：
   - 用 useReducer 管理全局状态
   - State 包含：fields[]、groups[]、tabs[]、selectedFieldId、selectedGroupId、activeTabId
   - Action 类型：ADD_FIELD、UPDATE_FIELD、DELETE_FIELD、DUPLICATE_FIELD、
     ADD_GROUP、UPDATE_GROUP、DELETE_GROUP、
     ADD_TAB、UPDATE_TAB、DELETE_TAB、
     SET_FIELD_GROUP、SET_FIELD_TAB、
     SET_SELECTED、SET_ACTIVE_TAB、LOAD_SCHEMA

2. 类型定义 (types.ts)：
   - FieldConfig: { id, type, key, title, description, required, default, validations, llmConfig, ... }
   - GroupConfig: { id, title, fieldIds[] }
   - TabConfig: { id, title, fieldIds[], groupIds[] }

3. 左侧物料面板 (panels/Palette.tsx)：
   - 列出所有可拖拽的字段类型：单行输入、多行文本、单选、多选、标签选择、富文本、JSON编辑器、文件上传、LLM交互组件、展示项(ShowItem)
   - 每个类型一个卡片，可以拖拽到画布

4. 中间画布 (panels/Canvas.tsx)：
   - 顶部工具栏：+Tab 按钮、+分组 按钮、预览 按钮、导出JSON 按钮
   - Tab 栏：显示所有 Tab，点击切换，双击可编辑标题
   - 字段列表：按 tab.fieldIds 顺序渲染 FieldCard
   - 分组容器 (GroupShell)：渲染 group.fieldIds 中的 FieldCard，可折叠
   - 未分配区域：有 Tab 时，未归属任何 Tab 的字段显示在顶部虚线分隔区
   - 空白区域可接受拖放

5. 右侧属性面板 (panels/PropertyEditor.tsx)：
   - 选中字段时：编辑名称、key、类型、标题、必填、默认值、校验规则、所属Tab、所属分组
   - 选中容器时：编辑名称、包含的字段列表
   - 注意：字段在容器内时，"所属Tab"下拉禁用并显示"(继承自容器)"

6. 字段卡片 (components/FieldCard.tsx)：
   - 显示字段类型图标 + 标题
   - 支持拖拽排序
   - 点击选中
   - 复制/删除按钮

7. 创建初始物料渲染组件 (fields/)：
   先实现 3-4 个简单物料的渲染器，验证 Schema → 渲染的链路可用

8. Schema 预览抽屉 (components/SchemaPreview.tsx)：
   - 显示当前搭建产物的 JSON Schema
   - 语法高亮
   - 支持导入 JSON Schema（逆向解析回设计器）

请按顺序实现：类型定义 → 状态管理 → 物料面板 → 字段卡片 → 画布 → 属性面板 → 预览。
每完成一个环节验证拖拽和状态更新是否正常。
```

## AI 的回答

```
LabelSchema model (name/version/schema JSON/version_history JSON/owner_id), CRUD API with version auto-increment, SchemaDesignerContext with useReducer (fields/groups/tabs/selectedFieldId/selectedGroupId/activeTabId), ADD_FIELD/UPDATE_FIELD/DELETE_FIELD/DUPLICATE_FIELD actions, Palette panel with 10 draggable field types, Canvas with Tab bar + field rendering + GroupShell + unassigned area, PropertyEditor for field/group config, FieldCard with drag+click+buttons, SchemaPreview drawer with JSON syntax highlight + import
```
