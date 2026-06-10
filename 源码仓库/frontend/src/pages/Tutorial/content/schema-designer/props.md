# 属性配置

属性面板在 Schema Designer 右侧，选中字段/容器后显示对应配置。

## 字段属性

![Schema Props](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/schema-props.png)


| 属性 | 说明 |
|------|------|
| 字段 Key | 表单提交时的字段标识（必填） |
| 标题 | 显示在表单上的名称 |
| 必填 | 标注时是否强制填写 |
| 占位符 | 输入框内默认提示文字 |
| 列宽 (colSpan) | 24 列网格中的列宽 |
| 文本对齐 (textAlign) | left / center / right |
| 选项列表 | 单选/多选/下拉枚举值 |
| 最大长度 | 文本字数上限（带计数显示） |
| 行数 | 多行文本可见行数 |
| 多选 | 下拉是否开启多选标签模式 |

## 校验规则

支持添加多条规则，每条含类型、值和错误提示：
- `required` — 必填
- `minLength` / `maxLength` — 长度限制
- `pattern` — 正则匹配
- `min` / `max` — 数值范围

## 字段联动

![Schema Linkage](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/schema-linkage.png)


字段 A 上定义联动规则，监视目标字段 B 的值变化：
- `targetField` — 被监视的字段
- `condition` — equals / notEquals / in
- `action` — visible（满足时显示）/ hidden（满足时隐藏）
- `value` — 触发值


