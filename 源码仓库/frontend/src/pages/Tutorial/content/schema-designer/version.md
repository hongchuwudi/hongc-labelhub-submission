# 版本管理

Schema Designer 内置版本号自动递增和历史追溯功能。

## 版本号

![Schema Version](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/schema-version.png)


- 每次点击「保存」时版本号自动 +1
- 版本号显示在工具栏名称旁（如 `v3`）
- 首次保存时版本号为 1
- `LabelSchema.version` 列记录当前版本号

## 版本历史

`LabelSchema.version_history` 列（JSON 数组）存储完整变更记录：

```json
[
  {
    "version": 1,
    "schema": {...},
    "updated_at": "2026-06-09T10:00:00"
  },
  {
    "version": 2,
    "schema": {...},
    "updated_at": "2026-06-09T11:00:00"
  }
]
```

每次保存时将旧版本配置追加到历史数组，旧版本数据可追溯。

## 任务 Schema 快照

### 为什么需要快照

如果已发布任务直接跟随 Schema 实时变化会导致问题：
- 标注员看到的表单字段突然变化（新增/删除/改名）
- 已提交的历史数据无法对应新 Schema 结构
- 新增必填字段导致旧数据校验失败

### 快照机制

任务创建时自动冻结当前 Schema：

```python
task.schema_snapshot = schema.schema   # 当前 Schema JSON
task.schema_version = schema.version   # 当前版本号
```

### 加载优先级

标注工作台渲染表单时的加载逻辑：
1. 优先使用 `task.schema_snapshot`（任务发布时的 Schema 副本）
2. 旧任务无快照时回退到实时查询 `getSchemaApi`

这保证了任务周期内表单结构不变，Schema 后续修改不影响已发布任务。


