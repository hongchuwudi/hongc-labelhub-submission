"""为测试 Schema 所有组件创建数据集 + Schema + 任务"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.database import SessionLocal
from app.models.auth.user import User
from app.models.datasets.dataset import Dataset
from app.models.datasets.item import DatasetItem
from app.models.schemas.schema import LabelSchema
from app.models.tasks.task import LabelTask
from app.models.tasks.item import TaskItem

TEST_ITEMS = [
    {
        "title": "iPhone 15 Pro Max 评测",
        "desc": "A17 Pro芯片，钛金属机身，USB-C接口，4800万像素主摄",
        "category": "electronics",
        "price": 9999,
        "tags": ["手机", "旗舰", "5G"],
        "features": {"screen": "6.7寸", "battery": "4422mAh", "weight": "221g"},
        "url": "https://example.com/iphone15.jpg",
    },
    {
        "title": "华为 MateBook X Pro 2024",
        "desc": "3.1K OLED原色全面屏，超级终端，980g超轻机身",
        "category": "electronics",
        "price": 8999,
        "tags": ["笔记本", "轻薄", "OLED"],
        "features": {"screen": "14.2寸", "ram": "32GB", "ssd": "1TB"},
        "url": "https://example.com/matebook.jpg",
    },
    {
        "title": "三只松鼠每日坚果 750g",
        "desc": "6种坚果科学配比，独立小包装，新鲜锁鲜，健康零食首选",
        "category": "food",
        "price": 89,
        "tags": ["零食", "坚果", "健康"],
        "features": {"weight": "750g", "pieces": 30, "shelf_life": "180天"},
        "url": "",
    },
    {
        "title": "Nike Air Jordan 1 Chicago",
        "desc": "复刻经典芝加哥配色，头层牛皮鞋面，Air Sole气垫缓震",
        "category": "fashion",
        "price": 1299,
        "tags": ["球鞋", "经典", "限量"],
        "features": {"size": "42", "color": "红/白/黑", "material": "头层牛皮"},
        "url": "https://example.com/aj1.jpg",
    },
    {
        "title": "Sony WH-1000XM5 降噪耳机",
        "desc": "行业标杆级主动降噪，30小时超长续航，佩戴舒适不夹头",
        "category": "electronics",
        "price": 2499,
        "tags": ["耳机", "降噪", "无线"],
        "features": {"type": "头戴式", "battery": "30h", "bluetooth": "5.2"},
        "url": "https://example.com/sony.jpg",
    },
    {
        "title": "东野圭吾《解忧杂货店》",
        "desc": "日本推理小说大师温情力作，跨越时空的书信往来，感动千万读者",
        "category": "book",
        "price": 39,
        "tags": ["小说", "推理", "治愈"],
        "features": {"author": "东野圭吾", "pages": 291, "publisher": "南海出版公司"},
        "url": "",
    },
    {
        "title": "戴森 V15 Detect 无绳吸尘器",
        "desc": "激光探测微尘，LCD屏实时显示吸入颗粒，60分钟续航",
        "category": "home",
        "price": 4990,
        "tags": ["家电", "清洁", "高端"],
        "features": {"power": "240AW", "battery": "60min", "weight": "2.3kg"},
        "url": "https://example.com/dyson.jpg",
    },
    {
        "title": "茅台 飞天53度 500ml",
        "desc": "贵州茅台酱香型白酒，国酒经典，送礼宴请首选",
        "category": "food",
        "price": 1499,
        "tags": ["白酒", "茅台", "送礼"],
        "features": {"alcohol": "53%", "volume": "500ml", "origin": "贵州茅台镇"},
        "url": "",
    },
    {
        "title": "乐高 兰博基尼 Sián FKP 37",
        "desc": "3696颗粒，1:8比例还原，V12引擎+8速变速箱，收藏级机械组",
        "category": "toy",
        "price": 2999,
        "tags": ["乐高", "机械组", "收藏"],
        "features": {"pieces": 3696, "age": "18+", "scale": "1:8"},
        "url": "https://example.com/lego.jpg",
    },
    {
        "title": "UNIQLO 轻薄羽绒服",
        "desc": "90%白鹅绒填充，蓬松度700+，轻薄保暖可收纳",
        "category": "fashion",
        "price": 499,
        "tags": ["羽绒服", "冬季", "轻便"],
        "features": {"fill": "90%白鹅绒", "weight": "200g", "colors": ["黑", "白", "蓝"]},
        "url": "https://example.com/uniqlo.jpg",
    },
]


def seed():
    db = SessionLocal()
    try:
        owner = db.query(User).filter(User.role == "owner").first()
        if not owner:
            print("未找到 Owner，请先运行 app.seed")
            return
        print(f"Owner: id={owner.id}")

        # ── 数据集 ──
        ds = Dataset(
            name="全组件测试数据集", format="json",
            description="包含多种字段类型的测试数据：文本、图片URL、JSON嵌套、标签数组等",
            owner_id=owner.id,
        )
        db.add(ds)
        db.flush()
        for i, item in enumerate(TEST_ITEMS):
            db.add(DatasetItem(dataset_id=ds.id, index=i, data=item))
        db.flush()
        print(f"数据集 id={ds.id}, {len(TEST_ITEMS)} 条")

        # ── Schema: 覆盖所有物料类型 ──
        schema = LabelSchema(
            name="全组件测试模板",
            version=1,
            owner_id=owner.id,
            schema={
                "title": "全组件测试表单",
                "description": "覆盖所有物料类型的测试 Schema",
                "fields": [
                    {"id": "f_title", "type": "showitem", "key": "title", "title": "商品名称（展示项）", "colSpan": 24},
                    {"id": "f_desc", "type": "showitem", "key": "desc", "title": "商品描述（展示项）", "colSpan": 24},
                    {"id": "f_name", "type": "text", "key": "product_name", "title": "商品名称（编辑）", "required": True, "placeholder": "输入商品名称", "colSpan": 12},
                    {"id": "f_cat", "type": "select", "key": "category", "title": "商品类目", "required": True, "options": [
                        {"label": "电子产品", "value": "electronics"},
                        {"label": "食品饮料", "value": "food"},
                        {"label": "服饰鞋包", "value": "fashion"},
                        {"label": "图书", "value": "book"},
                        {"label": "家居日用", "value": "home"},
                        {"label": "玩具", "value": "toy"},
                    ], "colSpan": 12},
                    {"id": "f_price", "type": "text", "key": "price_verify", "title": "价格确认", "required": True, "placeholder": "核实价格", "colSpan": 12},
                    {"id": "f_url", "type": "upload", "key": "image_url", "title": "商品图片", "accept": "image/*", "maxCount": 3, "colSpan": 12},
                    {"id": "f_quality", "type": "radio", "key": "quality", "title": "质量评级", "required": True, "options": [
                        {"label": "优质", "value": "good"}, {"label": "良好", "value": "ok"}, {"label": "差", "value": "bad"},
                    ], "colSpan": 8},
                    {"id": "f_channel", "type": "checkbox", "key": "channels", "title": "适用渠道", "options": [
                        {"label": "电商", "value": "online"}, {"label": "线下", "value": "offline"}, {"label": "直播", "value": "live"},
                    ], "colSpan": 8},
                    {"id": "f_tags", "type": "select", "key": "tags_select", "title": "标签选择", "multiple": True, "options": [
                        {"label": "热门", "value": "hot"}, {"label": "新品", "value": "new"}, {"label": "促销", "value": "sale"},
                    ], "colSpan": 8},
                    {"id": "f_comment", "type": "textarea", "key": "comment", "title": "评价", "rows": 3, "placeholder": "详细评价商品", "colSpan": 24},
                    {"id": "f_richtext", "type": "richtext", "key": "richtext_note", "title": "富文本备注", "colSpan": 24},
                    {"id": "f_json", "type": "json", "key": "json_data", "title": "扩展信息（JSON）", "colSpan": 24},
                    {"id": "f_llm", "type": "llm", "key": "llm_helper", "title": "LLM 辅助建议", "colSpan": 24},
                ],
                "groups": [
                    {"id": "g_basic", "title": "基础信息", "fieldIds": ["f_name", "f_cat", "f_price"]},
                    {"id": "g_adv", "title": "高级录入", "fieldIds": ["f_richtext", "f_json", "f_llm"]},
                ],
                "tabs": [
                    {"id": "t_main", "title": "基础标注", "fieldIds": ["f_title", "f_desc", "f_quality", "f_channel", "f_tags_select", "f_comment", "f_url"], "groupIds": ["g_basic"]},
                    {"id": "t_adv", "title": "高级功能", "fieldIds": [], "groupIds": ["g_adv"]},
                ],
            },
        )
        db.add(schema)
        db.flush()
        print(f"Schema id={schema.id}")

        # ── 任务 ──
        task = LabelTask(
            title="全组件测试任务",
            description="<p>测试所有 Schema 物料组件：展示项、文本输入、下拉、单选、多选、上传、富文本、JSON编辑器、LLM触发</p><p>包含两个 Tab：基础标注 + 高级功能</p>",
            tags="测试,全组件,Schema",
            dataset_id=ds.id,
            schema_id=schema.id,
            owner_id=owner.id,
            assignee_type="labeler",
            distribution_strategy="quota_grab",
            grab_limit=5,
            quota=len(TEST_ITEMS),
            total_items=len(TEST_ITEMS),
            reward_per_item=0.5,
            status="published",
        )
        db.add(task)
        db.flush()
        items = db.query(DatasetItem).filter(DatasetItem.dataset_id == ds.id).order_by(DatasetItem.index).all()
        for it in items:
            db.add(TaskItem(task_id=task.id, dataset_item_id=it.id))
        print(f"任务 id={task.id} [已发布] {len(items)} 条")

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
