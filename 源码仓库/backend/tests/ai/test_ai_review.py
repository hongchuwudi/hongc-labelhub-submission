"""AI 审核 Agent 测试——Prompt 构建 + 数据结构 + MQ 入队"""
import json
import pytest


class TestPromptBuilding:
    """验证 Prompt 模板变量注入正确性"""

    def test_prompt_var_substitution(self):
        """Python format 模板语法验证"""
        system_prompt = "维度:\n{dimensions}\n\n任务: {task}\n数据: {item}\n标注: {result}"
        vars = {
            "dimensions": "- acc: 准确性 (权重 0.5)",
            "task": "标题: 测试任务\n描述: 测试描述",
            "item": '{"title": "商品A"}',
            "result": '{"category": "电子产品"}',
        }
        result = system_prompt.format(**vars)
        assert "准确性" in result
        assert "测试任务" in result
        assert "商品A" in result
        assert "电子产品" in result

    def test_dimensions_table_generation(self):
        """从 scoring_dimensions 生成维度表格"""
        dims = [
            {"name": "accuracy", "label": "准确性", "weight": 0.5},
            {"name": "format", "label": "格式合规", "weight": 0.3},
            {"name": "safety", "label": "安全性", "weight": 0.2},
        ]
        table = "\n".join(
            f"- {d['name']}: {d['label']} (权重 {d['weight']})"
            for d in dims
        )
        assert "准确性" in table
        assert "格式合规" in table
        assert "安全性" in table
        assert "0.5" in table


class TestPydanticModels:
    """验证 Pydantic 输出模型的校验能力"""

    def test_valid_result(self):
        from app.schemas.ai import ReviewResult, DimensionScore

        r = ReviewResult(
            dimensions=[
                DimensionScore(name="accuracy", score=0.9, reason="准确"),
            ],
            verdict="pass",
            summary="合格",
        )
        assert r.verdict == "pass"
        assert r.dimensions[0].score == 0.9

    def test_invalid_score(self):
        """score 超出 [0,1] 范围应报错"""
        from app.schemas.ai import DimensionScore
        import pydantic

        with pytest.raises(pydantic.ValidationError):
            DimensionScore(name="acc", score=1.5, reason="超出范围")

    def test_invalid_verdict(self):
        """verdict 不在枚举中应报错"""
        from app.schemas.ai import ReviewResult
        import pydantic

        with pytest.raises(pydantic.ValidationError):
            ReviewResult(
                dimensions=[],
                verdict="invalid_value",
                summary="",
            )

    def test_serialization(self):
        """验证 model_dump 输出格式与 ai_scores 存储兼容"""
        from app.schemas.ai import ReviewResult, DimensionScore

        r = ReviewResult(
            dimensions=[
                DimensionScore(name="acc", score=0.85, reason="基本正确"),
                DimensionScore(name="fmt", score=0.6, reason="格式有误"),
            ],
            verdict="human_review",
            summary="整体尚可，格式需改进",
        )
        data = {
            "dimensions": [d.model_dump() for d in r.dimensions],
            "verdict": r.verdict,
            "summary": r.summary,
        }
        assert len(data["dimensions"]) == 2
        assert data["verdict"] == "human_review"


class TestMQPublish:
    """验证 create_result 触发 MQ 入队"""

    def test_publish_when_ai_config_set(self, db, claimed_task, seed_labeler, monkeypatch):
        """任务配置了 ai_config_id 时，提交应触发 MQ publish"""
        from app.models.ai.agent import AiAgent

        config = AiAgent(
            name="test",
            email="test-ai@labelhub.system",
            password_hash="hash",
            system_prompt="test: {task}",
            scoring_dimensions=[{"name": "acc", "label": "准确性", "weight": 1.0}],
            llm_model="gpt-4o",
            created_by=seed_labeler.id,
        )
        db.add(config)
        db.commit()

        claimed_task.ai_agent_id = config.id
        db.commit()

        # Mock MQ publish
        published = []
        monkeypatch.setattr(
            "app.infra.mq_client.publish",
            lambda queue, body: published.append((queue, body)),
        )

        from app.services.tasks.service import TaskService
        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)
        result = svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "电子产品"},
        )

        assert len(published) == 1
        assert published[0][0] == "labelhub.ai.review"
        assert published[0][1]["task_id"] == claimed_task.id
        assert published[0][1]["result_id"] == result.id

    def test_no_publish_when_no_config(self, db, claimed_task, seed_labeler, monkeypatch):
        """未配置 ai_config_id 时，不触发 MQ"""
        published = []
        monkeypatch.setattr(
            "app.infra.mq_client.publish",
            lambda queue, body: published.append((queue, body)),
        )

        from app.services.tasks.service import TaskService
        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)
        result = svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "电子产品"},
        )

        assert len(published) == 0
