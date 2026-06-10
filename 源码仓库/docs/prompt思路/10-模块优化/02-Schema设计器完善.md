# Schema 设计器完善

## 提示词

```
现在 Schema 设计器的 Demo 已能拖拽搭建，请完善以下功能：

1. 10 种物料渲染器全部实现 (fields/)：
   - TextInput — 单行输入
   - TextArea — 多行文本
   - RadioGroup — 单选（动态选项配置）
   - CheckboxGroup — 多选（动态选项配置）
   - TagSelect — 标签选择
   - RichText — 富文本编辑器（Quill）
   - JsonEditor — JSON 编辑器（Monaco Editor）
   - FileUpload — 文件/图片上传
   - LLMInteraction — LLM 交互触发组件
   - ShowItem — 展示项（只读渲染原始数据）

2. 字段联动功能完善：
   - 条件显示：PropertyEditor 中配置 "当字段A的值为X时，显示本字段"
   - 联动校验：PropertyEditor 中配置自定义校验规则
   - Schema 中如何表达这些联动关系

3. 表单预览 (FormPreview.tsx)：
   - 渲染完整的 Formily 表单
   - 可填数据并提交验证
   - 展示 Schema 驱动的校验效果

4. Schema 导出/导入工具：
   - utils/schemaTransformer.ts — SchemaDesign → Formily JSON Schema
   - utils/schemaParser.ts — Formily JSON Schema → SchemaDesign（逆向导入）
   - 导入时处理旧格式兼容（版本迁移）

5. 交互细节优化：
   - dnd-kit 拖拽动画平滑
   - 字段卡片进入分组容器时的视觉反馈（高亮）
   - 分组容器折叠/展开动画
   - 未分配区域的虚线提示
   - 移动端适配（Drawer 切换面板）

6. Schema 版本管理：
   - 每次 PUT 更新时 version+1
   - version_history 存入旧版本的快照
   - 前端展示版本列表和回滚按钮

请按列表顺序逐步完善，每完成一项便验证拖拽和渲染。

## AI 的回答

已实现：10 种字段渲染器全部完成（TextInput/TextArea/RadioGroup/CheckboxGroup/TagSelect/RichText/JsonEditor/FileUpload/LLMInteraction/ShowItem）。字段条件显示通过 x-reactions 实现。FormPreview 组件支持实时表单渲染。schemaTransformer（Designer→Formily JSON Schema）和 schemaParser（逆向导入）。dnd-kit 拖拽动画平滑。分组容器折叠/展开动画。未分配区域虚线边框提示。移动端 Drawer 面板切换。版本管理：PUT 自动 version+1，历史快照存储，版本列表支持回滚。
