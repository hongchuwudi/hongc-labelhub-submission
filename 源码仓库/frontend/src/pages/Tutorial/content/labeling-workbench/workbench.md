# 标注界面

标注工作台是 Labeler 的核心操作区域，采用三栏布局。

## 三栏布局

![Labeling Workbench](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/labeling-workbench.png)


- **左侧条目队列**：按 `index` 排序的任务条目列表，显示 pending / labeled / skipped 状态
- **中间表单区**：基于 Schema 快照渲染的标注表单，字段联动和校验规则实时生效
- **右侧统计面板**：已提交 / 审核中 / 打回 / 已完成数量统计

## 表单特性

![Labeling Linkage](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/labeling-linkage.png)


- 动态渲染：表单控件由 Schema 定义的 FieldConfig 数组驱动
- 支持全部物料类型：文本、单选、多选、富文本、JSON、上传、LLM 触发、ShowItem
- 字段联动：可见性联动规则实时生效（如选择 A 显示 B，输入 C 隐藏 D）
- 校验提交：提交前逐字段校验（必填 + 长度 + 正则等），不通过会提示具体错误项

## 操作

- 上一题 / 下一题导航
- 跳过条目（标记 skipped，可回头重做）
- 提交前校验 + 确认弹窗
- 草稿自动保存（3s debounce → localStorage）


