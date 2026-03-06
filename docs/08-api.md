# 08. API 設計

## エラーレスポンス形式

プロダクトの品質を決める地味な部分。次の形式を共通とする。

```json
{
  "code": "validation_error",
  "message": "Invalid request",
  "details": {}
}
```

**HTTP ステータス**

| ステータス | 意味 |
|------------|------|
| 401 | 認証失敗 |
| 403 | 権限不足 |
| 404 | リソースなし |
| 422 | バリデーションエラー |
| 500 | サーバエラー |

REST API の実務的な標準にかなり近い。

---

## Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/signup` — 招待受け入れ・パスワード設定。body: `{ "token": "...", "password": "..." }`。サーバーは **token 検証 → users 作成 → employees と紐付け** のみ行う。
- `POST /auth/register-org` — 組織と org_admin を同時に作る。body: `{ "organization_name": "...", "admin_email": "...", "password": "..." }`。詳細は [05-auth-and-invitation.md](05-auth-and-invitation.md) 参照。

---

## System Admin

- `POST /admin/organizations`
- `POST /admin/org-admin`
- `PATCH /admin/subscription`

---

## Organization

- `POST /org/invite` — body: `{ "email": "...", "role": "staff" }`
- `GET /org/employees` — **デフォルトは is_active が true の職員のみ返す。** 無効も含めたい場合は `?include_inactive=true`。
- `POST /org/employees`
- `POST /org/shifts/generate` — リクエスト: `{ "year": 2026, "month": 4 }`。レスポンスは `{ "status": "ok" }` のみ。実データは GET /org/shifts で取得。同一組織で生成中なら **409 Conflict**。**過去月は禁止**（422, `code: "invalid_period"`, `message: "Cannot generate shifts for past months"`）。将来 `force=true` で拡張可。
- `GET /org/shifts` — クエリ **year, month 必須**。**各要素に必ず `id`（shift の PK）を含める。** 例: `[{ "id": "shift_uuid", "date": "2026-04-01", "slot": "AM", "department": "daycare", "employee_id": "emp_1" }, ...]`
- `PATCH /org/shifts/{shift_id}` — 手動修正。更新可: `employee_id`, `department`, `slot`。

---

## Staff

- `GET /staff/shifts` — **期間指定必須。** クエリ例: `year=2026&month=4` または `start=2026-04-01&end=2026-04-30`。後者の方が拡張性が高い。
- **希望休（day-offs）**
  - `GET /staff/day-offs` — 一覧
  - `POST /staff/day-offs` — 申請。body: `{ "date": "2026-04-15" }`
  - `DELETE /staff/day-offs/{id}` — 取消
  - 同一日の重複申請は禁止（DB で UNIQUE(employee_id, date)）。
