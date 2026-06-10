# 任务大厅

任务大厅是标注员进入标注工作的入口，展示所有可供认领的已发布任务。

## 两个标签页

- **任务大厅** — 所有 `status=published` 且不属于当前用户的任务
- **我的任务** — 当前用户已认领或被指派的任务

## 过滤逻辑

- 任务大厅：`pubRes.data.items.filter(t => t.assignee_id !== user.id)`
- 已认领 quota_grab 任务通过 `listTasksApi({ assignee_id })` 查询
- 已认领 quota_grab 任务显示黄色`(已认领数)`标签

## 任务卡片

![Labeling Square](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/labeling-square.png)


桌面端展示：任务名称 / 标签 / 策略 / 进度条 / 截止时间
移动端仅显示任务名称和操作按钮，其他信息通过详情 Modal 查看。

