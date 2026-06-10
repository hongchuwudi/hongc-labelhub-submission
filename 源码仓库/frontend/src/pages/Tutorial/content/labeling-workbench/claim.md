# 认领任务

标注员在任务大厅看到感兴趣的任务后，需先认领才能进入标注。

## 三种认领方式

### 先到先得
点击"认领"即完成。并发场景下 Redis SETNX 锁保证仅一人成功。其他人立即收到"已被认领"提示。

### 指派
无需认领操作。被 Owner 指派后直接在"我的任务"中出现。主动调用认领会返回"指派任务无需认领"。

### 配额抢单
点击"认领"弹出数量选择器：
- 默认每次领取 10 条，受 grab_limit 约束
- 超过 grab_limit 会提示"你已认领 X 条，已达上限"
- `FOR UPDATE SKIP LOCKED` 跳过已被其他事务锁定的行

## 认领后

认领成功 → 出现在"我的任务" → 点击"进入标注"打开工作台


![labeling-claim.png](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/labeling-claim.png)
