# 异步导出

大数据量导出采用异步处理，避免浏览器等待超时。

## 完整流程

1. 前端点击"开始导出" → POST `/tasks/{id}/exports`
2. 后端创建 ExportJob（status=pending）
3. 发布 MQ 消息到 `labelhub.export`
4. Export Worker 消费消息 → `process_job()`
5. 查询数据 → 生成文件 → 上传 OSS
6. ExportJob 更新：status=done + file_name + item_count
7. 前端每 2 秒轮询状态，完成后提示
8. 用户点击下载 → 后端生成 OSS 签名 URL（HTTPS，10 分钟有效）
9. 浏览器直接下载 OSS 文件

## 容错

- MQ 不可用时，降级为同步处理（API 请求线程完成）
- 导出失败时 `status=failed`，前端显示错误信息
- 组件卸载时自动清理定时器，防止内存泄漏

## 历史记录

![Export History](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/export-history.png)


- 单任务导出页显示该任务所有历史导出
- 全局导出中心汇总所有任务导出记录
- 支持按状态筛选，"已完成"的显示下载按钮

