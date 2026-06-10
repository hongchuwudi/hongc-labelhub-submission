# 字段联动

字段联动允许一个字段的显示状态根据另一个字段的值动态变化，减少无关字段干扰，提升标注效率。

## 联动配置

![Schema Linkage](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/schema-linkage.png)


在属性面板的「字段联动」区域添加规则，每条规则包含：

| 参数 | 说明 | 可选值 |
|------|------|------|
| targetField | 监视哪个字段的值变化 | 其他字段的 key |
| condition | 匹配条件 | equals / notEquals / in |
| value | 触发值（条件匹配的目标值） | 任意值 |
| action | 满足条件后的动作 | visible（显示）/ hidden（隐藏） |

## 示例

场景：只有当分类选择"电子产品"时才显示"品牌"字段。

字段「品牌」上配置联动规则：
- targetField: category
- condition: equals
- value: 电子产品
- action: visible

## 执行逻辑

1. 表单渲染时收集所有字段的 linkage 规则
2. 字段值变更时重新评估所有联动规则
3. 被隐藏的字段不参与提交校验
4. 支持多字段级联（A 影响 B，B 影响 C）

## 实现细节

- SchemaForm 和 TabbedForm 使用相同的联动引擎
- 联动规则 key 为拥有 linkage 的字段自身，checkField 为被监视字段
- `in` 条件支持数组值匹配，适用于多选框字段
- 预览模式的联动规则实时生效

> 配置联动时注意避免循环依赖（A 监视 B，B 监视 A），否则可能导致不可预期的行为。


