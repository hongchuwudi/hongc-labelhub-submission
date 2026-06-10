# 创建任务

任务是标注工作的基本单元。Owner 选择数据集和 Schema，配置策略后发布。

## 创建步骤

![Task Publish](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/task-publish.png)


1. 进入任务管理页面，点击"新建任务"
2. 填写任务名称、标签（逗号分隔）、描述（富文本）
3. 选择关联的数据集（需预先导入数据）
4. 选择关联的 Schema（标注模板）
5. 选择分发策略（first_come / assigned / quota_grab）
6. 设置配额（需标注条数，不超过数据集总量）
7. 可选：配置奖励（元/条 + 月封顶）、截止时间
8. 可选：关联 AI Agent（启用 AI 预审）

## 数据来源

![Task Select Ds](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/task-select-ds.png)


配额 = N 表示按 `index` 升序取数据集前 N 条生成 TaskItem。总任务条目数 = 配额。

## Schema 快照

创建时自动将当前 Schema 冻结保存到 `schema_snapshot` 列。即使后续 Schema 多次修改，已发布任务不受影响。

## 发布

创建后状态为 `draft`。需点击"发布"使状态变为 `published`，标注员才能在任务大厅看到此任务。


