"""
test_state_machine.py — 状态机 + 模型 + 导入 + Service 冒烟测试
运行: python -m app.scripts.test_state_machine
"""
import sys, ast, os


def test_transitions():
    """验证所有合法/非法状态转移"""
    from app.state_machine.base import validate_transition

    tests = [
        # 合法
        ('submitted', 'submitted', True),
        ('submitted', 'ai_reviewing', True),
        ('ai_reviewing', 'ai_reviewing', True),     # 重试
        ('ai_reviewing', 'rejected', True),          # AI打回
        ('ai_reviewing', 'review', True),            # AI通过/可疑→复审
        ('review', 'review', True),                  # 重试
        ('review', 'final_review', True),            # 复审通过→终审
        ('review', 'rejected', True),                # 复审打回
        ('final_review', 'final_review', True),
        ('final_review', 'warehouse', True),
        ('final_review', 'rejected', True),
        # 非法
        ('warehouse', 'submitted', False),
        ('rejected', 'submitted', False),
        ('submitted', 'warehouse', False),
        ('ai_reviewing', 'warehouse', False),
    ]
    failed = 0
    for fr, to, ok in tests:
        try:
            validate_transition('LabelResult.status', fr, to)
            if not ok:
                print(f'  FAIL: {fr}->{to} should be REJECTED')
                failed += 1
        except Exception:
            if ok:
                print(f'  FAIL: {fr}->{to} should be ALLOWED')
                failed += 1
    total = len(tests)
    print(f'  State transitions: {total-failed}/{total} passed')
    return failed == 0


def test_models():
    """验证所有状态列是 VARCHAR 而非 ENUM"""
    from app.models.tasks.result import LabelResult
    from app.models.tasks.item import TaskItem
    from app.models.tasks.task import LabelTask

    checks = [
        (LabelResult, 'status'),
        (LabelResult, 'labeler_type'),
        (LabelTask, 'status'),
        (LabelTask, 'assignee_type'),
    ]
    ok = True
    for model, col_name in checks:
        col = model.__table__.columns[col_name]
        is_varchar = 'VARCHAR' in str(col.type).upper()
        if not is_varchar:
            print(f'  FAIL: {model.__name__}.{col_name} is {col.type}')
            ok = False
    flow = TaskItem.__table__.columns.get('flow_history')
    if flow is None:
        print(f'  FAIL: TaskItem.flow_history missing')
        ok = False
    print(f'  Models: {"OK" if ok else "FAIL"}')
    return ok


def test_imports():
    """验证所有关键模块可导入，且 Service 层不变量的 UnboundLocalError"""
    modules = [
        'app.state_machine.result',
        'app.state_machine.base',
        'app.agents.agent',
        'app.agents.pool',
        'app.services.common.flow',
        'app.services.ai.review_service',
        'app.api.v1.ai.reviews',
        'app.services.tasks.service',
    ]
    failed = 0
    for mod in modules:
        try:
            __import__(mod)
        except Exception as e:
            print(f'  FAIL: import {mod} - {e}')
            failed += 1
    # 额外：确保 TaskService 可以实例化
    try:
        from app.services.tasks.service import TaskService
        from app.config.database import SessionLocal
        db = SessionLocal()
        svc = TaskService(db)
        # 验证关键 service 方法存在
        assert hasattr(svc, 'create_result'), 'create_result missing'
        assert hasattr(svc, 'review_result'), 'review_result missing'
        assert hasattr(svc, 'list_task_items'), 'list_task_items missing'
        db.close()
    except Exception as e:
        print(f'  FAIL: TaskService init - {e}')
        failed += 1
    print(f'  Imports: {len(modules)-failed}/{len(modules)} passed')
    return failed == 0


def test_no_import_shadowing():
    """扫描 services/ 下所有 .py 文件，检测函数内 import 是否与模块级 import 冲突"""
    import shutil
    backend = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    svc_dir = os.path.join(backend, 'app', 'services')
    agent_dir = os.path.join(backend, 'app', 'agents')

    issues = 0
    for scan_dir in [svc_dir, agent_dir]:
        if not os.path.isdir(scan_dir):
            continue
        for root, dirs, files in os.walk(scan_dir):
            for fname in files:
                if not fname.endswith('.py') or fname.startswith('__'):
                    continue
                fpath = os.path.join(root, fname)
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        tree = ast.parse(f.read(), filename=fpath)
                except SyntaxError:
                    continue

                # 收集模块级 import 的名字
                module_imports = set()
                for node in ast.iter_child_nodes(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            module_imports.add(alias.asname or alias.name.split('.')[0])
                    elif isinstance(node, ast.ImportFrom):
                        for alias in node.names:
                            name = alias.asname or alias.name
                            if name and name != '*':
                                module_imports.add(name)

                # 检查函数内的 import
                for node in ast.walk(tree):
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        local_imports = set()
                        for sub in ast.walk(node):
                            if isinstance(sub, ast.Import):
                                for alias in sub.names:
                                    local_imports.add(alias.asname or alias.name.split('.')[0])
                            elif isinstance(sub, ast.ImportFrom):
                                for alias in sub.names:
                                    name = alias.asname or alias.name
                                    if name and name != '*':
                                        local_imports.add(name)
                        conflicts = module_imports & local_imports
                        for c in conflicts:
                            relpath = os.path.relpath(fpath, backend)
                            print(f'  WARN: {relpath}::{node.name}() shadows module-import "{c}"')
                            issues += 1

    if issues == 0:
        print(f'  Import shadowing: OK (no conflicts found)')
    else:
        print(f'  Import shadowing: {issues} conflict(s) found')

    # Also test the DB schema
    try:
        from app.config.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            r = conn.execute(text("SELECT COLUMN_NAME,DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='labelhub' AND TABLE_NAME='results' AND COLUMN_NAME='status'"))
            row = r.fetchone()
            if row and row[1] != 'varchar':
                print(f'  FAIL: DB results.status is {row[1]}, expected varchar')
                issues += 1
    except Exception as e:
        print(f'  FAIL: DB check - {e}')
        issues += 1

    return issues == 0


if __name__ == '__main__':
    all_ok = True
    for name, fn in [('State Machine', test_transitions), ('Models', test_models), ('Imports', test_imports), ('Code Scan', test_no_import_shadowing)]:
        print(f'=== {name} ===')
        if not fn():
            all_ok = False
        print()
    print('ALL TESTS PASSED' if all_ok else 'SOME TESTS FAILED')
    sys.exit(0 if all_ok else 1)
