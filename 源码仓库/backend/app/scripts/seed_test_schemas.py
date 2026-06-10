"""
seed_test_schemas.py — 为 admin 创建两个测试数据集对应的标注模板
Author: hongchuwudi
Description: 偏好对比标注 + 问答质量评估
"""
import requests
import json

BASE = "http://127.0.0.1:8000"

# Login
r = requests.post(f"{BASE}/api/auth/login", json={"email": "admin@admin.com", "password": "admin123"})
token = r.json()["data"]["access_token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Schema 1: 偏好对比标注
s1 = {
    "name": "偏好对比标注模板",
    "schema": {
        "title": "偏好对比标注",
        "description": "RLHF偏好对比——判断A/B哪个回答更好",
        "fields": [
            {"id": "f1", "key": "id", "type": "showitem", "title": "题目ID", "required": False, "colSpan": 8},
            {"id": "f2", "key": "task_type", "type": "showitem", "title": "任务类型", "required": False, "colSpan": 8},
            {"id": "f3", "key": "lang", "type": "showitem", "title": "语言", "required": False, "colSpan": 8},
            {"id": "f4", "key": "prompt", "type": "showitem", "title": "用户提问", "required": False, "colSpan": 24},
            {"id": "f5", "key": "response_a", "type": "showitem", "title": "回答 A", "required": False, "colSpan": 24},
            {"id": "f6", "key": "response_b", "type": "showitem", "title": "回答 B", "required": False, "colSpan": 24},
            {"id": "f7", "key": "preferred", "type": "radio", "title": "偏好结论", "required": True, "colSpan": 12,
             "options": [{"label": "A 更好", "value": "A"}, {"label": "B 更好", "value": "B"}, {"label": "平局", "value": "tie"}]},
            {"id": "f8", "key": "margin", "type": "radio", "title": "优势程度", "required": True, "colSpan": 12,
             "options": [{"label": "显著更好", "value": "显著更好"}, {"label": "略好", "value": "略好"}, {"label": "相当", "value": "相当"}]},
            {"id": "f9", "key": "safety_flag", "type": "radio", "title": "是否涉及安全风险", "required": True, "colSpan": 12,
             "options": [{"label": "是", "value": "是"}, {"label": "否", "value": "否"}]},
            {"id": "f10", "key": "dimensions", "type": "checkbox", "title": "判断依据（多选）", "required": True, "colSpan": 12,
             "options": [{"label": "准确性", "value": "准确性"}, {"label": "完整性", "value": "完整性"}, {"label": "安全性", "value": "安全性"},
                         {"label": "流畅性", "value": "流畅性"}, {"label": "可读性", "value": "可读性"}, {"label": "创造性", "value": "创造性"}]},
            {"id": "f11", "key": "annotator_note", "type": "textarea", "title": "判断理由", "required": False, "colSpan": 24, "rows": 4},
            {"id": "f12", "key": "ai_assist", "type": "llm", "title": "AI 预判参考", "required": False, "colSpan": 24},
        ],
        "groups": [],
        "tabs": [
            {"id": "t1", "title": "题目信息", "fieldIds": ["f1", "f2", "f3", "f4", "f5", "f6"], "groupIds": []},
            {"id": "t2", "title": "标注判定", "fieldIds": ["f7", "f8", "f9", "f10", "f11", "f12"], "groupIds": []},
        ],
    }
}

r = requests.post(f"{BASE}/api/schemas/", json=s1, headers=headers)
print(f"Schema 1 (偏好对比): status={r.status_code} id={r.json()['data']['id']}")

# Schema 2: 问答质量评估
s2 = {
    "name": "问答质量评估模板",
    "schema": {
        "title": "问答质量评估",
        "description": "对模型回答进行多维度评分",
        "fields": [
            {"id": "g1", "key": "id", "type": "showitem", "title": "题目ID", "required": False, "colSpan": 8},
            {"id": "g2", "key": "category", "type": "showitem", "title": "题目分类", "required": False, "colSpan": 8},
            {"id": "g3", "key": "difficulty", "type": "showitem", "title": "难度", "required": False, "colSpan": 8},
            {"id": "g4", "key": "prompt", "type": "showitem", "title": "用户提问", "required": False, "colSpan": 24},
            {"id": "g5", "key": "model_answer", "type": "showitem", "title": "模型回答", "required": False, "colSpan": 24},
            {"id": "g6", "key": "reference", "type": "showitem", "title": "参考答案", "required": False, "colSpan": 24},
            {"id": "g7", "key": "overall_score", "type": "radio", "title": "综合评分 (1-5)", "required": True, "colSpan": 6,
             "options": [{"label": "1", "value": "1"}, {"label": "2", "value": "2"}, {"label": "3", "value": "3"}, {"label": "4", "value": "4"}, {"label": "5", "value": "5"}]},
            {"id": "g8", "key": "accuracy_score", "type": "radio", "title": "准确性 (1-5)", "required": True, "colSpan": 6,
             "options": [{"label": "1", "value": "1"}, {"label": "2", "value": "2"}, {"label": "3", "value": "3"}, {"label": "4", "value": "4"}, {"label": "5", "value": "5"}]},
            {"id": "g9", "key": "format_score", "type": "radio", "title": "格式合规 (1-5)", "required": True, "colSpan": 6,
             "options": [{"label": "1", "value": "1"}, {"label": "2", "value": "2"}, {"label": "3", "value": "3"}, {"label": "4", "value": "4"}, {"label": "5", "value": "5"}]},
            {"id": "g10", "key": "safety_score", "type": "radio", "title": "安全性 (1-5)", "required": True, "colSpan": 6,
             "options": [{"label": "1", "value": "1"}, {"label": "2", "value": "2"}, {"label": "3", "value": "3"}, {"label": "4", "value": "4"}, {"label": "5", "value": "5"}]},
            {"id": "g11", "key": "error_tags", "type": "checkbox", "title": "错误类型（多选）", "required": False, "colSpan": 12,
             "options": [{"label": "事实错误", "value": "事实错误"}, {"label": "逻辑矛盾", "value": "逻辑矛盾"}, {"label": "格式问题", "value": "格式问题"},
                         {"label": "安全违规", "value": "安全违规"}, {"label": "信息缺失", "value": "信息缺失"}]},
            {"id": "g12", "key": "detailed_feedback", "type": "textarea", "title": "详细评审意见", "required": False, "colSpan": 24, "rows": 4},
            {"id": "g13", "key": "ai_assist", "type": "llm", "title": "AI 预评分参考", "required": False, "colSpan": 24},
        ],
        "groups": [],
        "tabs": [
            {"id": "t1", "title": "题目信息", "fieldIds": ["g1", "g2", "g3", "g4", "g5", "g6"], "groupIds": []},
            {"id": "t2", "title": "质量评分", "fieldIds": ["g7", "g8", "g9", "g10", "g11", "g12", "g13"], "groupIds": []},
        ],
    }
}

r = requests.post(f"{BASE}/api/schemas/", json=s2, headers=headers)
print(f"Schema 2 (问答质量): status={r.status_code} id={r.json()['data']['id']}")
