# 02. 技術スタック・アーキテクチャ

## 技術スタック

| 領域 | 技術 |
|------|------|
| **Backend** | FastAPI, JWT（自前実装）, bcrypt, OR-Tools（シフト最適化） |
| **Frontend** | Next.js（SPA。SSR は不要） |
| **Database** | Supabase（PostgreSQL） |
| **Deployment** | Docker（ローカル）, Railway（本番） |

---

## システムアーキテクチャ

```
Client (Browser)
       ↓
FastAPI (Docker)
       ↓
Supabase (PostgreSQL)
       ↓
OR-Tools Solver
```

---

## マルチテナント設計

- **テナント分離:** `organization_id` による論理分離
- **JWT:** `organization_id` をペイロードに保持
- **RLS:** PostgreSQL Row Level Security（本番導入予定）
