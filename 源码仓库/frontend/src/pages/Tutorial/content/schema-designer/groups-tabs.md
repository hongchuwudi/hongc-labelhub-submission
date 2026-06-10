# 分组容器与 Tab

Schema Designer 支持分组容器和 Tab 标签页两种布局组织方式。

## 分组容器 (GroupConfig)

![Schema Group](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/schema-group.png)


将多个相关字段放入一个带标题的边框容器中，视觉上形成分组。

### 创建与使用

1. 点击画布工具栏的 [分组] 按钮
2. 双击标题栏可编辑容器名称
3. 拖拽字段到容器内部自动归属
4. 点击容器标题栏选中容器，右侧显示容器属性

### 数据结构

```json
{
  "id": "g1",
  "title": "商品信息",
  "fieldIds": ["f1", "f2", "f3"]
}
```

## Tab 标签页 (TabConfig)

![Schema Tabs](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/schema-tabs.png)


将字段和容器分配到不同的标签页，实现分页展示。

### 创建与使用

1. 点击画布工具栏的 [Tab] 按钮
2. 双击 Tab 标题可编辑名称
3. 将字段或容器分配到指定 Tab（右侧属性面板选择所属 Tab）
4. 点击 Tab 切换查看不同页内容

### 数据结构

```json
{
  "id": "t1",
  "title": "基础信息",
  "fieldIds": ["f1", "f2"],
  "groupIds": ["g1"]
}
```

## 归属规则（三层分离）

```
Tab → 容器 → 字段
```

- 字段可归属 Tab 或容器，但互斥（放入容器时自动从 Tab 移除）
- 放入 Tab 时自动从所有容器中移除
- 容器内的字段继承容器的 Tab 归属（属性面板中显示"继承自容器"）

## 未分配区域

当存在 Tab 时，未归属于任何 Tab 的字段和容器会显示在 Tab 栏下方的虚线分隔区域中，提示用户将其分配到合适的 Tab。


