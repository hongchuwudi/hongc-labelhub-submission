"""
种子脚本——插入测试数据：用户 / 数据集 / Schema / 任务
从 backend/ 目录运行:  python -m app.seed
"""
import sys
from pathlib import Path

# 确保 backend/ 在 sys.path 中
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.database import SessionLocal, Base, engine
from app.models.auth.user import User
from app.models.datasets.dataset import Dataset
from app.models.datasets.item import DatasetItem
from app.models.schemas.schema import LabelSchema
from app.models.tasks.task import LabelTask
from app.services.auth.service import hash_password


def seed():
    # 建表（幂等，不存在才建）
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── 1. 用户 ──
        print("创建用户...")
        users = {}
        for role, name, email in [
            ("owner", "张管理", "admin@test.com"),
            ("labeler", "李标注", "labeler@test.com"),
            ("reviewer", "王审核", "reviewer@test.com"),
        ]:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(name=name, email=email, password_hash=hash_password("123456"), role=role)
                db.add(u)
                db.flush()
            users[role] = u
            print(f"  {role}: id={u.id}  {name} ({email})  密码: 123456")

        owner = users["owner"]
        labeler = users["labeler"]

        # ── 2. 数据集 + 条目 ──
        print("\n创建数据集...")
        ds = Dataset(name="商品评测数据集", format="json", description="电商商品标题与描述数据，用于分类和关键词提取", owner_id=owner.id)
        db.add(ds)
        db.flush()
        print(f"  数据集 id={ds.id}")

        items_data = [
            {"title": "Apple iPhone 15 Pro Max 256GB 原色钛金属", "desc": "全新未拆封国行正品，支持官方验货，全国联保"},
            {"title": "Sony WH-1000XM5 头戴式无线降噪耳机", "desc": "行业标杆级降噪，30小时续航，佩戴舒适"},
            {"title": "三只松鼠坚果礼盒 每日坚果 750g", "desc": "6种坚果科学配比，独立小包装，新鲜锁鲜"},
            {"title": "Nike Air Jordan 1 Retro High OG 芝加哥配色", "desc": "复刻经典，头层牛皮，Air Sole气垫缓震"},
            {"title": "华为 MateBook X Pro 2024款 微绒典藏版", "desc": "3.1K OLED原色全面屏，超级终端，轻薄便携"},
        ]
        for i, d in enumerate(items_data):
            db.add(DatasetItem(dataset_id=ds.id, index=i, data=d))
        db.flush()
        print(f"  已导入 {len(items_data)} 条数据")

        # ── 3. Schema ──
        print("\n创建 Schema...")
        schema1 = LabelSchema(
            name="商品分类模板",
            version=1,
            schema={
                "type": "object",
                "required": ["category", "keywords"],
                "properties": {
                    "category": {
                        "type": "string",
                        "title": "商品类目",
                        "description": "选择商品所属类目",
                        "enum": ["电子产品", "服装鞋帽", "食品饮料", "图书音像", "家居日用"],
                    },
                    "keywords": {
                        "type": "array",
                        "title": "卖点关键词",
                        "description": "提取商品核心卖点，多个用逗号分隔",
                        "items": {"type": "string"},
                    },
                    "quality": {
                        "type": "string",
                        "title": "商品质量",
                        "description": "综合判断商品描述质量",
                        "enum": ["优质", "良好", "一般", "较差"],
                    },
                    "notes": {
                        "type": "string",
                        "title": "备注",
                        "description": "补充说明",
                    },
                },
            },
            owner_id=owner.id,
        )
        db.add(schema1)
        db.flush()
        print(f"  商品分类模板 id={schema1.id}")

        schema2 = LabelSchema(
            name="情感分析模板",
            version=1,
            schema={
                "type": "object",
                "required": ["sentiment"],
                "properties": {
                    "sentiment": {
                        "type": "string",
                        "title": "情感倾向",
                        "enum": ["正面", "负面", "中性"],
                    },
                    "intensity": {
                        "type": "string",
                        "title": "情感强度",
                        "enum": ["强烈", "中等", "微弱"],
                    },
                },
            },
            owner_id=owner.id,
        )
        db.add(schema2)
        db.flush()
        print(f"  情感分析模板 id={schema2.id}")

        # ── 3.3 SchemaDesign 格式模板（含 Tab + 容器 + 字段）──
        schema3 = LabelSchema(
            name="SchemaDesign 测试模板",
            version=1,
            schema={
                "title": "商品标注表单",
                "description": "测试 Tab/容器/字段 三层模型",
                "fields": [
                    {"id": "f1", "type": "text", "key": "product_name", "title": "商品名称", "required": True, "placeholder": "输入商品名称", "colSpan": 12},
                    {"id": "f2", "type": "textarea", "key": "description", "title": "商品描述", "required": False, "rows": 3, "colSpan": 24},
                    {"id": "f3", "type": "select", "key": "category", "title": "商品类目", "required": True, "options": [{"label": "电子", "value": "elec"}, {"label": "服装", "value": "cloth"}, {"label": "食品", "value": "food"}], "colSpan": 12},
                    {"id": "f4", "type": "radio", "key": "quality", "title": "质量评级", "required": True, "options": [{"label": "优质", "value": "good"}, {"label": "一般", "value": "avg"}, {"label": "较差", "value": "poor"}], "colSpan": 12},
                    {"id": "f5", "type": "text", "key": "brand", "title": "品牌", "required": False, "placeholder": "输入品牌名", "colSpan": 12},
                    {"id": "f6", "type": "richtext", "key": "remark", "title": "备注（富文本）", "required": False, "colSpan": 24},
                    {"id": "f7", "type": "json", "key": "extra_info", "title": "扩展信息（JSON）", "required": False, "colSpan": 24},
                    {"id": "f8", "type": "showitem", "key": "ref_price", "title": "参考价格", "required": False, "colSpan": 12},
                ],
                "groups": [
                    {"id": "g1", "title": "基本信息", "fieldIds": ["f1", "f5"]},
                    {"id": "g2", "title": "高级信息", "fieldIds": ["f6", "f7"]},
                ],
                "tabs": [
                    {"id": "t1", "title": "基础标注", "fieldIds": ["f2", "f3", "f4", "f8"], "groupIds": ["g1"]},
                    {"id": "t2", "title": "详情补充", "fieldIds": [], "groupIds": ["g2"]},
                ],
            },
            owner_id=owner.id,
        )
        db.add(schema3)
        db.flush()
        print(f"  SchemaDesign 测试模板 id={schema3.id}")

        # ── 4. 任务 ──
        print("\n创建任务...")
        task1 = LabelTask(
            title="商品分类标注任务",
            description="<p>请根据商品标题和描述，完成以下标注：</p><ul><li>选择正确的商品类目</li><li>提取 2-5 个卖点关键词</li><li>判断商品描述质量等级</li></ul>",
            tags="电商,分类,关键词",
            dataset_id=ds.id,
            schema_id=schema1.id,
            owner_id=owner.id,
            assignee_type="labeler",
            distribution_strategy="first_come",
            quota=5,
            status="published",
            total_items=5,
            reward_per_item=0.5,
            reward_cap=500.0,
        )
        db.add(task1)
        db.flush()
        print(f"  商品分类标注任务 id={task1.id}  [已发布]")

        # 给 task1 生成 task_items
        from app.models.tasks.item import TaskItem
        items = db.query(DatasetItem).filter(DatasetItem.dataset_id == ds.id).order_by(DatasetItem.index.asc()).limit(5).all()
        for it in items:
            db.add(TaskItem(task_id=task1.id, dataset_item_id=it.id))
        print(f"  已生成 {len(items)} 条 TaskItem")

        task2 = LabelTask(
            title="情感分析标注任务",
            description="<p>判断下列文本的情感倾向和强度</p>",
            tags="NLP,情感分析",
            dataset_id=ds.id,
            schema_id=schema2.id,
            owner_id=owner.id,
            assignee_type="labeler",
            distribution_strategy="first_come",
            quota=3,
            status="draft",
            total_items=3,
            reward_per_item=0.3,
        )
        db.add(task2)
        db.flush()
        print(f"  情感分析标注任务 id={task2.id}  [草稿]")
        for it in items[:3]:
            db.add(TaskItem(task_id=task2.id, dataset_item_id=it.id))
        print(f"  已生成 3 条 TaskItem")

        task3 = LabelTask(
            title="SchemaDesign 测试任务",
            description="<p>测试 Tab/容器/字段三层模型的标注表单</p>",
            tags="测试,SchemaDesign",
            dataset_id=ds.id,
            schema_id=schema3.id,
            owner_id=owner.id,
            assignee_type="labeler",
            distribution_strategy="first_come",
            quota=3,
            status="published",
            total_items=3,
            reward_per_item=0.3,
        )
        db.add(task3)
        db.flush()
        print(f"  SchemaDesign 测试任务 id={task3.id}  [已发布]")
        for it in items[:3]:
            db.add(TaskItem(task_id=task3.id, dataset_item_id=it.id))
        print(f"  已生成 3 条 TaskItem")

        db.commit()
        print("\n[OK] 测试数据插入完成！")
        print(f"""
登录信息:
  Owner:   admin@test.com / 123456
  Labeler: labeler@test.com / 123456
  Reviewer: reviewer@test.com / 123456

任务:
  #{task1.id} 商品分类标注任务 [已发布] — 5 条待标注
  #{task2.id} 情感分析标注任务 [草稿]  — 需先发布才能认领
  #{task3.id} SchemaDesign 测试任务 [已发布] — 3 条待标注 (含 Tab/容器/字段)
""")

    except Exception as e:
        db.rollback()
        print(f"\n[FAIL] 失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
