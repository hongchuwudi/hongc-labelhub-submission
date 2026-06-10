"""导出 Service——数据查询 + 格式转换 + OSS 上传"""
import json
import csv
import io
import os
from datetime import datetime
from typing import Any

import oss2
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.models.tasks.task import LabelTask
from app.models.tasks.result import LabelResult
from app.models.datasets.item import DatasetItem
from app.models.common.export import ExportJob


def _oss_bucket():
    """创建 OSS Bucket 实例"""
    auth = oss2.Auth(settings.OSS_ACCESS_KEY_ID, settings.OSS_ACCESS_KEY_SECRET)
    return oss2.Bucket(auth, settings.OSS_ENDPOINT, settings.OSS_BUCKET_NAME)


class ExportService:

    def __init__(self, db: Session):
        self.db = db

    # ── 查询导出数据 ──

    def query_data(self, task_id: int, field_mapping: dict | None = None) -> list[dict]:
        """查询任务下 warehouse/final_review 的标注结果"""
        results = (
            self.db.query(LabelResult)
            .filter(LabelResult.task_id == task_id, LabelResult.status.in_(["warehouse", "final_review"]))
            .order_by(LabelResult.item_id.asc())
            .all()
        )

        # 批量查 DatasetItem，避免 N+1
        item_ids = [r.item_id for r in results]
        items_map: dict[int, DatasetItem] = {}
        if item_ids:
            items = self.db.query(DatasetItem).filter(DatasetItem.id.in_(item_ids)).all()
            items_map = {it.id: it for it in items}

        include_review = bool(field_mapping and field_mapping.get("include_review"))

        rows: list[dict] = []
        for r in results:
            item = items_map.get(r.item_id)
            row = {
                "item_id": r.item_id,
                "labeler_id": r.labeler_id,
                "labeler_type": r.labeler_type,
                "original": item.data if item else {},
                "result": r.data,
                "round": r.round,
            }
            if include_review:
                row["reviewer_id"] = r.reviewer_id
                row["reviewed_at"] = r.reviewed_at.isoformat() if r.reviewed_at else None
            if r.ai_scores:
                row["ai_scores"] = r.ai_scores
            rows.append(row)

        if field_mapping:
            rows = self._apply_mapping(rows, field_mapping)

        return rows

    def _apply_mapping(self, rows: list[dict], mapping: dict) -> list[dict]:
        """字段映射: {fields: [...], rename: {...}}"""
        fields = mapping.get("fields", [])
        rename = mapping.get("rename", {})
        if not fields:
            return rows

        result: list[dict] = []
        for row in rows:
            flat = self._flatten(row)
            mapped: dict[str, Any] = {}
            for f in fields:
                val = flat.get(f, "")
                key = rename.get(f, f)
                mapped[key] = val
            result.append(mapped)
        return result

    def _flatten(self, obj: dict, prefix: str = "") -> dict:
        """展平嵌套: {"original": {"title": "a"}} → {"original.title": "a"}"""
        flat: dict[str, Any] = {}
        for k, v in obj.items():
            key = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict) and k not in ("ai_scores",):
                flat.update(self._flatten(v, key))
            elif isinstance(v, (dict, list)):
                flat[key] = json.dumps(v, ensure_ascii=False)
            else:
                flat[key] = v
        return flat

    # ── 格式生成 + OSS 上传 ──

    def generate(self, rows: list[dict], fmt: str) -> tuple[str, str, str]:
        """生成文件内容，上传到 OSS，返回 (oss_key, content_type, file_name)"""
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

        handlers = {
            "json": self._to_json_bytes,
            "jsonl": self._to_jsonl_bytes,
            "csv": self._to_csv_bytes,
            "xlsx": self._to_xlsx_bytes,
        }
        handler = handlers.get(fmt)
        if not handler:
            raise ValueError(f"不支持的格式: {fmt}")

        content_type_map = {
            "json": "application/json",
            "jsonl": "application/x-ndjson",
            "csv": "text/csv",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }

        ext = fmt if fmt != "xlsx" else "xlsx"
        filename = f"export_{ts}.{ext}"
        content = handler(rows)

        bucket = _oss_bucket()
        oss_key = f"exports/{filename}"
        bucket.put_object(oss_key, content, headers={"Content-Type": content_type_map[fmt]})

        return oss_key, content_type_map[fmt], filename

    def _to_json_bytes(self, rows: list[dict]) -> bytes:
        return json.dumps(rows, ensure_ascii=False, indent=2).encode("utf-8")

    def _to_jsonl_bytes(self, rows: list[dict]) -> bytes:
        lines = [json.dumps(row, ensure_ascii=False) for row in rows]
        return "\n".join(lines).encode("utf-8")

    def _to_csv_bytes(self, rows: list[dict]) -> bytes:
        if not rows:
            return b""
        flat_rows = [self._flatten(r) for r in rows]
        keys = list(flat_rows[0].keys())
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=keys, extrasaction="ignore")
        w.writeheader()
        w.writerows(flat_rows)
        return buf.getvalue().encode("utf-8-sig")

    def _to_xlsx_bytes(self, rows: list[dict]) -> bytes:
        try:
            import openpyxl
        except ImportError:
            raise ImportError("请安装 openpyxl: pip install openpyxl")

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "标注结果"

        if rows:
            flat_rows = [self._flatten(r) for r in rows]
            keys = list(flat_rows[0].keys())
            ws.append(keys)
            for row in flat_rows:
                ws.append([str(row.get(k, "")) for k in keys])

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        return buf.read()

    # ── Job 管理 ──

    def create_job(self, task_id: int, owner_id: int, fmt: str,
                   field_mapping: dict | None = None) -> ExportJob:
        """创建导出任务"""
        job = ExportJob(
            task_id=task_id, requested_by=owner_id,
            format=fmt, status="pending",
            field_mapping=json.dumps(field_mapping) if field_mapping else None,
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def process_job(self, job_id: int) -> ExportJob:
        """处理导出任务——查询数据 + 上传 OSS"""
        job = self.db.query(ExportJob).filter(ExportJob.id == job_id).first()
        if not job:
            raise ValueError(f"ExportJob {job_id} not found")

        job.status = "processing"
        self.db.commit()

        try:
            mapping = json.loads(job.field_mapping) if job.field_mapping else None
            rows = self.query_data(job.task_id, mapping)
            oss_key, content_type, filename = self.generate(rows, job.format)

            job.status = "done"
            job.file_path = oss_key            # 存储 OSS object key
            job.file_name = filename
            job.item_count = len(rows)
            job.finished_at = datetime.utcnow()
        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            job.finished_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(job)
        return job

    def list_jobs(self, task_id: int) -> list[ExportJob]:
        return (
            self.db.query(ExportJob)
            .filter(ExportJob.task_id == task_id)
            .order_by(ExportJob.created_at.desc())
            .limit(20)
            .all()
        )

    def get_job(self, job_id: int) -> ExportJob | None:
        return self.db.query(ExportJob).filter(ExportJob.id == job_id).first()

    def generate_download_url(self, job_id: int, expire_seconds: int = 600) -> str:
        """生成 OSS 签名下载 URL，默认 10 分钟有效"""
        job = self.db.query(ExportJob).filter(ExportJob.id == job_id).first()
        if not job or not job.file_path:
            raise ValueError("导出文件不存在")
        bucket = _oss_bucket()
        url = bucket.sign_url("GET", job.file_path, expire_seconds)
        # 强制 HTTPS（防止浏览器 mixed content 拦截）
        if url.startswith("http://"):
            url = "https://" + url[7:]
        return url
