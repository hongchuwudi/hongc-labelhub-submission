"""LLM 触发 API"""
import json
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.common import LLMTriggerRequest

from app.config.database import get_db
from app.models.auth.user import User
from app.models.tasks.task import LabelTask
from app.models.datasets.item import DatasetItem
from app.infra.security import require_role
from app.schemas.common import APIResponse

logger = logging.getLogger("llm_trigger")
router = APIRouter()



@router.post("/")
def llm_trigger(
    body: LLMTriggerRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("labeler", "owner")),
):
    """LLM 辅助建议——根据当前题目数据智能推荐标注内容"""
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_openai import ChatOpenAI
    from app.config.settings import settings

    # 加载数据
    task = db.query(LabelTask).filter(LabelTask.id == body.task_id).first()
    if not task:
        return APIResponse.error("任务不存在")

    item = db.query(DatasetItem).filter(DatasetItem.id == body.item_id).first()
    if not item:
        return APIResponse.error("题目不存在")

    item_data_str = json.dumps(item.data, ensure_ascii=False, indent=2)

    # 检查 API 配置
    if not settings.LLM_API_KEY:
        logger.warning("LLM API Key 未配置，返回模拟结果")
        return APIResponse.ok({
            "suggestion": f"[LLM 模拟] 基于 {body.field_title} 的上下文，建议值：{item_data_str[:100]}...",
        }, message="LLM 未配置，返回模拟结果")

    # 调 LLM（直接用 openai 兼容接口，不用 LangChain 避免解析差异）
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL,
        )

        system_prompt = """你是一个数据标注辅助专家。根据给定的原始数据和任务上下文，为标注字段提供准确的建议值。

规则：
1. 如果原始数据中已有对应的明确值，直接提取
2. 如果需要推理，给出简洁准确的答案
3. 如果无法确定，诚实说明
4. 只返回建议值本身，不要额外解释"""

        user_prompt = f"""任务：{task.title}
待标注字段：{body.field_title}
原始数据：
```json
{item_data_str}
```

请为字段「{body.field_title}」给出标注建议："""

        resp = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=300,
        )

        suggestion = resp.choices[0].message.content or ""
        suggestion = suggestion.strip()
        logger.info("LLM suggestion for %s/%s: len=%d, preview=%s",
                    body.task_id, body.field_key, len(suggestion), suggestion[:100])

        return APIResponse.ok({"suggestion": suggestion}, message="获取建议成功")

    except Exception as e:
        logger.exception("LLM trigger failed")
        return APIResponse.error(f"LLM 调用失败：{str(e)}")
