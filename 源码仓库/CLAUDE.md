# CLAUDE.md

## 必须遵守

- **写完代码先验证再提交**：
  1. 前端：`npx tsc -p tsconfig.app.json --noEmit` + **启动 dev server 刷新浏览器确认页面正常渲染**
  2. 后端：**启动 uvicorn 确认无 import 错误** + `python -m app.scripts.test_state_machine` 跑状态机冒烟测试
  3. **状态机变更后必须逐个验证所有合法+非法转移**
  4. 确认通过后才 `git add` + `git commit`。不许攒未提交改动。
- **数据库设计禁用 ENUM** — 任何状态/类型列必须用 VARCHAR,ENUM枚举上浮到前端或者后端。写新迁移前先 `SHOW CREATE TABLE` 检查目标列类型。修改模型后必须 `find . -name '__pycache__' -exec rm -rf {} +` 清缓存。
- **写模块就要写 test**：做完功能模块后写黑盒测试，`pytest -v` 全绿才算完。
- **不可用 `git checkout -- directory/` 批量回退** ——会无差别覆盖已跟踪文件的所有未提交修改。
- **简单优先**，不做过度工程化。用户说"简单一点"立刻停止复杂方案。

## 代码注释规范（参赛项目标准）

**每个后端 `.py` 文件头部必须用 `"""` 写：**
```python
"""
文件名.py — 中文名称
Author: hongchuwudi
Description: 一句话描述
# Function: 函数名 — 说明
# Class: 类名 — 说明
# Constant: 常量名 — 说明
"""
```

**每个前端 `.tsx/.ts` 文件头部必须写 `/** */` 块注释。**

**模块内所有顶层元素必须用单行注释标注：**
- `# 常量 — 说明`
- `# 函数名 — 说明`
- `# 类名 — 说明`

**模型文件的数据库列也需要 `#` 行内注释。**

每条注释占一行，不写多行文档字符串。文件内注释风格统一，先注释后定义。

## 前端代码规范

1. **类型集中管理** — 所有 `interface`、`type`、`class` 定义必须放在 `src/types/models/` 目录下，不允许在 API 文件或页面组件中定义类型。页面和 API 文件通过 `import { xxx } from '@/types/models'` 引用。
2. **禁止 any** — 任何情况下不得使用 `any` 类型。动态数据用 `Record<string, unknown>` 或 `unknown`，确需类型断言时通过 `as unknown as TargetType` 两步转换。
3. **单一职责** — 每个函数、类、文件只做一件事。一个 `.tsx` 文件只导出一个主要组件。辅助组件拆分到 `components/` 子目录。
4. **控制文件大小** — 单个文件不超过 300 行。超过则拆分为多个模块。页面目录结构：`index.tsx`（路由入口）+ `components/`（子组件）+ `utils/`（工具函数）。
5. **JSDoc 公共 API** — 所有 `export` 的函数、组件、类型必须写 `/** */` 注释。格式：
   ```ts
   /** 简短描述 */
   export function xxx() {}
   ```
6. **文件头部注释** — 每个 `.tsx/.ts` 文件顶部必须用 `/** */` 写：文件名 / Author: hongchuwudi / Description。
7. **命名规范** — 组件用 PascalCase，函数用 camelCase，常量用 UPPER_SNAKE_CASE，文件名用 PascalCase（组件）或 camelCase（工具）。
8. **检查命令** — 提交前必须执行 `npx tsc -p tsconfig.app.json --noEmit` 零错误通过。
9. **禁止 emoji** — 代码中不得使用 emoji 表情包（如 `✅` `❌` `🤖`）。用 Ant Design 图标组件（`@ant-design/icons`）或纯文本标签替代。
10. **常量集中管理** — 所有常量、配置映射（如状态颜色、label 字典）必须定义在 `src/types/` 目录下。组件文件只 import 使用，不得在组件内定义内联常量。

## 导航架构

- `TopHeader.tsx` — 可复用顶部导航，`variant="public"|"workspace"`
- `AppLayout.tsx` — 公共页布局：TopHeader(public) + Outlet
- `WorkspaceLayout.tsx` — 工作台布局：侧边栏 + TopHeader(workspace) + Outlet
- 工作台按钮是进入/退出开关：公共页"工作台"→ `/datasets`，工作台内"⟳ 返回首页"→ `/`
- `/dashboard` 路由已删除，工作台默认落地页是 `/datasets`

## Schema Designer 架构

### 文件结构
- `index.tsx` — DndContext + handleDragEnd/Over + mobile drawer 切换
- `SchemaDesignerContext.tsx` — useReducer 全局状态 + 所有 action + LOAD_SCHEMA 迁移旧格式
- `types.ts` — DesignerState / DesignerAction / FieldConfig / GroupConfig / TabConfig
- `panels/Palette.tsx` — 左侧物料面板（纯字段类型，无布局项）
- `panels/Canvas.tsx` — 中间画布（Tab栏 + 字段渲染 + GroupShell + 工具栏按钮）
- `panels/PropertyEditor.tsx` — 右侧属性面板（字段属性/分组属性）
- `components/FieldCard.tsx` — 物料卡片（拖拽+点击+按钮+容器内/Tab内排序）
- `components/SchemaPreview.tsx` — JSON Schema 预览抽屉（语法高亮+字体可调+导入）
- `components/ScrollPanel.tsx` — 带渐变指示器的滚动容器
- `utils/schemaTransformer.ts` — SchemaDesign → Formily JSON Schema
- `utils/schemaParser.ts` — Formily JSON Schema → SchemaDesign（逆向导入）

### 数据模型（三层分离）
```
Tab → 容器 → 物料
```
- `TabConfig { id, title, fieldIds[], groupIds[] }` — 标签页，可含字段+容器
- `GroupConfig { id, title, fieldIds[] }` — 容器（分组框），只含字段
- `FieldConfig { id, type, key, title, ... }` — 物料（表单控件），叶子节点

### 状态管理 (useReducer)
- `selectedFieldId` — 当前选中字段
- `selectedGroupId` — 当前选中容器（点击容器标题栏）
- `activeTabId` — 当前激活的 Tab
- `hoveredGroupId` — 拖拽悬停的分组高亮
- `schema.fields[]` — 全局字段列表
- `schema.groups[]` — 容器列表
- `schema.tabs[]` — Tab 列表

### Tab + 容器 系统
- **Tab/容器创建** — Canvas 顶部工具栏 [+Tab] [+分组] 按钮
- **不自动归属** — 拖入字段不自动加入任何 Tab/容器
- **未分配区** — 有 Tab 时，未归属字段/容器显示在顶部虚线分隔的"未分配区域"
- **手动分配** — 选中字段 → 右侧属性面板 → "所属 Tab" / "所属容器" 下拉
- **容器内字段继承 Tab** — 字段在容器内时 Tab 下拉禁用，标注"(继承自容器)"
- **SET_FIELD_TAB / SET_FIELD_GROUP 互斥** — 分配到 Tab 时清除容器，反之亦然
- **Tab 编辑** — 双击 Tab 标题内联编辑

### 关键事件处理
- **FieldCard 点击选中** — dnd-kit preventDefault 吃掉 onClick，用 onPointerDown/Up + 坐标差 <4px 判断
- **FieldCard 按钮** — onMouseDown + stopPropagation 阻断 dnd-kit
- **FieldCard 拖拽** — `{...listeners}` 在整卡上，dndPointerDown 合并调用保留拖拽
- **Tab 切换** — SortableTab 同样用 onPointerDown/Up 坐标判定

### 已修 Bug 记录
- SET_FIELD_GROUP 类型隔离已移除（过于复杂，回归简单）
- findFieldGroup 优先级已移除（回归简单遍历）
- DUPLICATE_FIELD 会同步更新 groups，保持所在分组不变
- Canvas 渲染按 tab.fieldIds 顺序而非 fields 数组顺序
- 拖入分组容器后需手动在属性面板分配 Tab

### 不碰的原则
- 绝不擅自修改用户密码/数据库记录
- git checkout 回退文件前先问用户
- 写完代码启动验证，不做静态检查就提交
