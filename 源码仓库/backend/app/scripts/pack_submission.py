"""
pack_submission.py — 打包参赛提交物
Author: hongchuwudi
Description: 从源码目录拷贝到提交目录，过滤 .gitignore 规则，先清空目标再拷贝
Usage: python -m app.scripts.pack_submission [--dry-run]
"""
import os
import sys
import shutil
import argparse
from pathlib import Path
from fnmatch import fnmatch

# 项目根目录（backend/..）
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent


def load_env_vars() -> tuple[Path, Path]:
    """读取 .env 中的路径配置，不存在则用默认值"""
    env_file = PROJECT_ROOT / ".env"
    source = None
    dest = None
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key, val = key.strip(), val.strip().strip('"').strip("'")
            if key == "PROJECT_SOURCE_CODE_DIRECTORY":
                source = Path(val)
            elif key == "CONTEST_SUBMISSION_DIRECTORY":
                dest = Path(val)
    if not source:
        source = PROJECT_ROOT
        print(f"[warn] PROJECT_SOURCE_CODE_DIRECTORY 未设置，使用项目根目录: {source}")
    if not dest:
        dest = PROJECT_ROOT / "submission"
        print(f"[warn] CONTEST_SUBMISSION_DIRECTORY 未设置，使用默认: {dest}")
    return source, dest


def parse_gitignore(root: Path) -> list[str]:
    """解析 .gitignore 规则，返回匹配模式列表"""
    gi = root / ".gitignore"
    if not gi.exists():
        return []
    patterns: list[str] = []
    for line in gi.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        patterns.append(line)
    return patterns


def should_ignore(rel_path: str, patterns: list[str]) -> bool:
    """检查相对路径是否匹配任一 gitignore 规则"""
    for p in patterns:
        # 处理目录规则
        if p.endswith("/"):
            p_clean = p.rstrip("/")
            if fnmatch(rel_path, p_clean) or fnmatch(rel_path, f"{p_clean}/*"):
                return True
        elif p.startswith("/"):
            if fnmatch(rel_path, p.lstrip("/")):
                return True
        elif fnmatch(rel_path, p) or fnmatch(rel_path, f"**/{p}"):
            return True
        # 匹配中间目录
        parts = rel_path.replace("\\", "/").split("/")
        for part in parts:
            if fnmatch(part, p.rstrip("/")):
                return True
    return False


def main():
    parser = argparse.ArgumentParser(description="打包参赛提交物")
    parser.add_argument("--dry-run", action="store_true", help="只打印，不实际拷贝")
    args = parser.parse_args()

    source, dest = load_env_vars()
    patterns = parse_gitignore(source)

    print(f"源目录: {source}")
    print(f"目标目录: {dest}")
    print(f".gitignore 规则: {len(patterns)} 条")

    # 清空目标
    if dest.exists():
        if args.dry_run:
            print(f"[dry-run] 将清空: {dest}")
        else:
            shutil.rmtree(dest)

    dest.mkdir(parents=True, exist_ok=True)

    # 遍历拷贝
    copied, skipped = 0, 0
    for root, dirs, files in os.walk(source):
        # 跳过 .git 目录
        dirs[:] = [d for d in dirs if d != ".git"]

        rel_dir = Path(root).relative_to(source).as_posix()
        if rel_dir == ".":
            rel_dir = ""

        for f in files:
            rel_path = f"{rel_dir}/{f}".lstrip("/")
            if should_ignore(rel_path, patterns):
                skipped += 1
                continue

            src_file = Path(root) / f
            dst_file = dest / rel_dir / f

            if args.dry_run:
                copied += 1
                continue

            dst_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src_file, dst_file)
            copied += 1

    print(f"完成: 拷贝 {copied} 个文件, 跳过 {skipped} 个文件")
    if args.dry_run:
        print("[dry-run] 未实际修改文件")


if __name__ == "__main__":
    main()
