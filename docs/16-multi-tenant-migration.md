# 11. マルチテナント移行メモ（1ユーザー複数組織）

## 目的

- 現行の `users.organization_id`（1ユーザー1組織）モデルを維持したまま、
- 将来の「1ユーザー複数組織所属」に段階的に移行する。

本ドキュメントは **安全移行** を最優先とし、段階的に実施する。

## 追加テーブル（Phase 1）

- `organization_memberships`
  - `organization_id`, `user_id`, `role`, `status`, `is_default`
  - `UNIQUE (organization_id, user_id)` で同組織重複所属を防止
  - `is_default=true` はユーザーごとに1件まで

## 段階移行プラン

### Phase 1: 追加のみ（非破壊）

- `organization_memberships` を追加
- `users.organization_id` + `users.role` をバックフィル
- 既存 API / JWT / RBAC は **変更しない**

### Phase 2: 読み取りの二重化

- `/auth/me` で `memberships[]` と `active_organization_id` を返却
- 既存項目（`organization_id`, `role`）は互換維持
- サーバーは将来的に membership を正としつつ、旧項目へミラー

### Phase 3: 書き込みの二重化

- 組織作成・招待受諾時に `organization_memberships` を正として更新
- 旧 `users.organization_id` / `users.role` へも同時反映（互換期間）
- org切替 API（例: `POST /auth/switch-org`）を導入

### Phase 4: 認可の切替

- JWT に `active_organization_id` と `membership_role` を明示
- RBAC は membership を参照
- 監査ログに membership_id / org switch event を追加

### Phase 5: 旧カラムの縮退

- 全クライアント移行後に `users.organization_id` / `users.role` の依存を削減
- 最終的に削除する場合は十分な観測期間を置く

## 想定例外フロー（要件）

- 招待受諾時に、同一orgの active membership が既に存在する
- 招待受諾時に、別orgの active membership がある（許可/拒否ポリシー要定義）
- default membership が未設定 / 2件以上存在（整合性違反）
- org切替先が suspended / left membership
- JWTの active org と DB の membership が不整合
- org削除時、default membership の再選定が必要
- 退会（left）後の再招待時に role をどう復元するか

## 運用ガードレール

- 先に DB 追加 → 観測 → 読み取り二重化 → 書き込み二重化 の順で進める
- 旧 API レスポンス項目は一気に削除しない
- 監査ログに「org切替」「membership変更」を記録する
- 失敗時ロールバックは「新テーブル無視」で成立するように設計する

