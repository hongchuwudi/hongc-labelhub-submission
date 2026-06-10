# 创建后端 FastAPI 项目

## 我的提示词

```
请帮我创建一个 Python FastAPI 后端项目，具体要求：

1. 创建目录结构：app/api/v1/、app/models/、app/schemas/、app/services/、app/agents/、app/state_machine/、app/infra/、app/config/、app/scripts/、tests/

2. 安装核心依赖写入 requirements.txt：fastapi + uvicorn + sqlalchemy + pymysql + pydantic + pyjwt + passlib + openai + redis + pika

3. 创建 config/settings.py：pydantic-settings 从 .env 读取配置

4. 创建 config/database.py：SQLAlchemy engine + SessionLocal + get_db

5. 创建 main.py：FastAPI app + CORS + 路由挂载

6. 创建 run.py：一键启动脚本

请逐个步骤执行，每步确认无误后再继续。
```

---

## AI 的回答

### 步骤 1：创建目录结构

```bash
mkdir -p backend/app/{api/v1/{auth,datasets,schemas,tasks,ai,common},models/{auth,datasets,schemas,tasks,ai,common},schemas,services/{auth,datasets,schemas,tasks,ai,common},agents,state_machine,infra,config,scripts,export}
mkdir -p backend/tests/{auth,datasets,tasks,ai,common}
touch backend/app/__init__.py
```

### 步骤 2：requirements.txt

```
fastapi==0.115.*
uvicorn[standard]==0.34.*
sqlalchemy==2.0.*
pymysql==1.1.*
pydantic==2.10.*
pydantic-settings==2.7.*
pyjwt==2.9.*
passlib[bcrypt]==1.7.*
openai==1.58.*
redis==5.2.*
pika==1.3.*
python-multipart==0.0.*
openpyxl==3.1.*
httpx==0.28.*
pytest==8.3.*
pytest-asyncio==0.25.*
```

```bash
cd backend && pip install -r requirements.txt
```

### 步骤 3：config/settings.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 数据库
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "labelhub"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0
    
    # RabbitMQ
    MQ_HOST: str = "localhost"
    MQ_PORT: int = 5672
    MQ_USER: str = "guest"
    MQ_PASSWORD: str = "guest"
    
    # LLM
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o"
    
    # JWT
    JWT_SECRET: str = "change-me"
    AGENT_POOL_SIZE: int = 5
    
    @property
    def database_url(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 步骤 4：config/database.py

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config.settings import settings

engine = create_engine(settings.database_url, pool_size=10, echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 步骤 5：main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

def create_app() -> FastAPI:
    app = FastAPI(title="LabelHub", version="0.1.0")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.on_event("startup")
    def startup():
        Base.metadata.create_all(bind=engine)
    
    return app

app = create_app()
```

### 步骤 6：run.py

```python
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
```

启动验证：
```bash
python run.py
# 访问 http://localhost:8000/docs 看到 Swagger UI
```
