# .gitignore 配置

## 提示词

```
请帮我创建一个完善的 .gitignore 文件，覆盖以下内容：

1. 前端排除：
   - node_modules/
   - dist/
   - .env.local
   - *.log

2. 后端排除：
   - __pycache__/
   - *.pyc
   - .env
   - venv/
   - *.egg-info/

3. IDE 排除：
   - .vscode/（保留 settings 但不保留个人配置）
   - .idea/

4. 系统文件：
   - .DS_Store
   - Thumbs.db

5. 敏感信息：
   - .env（不要提交真实密钥）
   - *.pem

6. 提交物目录：
   - submission/（单独管理，不随源码提交）

请创建 .gitignore 并确保所有不需要跟踪的文件都被排除。然后用 git status 确认没有敏感文件出现在待提交中。
```

## AI 的回答

```
已创建完善的 .gitignore，涵盖：node_modules/、dist/、.env.local、__pycache__/、*.pyc、.env、venv/、.vscode/、.idea/、.DS_Store、Thumbs.db、*.pem、submission/。git status 确认无敏感文件出现在待提交中。
```
