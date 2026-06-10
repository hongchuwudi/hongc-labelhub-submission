"""文件上传——上传到 OSS 并返回访问 URL"""
import uuid
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.auth.user import User
from app.infra.security import require_role
from app.schemas.common import APIResponse
from app.services.common.export import _oss_bucket

router = APIRouter()


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    _user: User = Depends(require_role("owner", "labeler")),
):
    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "bin"
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    oss_key = f"uploads/{ts}_{uuid.uuid4().hex[:8]}.{ext}"

    bucket = _oss_bucket()
    content = await file.read()
    content_type = file.content_type or "application/octet-stream"
    bucket.put_object(oss_key, content, headers={"Content-Type": content_type})

    url = bucket.sign_url("GET", oss_key, 86400)
    return APIResponse.ok({"url": url, "key": oss_key, "name": file.filename}, message="上传成功")
