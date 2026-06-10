# 配置数据库连接与 ORM 模型基础

## 我的提示词

```
请帮我配置后端数据库层：

1. config/settings.py：所有环境变量
2. config/database.py：engine + SessionLocal + get_db + 慢查询日志
3. models/base.py：基础模型类
4. main.py lifespan：启动时建表
5. 验证：启动 uvicorn 确认数据库连接成功
```

---

## AI 的回答

### config/settings.py

已在前面步骤创建，包含所有 DB/Redis/MQ/LLM/JWT 配置变量和 `database_url` 属性。

### config/database.py

```python
import time
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config.settings import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.database_url,
    pool_size=10,
    pool_recycle=3600,
    echo=False,
)

# 慢查询日志（>300ms 打印警告）
@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault("query_start_time", []).append(time.time())

@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    start = conn.info["query_start_time"].pop()
    elapsed = time.time() - start
    if elapsed > 0.3:
        logger.warning(f"Slow query ({elapsed:.2f}s): {statement[:200]}...")

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### models/base.py

```python
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime
from app.config.database import Base

class BaseModel(Base):
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
```

### 验证

```bash
# 1. 确保 MySQL 中已创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS labelhub DEFAULT CHARACTER SET utf8mb4;"

# 2. 启动后端
python run.py

# 3. 查看日志确认：
#    - "Connected to MySQL" 
#    - 表自动创建成功
# 4. 访问 http://localhost:8000/docs 确认 Swagger UI 正常
```
