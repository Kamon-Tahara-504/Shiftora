# 05. 認証・招待フロー

## JWT

- **Access Token:** 15 分
- **Refresh Token:** 7 日

**ペイロード例:**

```json
{
  "user_id": "...",
  "organization_id": "...",
  "role": "...",
  "system_role": "...",
  "token_version": 0
}
```

**トークン失効（token_version 方式）**

- `users.token_version` を保持。ログアウトまたは強制失効時に `token_version += 1`。
- JWT 検証時に DB の `token_version` と比較し、一致しなければ拒否。

---

## セキュリティ要件

- bcrypt によるパスワードハッシュ
- HTTPS 必須
- 上記 token_version によるトークン失効
- `max_users` 超過防止
- `subscription.status` の確認

---

## MVP での認証スコープ

- **メール検証・パスワードリセットは MVP ではやらない。** 開発コストの割に価値が低い。
- ログインは **admin がユーザー発行（招待）する方式**で十分。

---

## 招待フロー（招待トークン方式）

認証モデルとユーザー作成の入口なので、ここを曖昧にすると API/DB の後から変更になりやすい。Shiftora では**招待トークン方式**とする。SaaS でよく使われるパターンで、シンプルで安全である。

**Step 1: org_admin が職員を招待**

- `POST /org/invite`
- body: `{ "email": "staff@example.com", "role": "staff" }`
- サーバーは **invitation_tokens** に 1 件作成（id, organization_id, email, token, expires_at 等）。

**Step 2: 職員がパスワード設定**

- 招待リンク例: `https://shiftora.app/signup?token=xxxxx`
- 職員がそのリンクでアクセスし、パスワードを設定して `POST /auth/signup` に `{ "token": "...", "password": "..." }` を送る。
- サーバー: token 検証 → users 作成 → 既存の employees と紐付け（同一 email の職員が事前に org_admin により登録されている前提）。

**MVP での割り切り:** **メール送信は MVP では必須にしない。** 最初は管理者に招待リンクをレスポンスで返すだけでも成立する。管理者が手動でリンクを渡す。

---

## 組織・org_admin の初回作成（register-org）

システムの入口として、組織と org_admin を同時に作る方式を採用する。

- **エンドポイント:** `POST /auth/register-org`
- **body:** `{ "organization_name": "Care Center A", "admin_email": "admin@example.com", "password": "..." }`
- **サーバー処理:** organization 作成 → user 作成（role = org_admin）→ subscription 作成をまとめて実行。
- オンボーディングが一発で終わり、SaaS でよくあるパターンである。
