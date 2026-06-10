# 平台简介

LabelHub 是一套覆盖**数据标注全生命周期**的 Web 平台，支持从任务创建到数据导出的完整链路。

## 核心能力

![Homepage](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/homepage.png)


- **可视化 Schema 搭建** — 拖拽组件动态搭建标注表单
- **AI 自动预审** — 可配置评分维度的智能质检 Agent
- **多角色审核流转** — 复审 / 终审 / 入库，完整审计追溯
- **多格式数据导出** — JSON / JSONL / CSV / Excel

## 技术栈

![Tutorial Arch.Svg](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/tutorial-arch.svg)


| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Ant Design + Zustand + dnd-kit |
| 后端 | Python FastAPI + SQLAlchemy + Pydantic V2 |
| 数据库 | MySQL 8.0 |
| AI Agent | OpenAI 兼容 API + Function Calling |
| 中间件 | Redis + RabbitMQ |
| 存储 | 阿里云 OSS |

## 三端架构

```text
[Owner]    建任务 → 搭模板 → 发布 → 看结果 → 导出
[Labeler]  浏览广场 → 认领 → 作答 → 提交 → 看打回 → 修改
[Agent]    MQ 拉取 → LLM 评分 → 写回
[Reviewer] 审核列表 → 通过/打回 → 批量操作
```


