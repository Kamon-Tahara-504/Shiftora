# 04. データベーススキーマ

## organizations

| カラム | 型・備考 |
|--------|----------|
| id | UUID PK |
| name | |
| created_at | |

---

## subscriptions

| カラム | 型・備考 |
|--------|----------|
| id | UUID PK |
| organization_id | UNIQUE FK |
| plan_type | |
| status | `'active'` / `'suspended'` / `'canceled'` |
| max_users | |
| expires_at | |
| created_at | |

**運用:** 新規 organization 作成時に **subscription を自動生成**。デフォルト例: `plan_type = trial`, `max_users = 20`, `status = active`。将来 Stripe などと連携する時に拡張できる。

---

## users

| カラム | 型・備考 |
|--------|----------|
| id | UUID PK |
| organization_id | nullable FK |
| email | UNIQUE |
| password_hash | |
| role | `'org_admin'` / `'staff'` |
| system_role | `'super_admin'` / `'support_admin'` / `'billing_admin'` |
| token_version | INT（トークン失効用。ログアウト・強制失効で +1） |
| is_active | |
| created_at | |

**制約**

- **システムユーザー:** `organization_id` NULL, `role` NULL
- **組織ユーザー:** `organization_id` NOT NULL, `system_role` NULL

---

## invitation_tokens

| カラム | 型・備考 |
|--------|----------|
| id | UUID PK |
| organization_id | |
| email | |
| role | `'staff'` |
| token | UNIQUE |
| expires_at | **7 日間有効**（SaaS でよくある値） |
| used | |
| created_at | |

---

## employees

| カラム | 型・備考 |
|--------|----------|
| id | UUID PK |
| organization_id | |
| user_id | nullable FK |
| name | |
| employment_type | |
| can_visit | boolean |
| fixed_holiday | JSONB |
| max_consecutive_days | |
| max_weekly_days | |
| is_active | boolean（無効化フラグ。物理削除はしない＝シフト履歴が壊れるため） |
| created_at | |

---

## availability_rules

| カラム | 型・備考 |
|--------|----------|
| id | |
| employee_id | |
| weekday | 0–6（日〜土） |
| available_morning | boolean（その曜日の AM 勤務可） |
| available_afternoon | boolean（その曜日の PM 勤務可） |

OR-Tools に渡す時、boolean 制約が一番扱いやすい。

---

## day_off_requests

| カラム | 型・備考 |
|--------|----------|
| id | |
| employee_id | |
| date | |

**制約:** **同一職員・同一日の重複禁止**。DB で `UNIQUE(employee_id, date)` を張る。UI とバリデーションがシンプルになり、事故を防げる。

---

## shifts

| カラム | 型・備考 |
|--------|----------|
| id | |
| organization_id | |
| date | |
| department | `'daycare'` / `'visit'` |
| slot | `'AM'` / `'PM'`（半日単位のみ） |
| employee_id | |

**設計メモ**

- **employees と users:** `users` = ログインアカウント、`employees` = シフト対象。`employee.user_id` は **nullable**（外部スタッフ・派遣・パートなどログインしない職員がいる）。
- **employment_type:** `fulltime` / `parttime` / `contract`。MVP では制約に使わず属性のみ。
- **fixed_holiday:** 曜日固定休。JSON 配列で曜日番号（0=日〜6=土）。例: `[0, 6]` = 日曜・土曜休み。

---

## audit_logs

MVP でも価値がある。最小構成で十分。

| カラム | 型・備考 |
|--------|----------|
| id | UUID PK |
| organization_id | FK |
| user_id | FK（操作者） |
| event_type | 例: `shift_generated` / `shift_updated` / `employee_created` / `user_role_changed` |
| metadata | JSONB（イベントごとの差分など） |
| created_at | |

**metadata 例（shift_updated 時）:** `{ "shift_id": "...", "before_employee": "...", "after_employee": "..." }` のような差分を入れる。
