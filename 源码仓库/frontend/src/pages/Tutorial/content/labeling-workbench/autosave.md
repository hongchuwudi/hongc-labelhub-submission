# 草稿自动保存

标注过程中系统自动将填写进度保存到本地，防止意外关闭或网络波动导致数据丢失。

## 实现机制

1. 每次表单值变更触发 3 秒 debounce
2. 序列化当前表单值为 JSON
3. 存入 `localStorage`，key 含 taskId + itemId
4. 提交成功后清除对应草稿

## 恢复流程

![Labeling Autosave](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/labeling-autosave.png)


1. 打开标注页面时检测是否有对应条目的草稿数据
2. 有则弹出恢复提示
3. 选"恢复" → 回填上次填写的内容
4. 选"放弃" → 清除草稿，重新开始

> 草稿仅存储在本地浏览器 `localStorage` 中，清除浏览器数据会导致草稿丢失。

