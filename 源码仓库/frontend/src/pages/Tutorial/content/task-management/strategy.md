# 分发策略

分发策略决定标注任务如何分配给标注员。LabelHub 支持三种策略。

## 先到先得 (first_come)

![Task Strategy](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/task-strategy.png)


谁先认领，整个任务归谁。

- 适用：单一标注员的小型任务
- 防并发：Redis SETNX 分布式锁（TTL 30s），同一时刻仅一人成功
- 其他人再请求收到"任务已被认领"错误
- 认领后 `assignee_id` 设置为该标注员

## 指派 (assigned)

Owner 创建任务时直接指定标注员。

- 适用：明确知道谁来做
- 被指派人无需认领，"我的任务"中直接可见
- `claim()` 返回"指派任务无需认领"
- 可编辑任务更换指派人

## 配额抢单 (quota_grab)

![Task Quota Grab](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/task-quota-grab.png)


任务按条目分配，多标注员并行抢不同条目。

- 适用：大规模多人协作
- 抢单接口：`POST /tasks/{id}/claim?count=N`
- `grab_limit` 控制单人累计上限（不设则不限制）
- 防并发：`SELECT FOR UPDATE SKIP LOCKED`，不同条目可并行

## 三种策略对比

| 策略 | 粒度 | 独占 | 并发控制 | 适用场景 |
|------|:---:|:---:|------|------|
| first_come | 整任务 | 是 | Redis SETNX | 单人小型任务 |
| assigned | 整任务 | 是 | 无需 | Owner 精确指派 |
| quota_grab | 按条目 | 否 | SKIP LOCKED | 多人协作大任务 |


