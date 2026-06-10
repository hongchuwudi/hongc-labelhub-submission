# 配置 TypeScript 严格模式与 ESLint

## 我的提示词

```
请帮我配置前端项目的 TypeScript 和 ESLint：

1. TypeScript 配置：strict:true, @/* 别名, target ES2023, bundler模式
2. ESLint：继承 @typescript-eslint, 禁止 any
3. package.json 脚本：typecheck, lint, dev, build
4. 验证：写一个带 any 的文件，跑 typecheck 应该报错
```

---

## AI 的回答

### tsconfig.app.json

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.app.json --noEmit && vite build",
    "typecheck": "tsc -p tsconfig.app.json --noEmit",
    "lint": "eslint src/ --ext .ts,.tsx"
  }
}
```

### 验证

创建测试文件 `src/test-any.ts`：
```typescript
const x: any = 123;  // ← eslint 应该报 warning
```

运行：
```bash
npx tsc -p tsconfig.app.json --noEmit  # 应该没有类型错误
npx eslint src/test-any.ts              # 应该报 no-explicit-any
```

确认两个命令都按预期工作后删除测试文件。类型检查零错误是 LabelHub 的基本要求。
