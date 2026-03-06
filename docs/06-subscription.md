# 06. サブスクリプション制御

- **max_users:** **users のみ**カウント。employees はカウントしない（ログイン数制限が自然）。
- **max_users 超過** → 新規ユーザー（招待）追加不可
- **status ≠ active** → シフト生成不可
- **expires_at 超過** → `suspended` へ自動移行
