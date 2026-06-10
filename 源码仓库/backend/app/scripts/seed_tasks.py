"""为测试数据集创建 Schema 和发布任务"""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.database import SessionLocal, engine
from app.models.auth.user import User
from app.models.datasets.dataset import Dataset
from app.models.datasets.item import DatasetItem
from app.models.schemas.schema import LabelSchema
from app.models.tasks.task import LabelTask
from app.models.tasks.item import TaskItem


def seed():
    db = SessionLocal()
    try:
        owner = db.query(User).filter(User.role == "owner").first()
        if not owner:
            print("未找到 Owner 用户，请先运行 app.seed")
            return
        print(f"Owner: id={owner.id} {owner.name}")

        docs = Path(__file__).parent.parent.parent / "docs" / "datasets" / "datasets"

        # ── 数据集 1: 偏好对比 ──
        pc_path = docs / "preference_compare" / "json" / "preference_compare.json"
        pc_data = json.loads(pc_path.read_text(encoding="utf-8"))

        ds1 = Dataset(name="偏好对比评测集", format="json", description="模型回答偏好对比数据，含 A/B 回答及人工偏好标注", owner_id=owner.id)
        db.add(ds1)
        db.flush()
        for i, item in enumerate(pc_data):
            db.add(DatasetItem(dataset_id=ds1.id, index=i, data=item))
        db.flush()
        print(f"偏好对比: 数据集 id={ds1.id}, {len(pc_data)} 条")

        # ── 数据集 2: QA 质量评估 ──
        qa_path = docs / "qa_quality" / "json" / "qa_quality.json"
        qa_data = json.loads(qa_path.read_text(encoding="utf-8"))

        ds2 = Dataset(name="QA质量评估集", format="json", description="问答质量评估数据，含 prompt、模型回答及参考答案", owner_id=owner.id)
        db.add(ds2)
        db.flush()
        for i, item in enumerate(qa_data):
            db.add(DatasetItem(dataset_id=ds2.id, index=i, data=item))
        db.flush()
        print(f"QA质量: 数据集 id={ds2.id}, {len(qa_data)} 条")

        # ── Schema 1: 偏好对比 ──
        s1 = LabelSchema(
            name="偏好对比标注模板",
            version=1,
            owner_id=owner.id,
            schema={
                "title": "偏好对比标注",
                "description": "对比两个模型回答，判断优劣",
                "fields": [
                    {"id": "f1", "type": "showitem", "key": "prompt", "title": "用户提问", "colSpan": 24},
                    {"id": "f2", "type": "showitem", "key": "response_a", "title": "回答 A", "colSpan": 24},
                    {"id": "f3", "type": "showitem", "key": "response_b", "title": "回答 B", "colSpan": 24},
                    {"id": "f4", "type": "radio", "key": "preference", "title": "偏好选择", "required": True, "options": [
                        {"label": "A 更好", "value": "A"},
                        {"label": "B 更好", "value": "B"},
                        {"label": "持平", "value": "tie"},
                    ], "colSpan": 24},
                    {"id": "f5", "type": "select", "key": "margin", "title": "差距程度", "options": [
                        {"label": "明显优于", "value": "明显优于"},
                        {"label": "略微优于", "value": "略微优于"},
                        {"label": "无差异", "value": "无差异"},
                    ], "colSpan": 12},
                    {"id": "f6", "type": "checkbox", "key": "dimensions", "title": "评价维度", "options": [
                        {"label": "准确性", "value": "准确性"},
                        {"label": "完整性", "value": "完整性"},
                        {"label": "可读性", "value": "可读性"},
                        {"label": "逻辑性", "value": "逻辑性"},
                        {"label": "安全性", "value": "安全性"},
                    ], "colSpan": 24},
                    {"id": "f7", "type": "textarea", "key": "comment", "title": "评语", "placeholder": "简要说明选择理由", "rows": 3, "colSpan": 24},
                ],
                "groups": [],
                "tabs": [],
            },
        )
        db.add(s1)
        db.flush()
        print(f"偏好对比 Schema id={s1.id}")

        # ── Schema 2: QA 质量评估 ──
        s2 = LabelSchema(
            name="QA质量评估模板",
            version=1,
            owner_id=owner.id,
            schema={
                "title": "QA 质量评估",
                "description": "评估问答回复的质量",
                "fields": [
                    {"id": "f1", "type": "showitem", "key": "prompt", "title": "用户提问", "colSpan": 24},
                    {"id": "f2", "type": "showitem", "key": "model_answer", "title": "模型回答", "colSpan": 24},
                    {"id": "f3", "type": "radio", "key": "accuracy", "title": "准确性", "required": True, "options": [
                        {"label": "完全正确", "value": "correct"},
                        {"label": "部分正确", "value": "partial"},
                        {"label": "错误", "value": "wrong"},
                    ], "colSpan": 8},
                    {"id": "f4", "type": "radio", "key": "relevance", "title": "相关性", "required": True, "options": [
                        {"label": "高度相关", "value": "high"},
                        {"label": "部分相关", "value": "partial"},
                        {"label": "不相关", "value": "none"},
                    ], "colSpan": 8},
                    {"id": "f5", "type": "radio", "key": "completeness", "title": "完整性", "required": True, "options": [
                        {"label": "完整", "value": "full"},
                        {"label": "基本完整", "value": "mostly"},
                        {"label": "不完整", "value": "incomplete"},
                    ], "colSpan": 8},
                    {"id": "f6", "type": "radio", "key": "overall", "title": "综合评价", "required": True, "options": [
                        {"label": "优质", "value": "good"},
                        {"label": "合格", "value": "ok"},
                        {"label": "不合格", "value": "bad"},
                    ], "colSpan": 12},
                    {"id": "f7", "type": "textarea", "key": "comment", "title": "评语", "placeholder": "详细评价或改进建议", "rows": 3, "colSpan": 24},
                ],
                "groups": [],
                "tabs": [],
            },
        )
        db.add(s2)
        db.flush()
        print(f"QA质量 Schema id={s2.id}")

        # ── 任务 1: 偏好对比 ──
        t1 = LabelTask(
            title="偏好对比标注任务",
            description="<p>对比两个 AI 模型的回答，选择更优的一方并给出评语。</p><ul><li>阅读用户提问和两个模型回答</li><li>选择偏好（A/B/持平）</li><li>标注差距程度</li><li>勾选评价维度并撰写评语</li></ul>",
            tags="偏好对比,模型评估",
            dataset_id=ds1.id,
            schema_id=s1.id,
            owner_id=owner.id,
            assignee_type="labeler",
            distribution_strategy="quota_grab",
            quota=len(pc_data),
            total_items=len(pc_data),
            reward_per_item=0.5,
            status="published",
        )
        db.add(t1)
        db.flush()
        items1 = db.query(DatasetItem).filter(DatasetItem.dataset_id == ds1.id).order_by(DatasetItem.index).all()
        for it in items1:
            db.add(TaskItem(task_id=t1.id, dataset_item_id=it.id))
        print(f"偏好对比任务 id={t1.id} [已发布] {len(items1)} 条 TaskItem")

        # ── 任务 2: QA 质量评估 ──
        t2 = LabelTask(
            title="QA质量评估任务",
            description="<p>评估问答回复的质量，从准确性、相关性、完整性三个维度打分。</p><ul><li>阅读用户提问和模型回答</li><li>从准确性/相关性/完整性三个维度评分</li><li>给出综合评级和详细评语</li></ul>",
            tags="QA评估,质量审核",
            dataset_id=ds2.id,
            schema_id=s2.id,
            owner_id=owner.id,
            assignee_type="labeler",
            distribution_strategy="quota_grab",
            quota=len(qa_data),
            total_items=len(qa_data),
            reward_per_item=0.5,
            status="published",
        )
        db.add(t2)
        db.flush()
        items2 = db.query(DatasetItem).filter(DatasetItem.dataset_id == ds2.id).order_by(DatasetItem.index).all()
        for it in items2:
            db.add(TaskItem(task_id=t2.id, dataset_item_id=it.id))
        print(f"QA质量任务 id={t2.id} [已发布] {len(items2)} 条 TaskItem")

        db.commit()
        print("\n[OK] 完成！")

    except Exception as e:
        db.rollback()
        print(f"\n[FAIL] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
