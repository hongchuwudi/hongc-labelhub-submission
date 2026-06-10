# 评分维度

评分维度定义了 AI 从哪些角度评估标注质量，是预审配置的核心。

## 维度结构

每个维度为一个 JSON 对象：
```json
{
  "name": "准确性",
  "description": "标注是否与原始数据一致，无事实错误",
  "weight": 1.0
}
```

## 常用维度

![Ai Dimensions](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/ai-dimensions.png)


| 维度 | 检查要点 |
|------|------|
| 相关性 | 标注是否准确回应用户需求，是否答非所问 |
| 准确性 | 标注内容是否正确，无事实错误、数据错误 |
| 格式合规 | 标注格式是否符合规范要求，必填是否完整 |
| 安全性 | 标注是否涉及违规信息、隐私泄露等安全问题 |
| 完整性 | 标注是否覆盖全部要求，有无遗漏字段 |

## LLM 输出格式

![Ai Score Result](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/ai-score-result.png)


使用 Function Calling 确保输出结构化 JSON：

```json
{
  "verdict": "pass",
  "overall_score": 0.85,
  "dimensions": [
    {"name": "准确性", "score": 0.9, "reason": "标注与原始数据一致"},
    {"name": "完整性", "score": 0.8, "reason": "缺少关键词字段"}
  ],
  "summary": "整体质量较好，建议补充关键词"
}
```

- `verdict`: pass（通过）/ reject（打回）/ human_review（人工复核）
- `overall_score`: 0-1 归一化得分


