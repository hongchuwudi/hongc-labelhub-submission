# 常见 Bug 修复思路

## 提示词 — 通用 Bug 排查流程

```
现在系统运行中遇到了 Bug，请按照以下流程排查：

1. 先准确复现 Bug：
   - 描述完整的操作步骤
   - 记录期望行为 vs 实际行为
   - 截图/记录报错信息

2. 后端 Bug 排查：
   - 检查 FastAPI 日志（uvicorn 输出）
   - 检查请求的 curl 命令（method + url + body）
   - 检查数据库中的数据状态是否正确
   - 用 pytest 写一个复现该 Bug 的测试用例
   - 定位到具体的文件/函数/行号
   - 修复后重新跑冒烟测试（pytest -v test_state_machine.py）

3. 前端 Bug 排查：
   - 打开浏览器 Console 检查报错
   - 打开 Network 面板检查 API 请求/响应
   - 运行 npx tsc -p tsconfig.app.json --noEmit 检查类型错误
   - 刷新浏览器确认是否偶发
   - 定位到具体的组件/文件
   - 修复后刷新浏览器验证

4. 状态机 Bug 排查：
   - 检查当前状态是否在合法状态列表中
   - 检查转为目标状态是否在 TRANSITION_TABLES 中注册
   - 检查是否有并发问题导致状态不一致
   - 查看 audit_logs 表追溯状态变更历史

5. 修复后必须：
   - 跑 npx tsc --noEmit（前端）
   - 跑 pytest -v（后端）
   - 启动 dev server 刷新浏览器确认
```

## 提示词 — 常见 Bug 举例

```
以下是开发中遇到的具体 Bug，请逐个修复：

Bug 1：拖拽字段进入分组容器后，字段消失了
- 原因：dnd-kit 的 onDragEnd 事件中，判断落点所属容器时用了错误的数据结构
- 修复：检查碰撞检测算法 → 重新计算 over 元素与容器的父子关系 → 正确处理 void 区域和容器区域的落点

Bug 2：SchemaDesigner 中 DUPLICATE_FIELD 后新字段不继承原字段的 group
- 原因：DUPLICATE_FIELD action 中没有同步更新 groups[].fieldIds
- 修复：在 reducer 中 DUPLICATE_FIELD 处理时，搜索所有 groups，将新字段 id 加入原字段所在 group 的 fieldIds

Bug 3：标注员提交后 AI Agent 不触发审核
- 原因：MQ 连接失败，publish 后静默 catch 了异常
- 修复：添加 MQ 连接状态检查 → 不可用时直接同步调用 Agent.run()（降级处理）

Bug 4：并发领单导致配额超发
- 原因：claim 接口没有加锁，两个请求同时读到剩余配额=1，都以为可以领取
- 修复：在 claim 逻辑中加上 Redis SETNX 锁，锁定 task_id + labeler_id 组合

Bug 5：富文本编辑器提交时内容为空
- 原因：react-quill 的 onChange 返回的 delta 对象而不是文本，提交时未正确序列化
- 修复：提交前用 quill.getText() 获取纯文本，用 quill.getHTML() 获取带格式内容

请逐个理解和修复。
```

## AI 的回答

```
已完成该文件中描述的 5 个 Bug 修复：

Bug 1 — 拖拽字段进入分组容器后消失：修复了 dnd-kit 碰撞检测算法，重新计算 over 元素与容器的父子关系。
Bug 2 — DUPLICATE_FIELD 丢失 group：修复 reducer，同步将新字段 id 加入 groups[].fieldIds。
Bug 3 — AI Agent 不触发：添加 MQ 连接检查，不可用时同步降级调用 Agent.run()。
Bug 4 — 领单配额超发：在 claim 逻辑中加上 Redis SETNX 锁，锁定 task_id + user_id 组合。
Bug 5 — 富文本编辑器提交空内容：改为用 quill.getHTML() 序列化带格式内容后提交。
```
