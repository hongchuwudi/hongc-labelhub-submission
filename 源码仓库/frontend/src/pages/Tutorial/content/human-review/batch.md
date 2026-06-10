# 批量操作

提升审核效率的关键功能，支持一次性处理多条标注结果。

## 使用流程

![Review Batch](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/review-batch.png)


1. 在审核列表勾选多个标注条目（Checkbox）
2. 点击"批量通过"或"批量打回"
3. 打回时填写驳回理由
4. 确认执行

## 后端实现

`POST /tasks/{id}/results/batch-review` 接收：
```json
{
  "result_ids": [1, 2, 3],
  "target_status": "final_review",
  "comment": ""
}
```

逐条执行 `review_result()`：
- 单条失败不影响其他条
- 返回汇总结果：`{reviewed: 3, errors: []}`

## 注意事项

- 批量操作同样经过状态机校验
- 打回时必须填 comment
- 全部成功时前端提示"已处理 N 条"

