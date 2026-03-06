# 13. Issue 一覧・ブランチ名（実装ペースに沿って）

実装順序に合わせた Issue 名とブランチ名の対応表。1 Issue = 1 ブランチを想定。

**ブランチ命名:** `feature/{スラッグ}`（例: `feature/docker-setup`）。

---

## Phase 1: Core Foundation

| # | Issue 名 | ブランチ名 |
|---|----------|------------|
| 1.1 | Docker 開発環境の構築 | `feature/docker-setup` |
| 1.2 | Supabase 接続・環境変数設定 | `feature/supabase-connection` |
| 1.3 | DB スキーマ作成（マイグレーション） | `feature/db-schema` |
| 1.4 | JWT 認証（login / refresh / logout） | `feature/jwt-auth` |
| 1.5 | RBAC（ロール・権限チェック） | `feature/rbac` |

---

## Phase 2: Multi-Tenant Security

| # | Issue 名 | ブランチ名 |
|---|----------|------------|
| 2.1 | 組織・org_admin 同時作成 API（register-org） | `feature/register-org` |
| 2.2 | 招待 API（invite）・invitation_tokens | `feature/invite` |
| 2.3 | 招待受け入れ・パスワード設定（signup） | `feature/signup` |
| 2.4 | subscription 自動作成・制御 | `feature/subscription-control` |
| 2.5 | max_users 超過防止 | `feature/max-users` |

---

## Phase 3: Business Logic

| # | Issue 名 | ブランチ名 |
|---|----------|------------|
| 3.1 | 職員マスター API（一覧・追加・編集・無効化） | `feature/employees-crud` |
| 3.2 | 希望休 API（GET / POST / DELETE） | `feature/day-offs-api` |
| 3.3 | シフト生成ロジック（OR-Tools モデル） | `feature/shift-generation-ortools` |
| 3.4 | 解なし時のレスポンス（missing_slots） | `feature/infeasible-response` |
| 3.5 | シフト取得・手動修正 API | `feature/shifts-get-patch` |

※ 3.3 は大きいため、変数・制約・目的関数でサブタスクに分けてもよい。

---

## Phase 4: Production Hardening

| # | Issue 名 | ブランチ名 |
|---|----------|------------|
| 4.1 | RLS 有効化（PostgreSQL） | `feature/rls` |
| 4.2 | audit_logs テーブル・記録処理 | `feature/audit-logs` |
| 4.3 | エラーハンドリング・ログ強化 | `feature/error-logging` |
| 4.4 | Railway デプロイ設定 | `feature/railway-deploy` |
| 4.5 | README・docs 整備 | `feature/docs-readme` |

---

## Phase 5: Frontend

| # | Issue 名 | ブランチ名 |
|---|----------|------------|
| 5.1 | 認証 UI（ログイン・招待 signup） | `feature/auth-ui` |
| 5.2 | org_admin: 職員管理画面 | `feature/org-employees-page` |
| 5.3 | org_admin: シフト生成画面 | `feature/org-shift-generate-page` |
| 5.4 | org_admin: シフトカレンダー画面 | `feature/org-shift-calendar-page` |
| 5.5 | staff: 自分のシフト画面 | `feature/staff-shifts-page` |
| 5.6 | staff: 希望休画面 | `feature/staff-day-offs-page` |

---

## クイック参照（ブランチ名のみ）

```
feature/docker-setup
feature/supabase-connection
feature/db-schema
feature/jwt-auth
feature/rbac
feature/register-org
feature/invite
feature/signup
feature/subscription-control
feature/max-users
feature/employees-crud
feature/day-offs-api
feature/shift-generation-ortools
feature/infeasible-response
feature/shifts-get-patch
feature/rls
feature/audit-logs
feature/error-logging
feature/railway-deploy
feature/docs-readme
feature/auth-ui
feature/org-employees-page
feature/org-shift-generate-page
feature/org-shift-calendar-page
feature/staff-shifts-page
feature/staff-day-offs-page
```

---

**運用の目安:** Issue にラベル `phase-1` ～ `phase-5` を付与するとフィルタしやすい。実装順は本ドキュメントの Phase 順を参照。
