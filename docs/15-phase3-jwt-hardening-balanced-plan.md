# 15. Phase 3 JWT Hardening Plan (Balanced)

独自JWT運用を継続する前提で、実装負荷と運用負荷のバランスを取りつつ、
セキュリティ運用を実運用レベルへ引き上げるための実装計画。

## 目的

- 脆弱性検知を CI に組み込み、問題を早期検出する
- 認可・レート制限・ヘッダの回帰を自動テストで固定化する
- 独自JWTの鍵運用リスクをガードレールで低減する
- インシデント発生時に当番が迷わない運用手順を整備する

## スコープ

- 対象
  - バックエンド（FastAPI）
  - フロントエンド依存関係監査（Node）
  - CI ワークフロー（GitHub Actions）
  - 運用Runbook（ドキュメント）
- 非対象
  - 業務機能追加
  - Supabase Auth への移行

## 実装項目

### 1) CI脆弱性スキャン基盤（最優先）

- 追加ファイル（想定）
  - `.github/workflows/security-scan.yml`
- 実装内容
  - Python依存監査（`backend/requirements.txt`）
  - Node依存監査（`frontend/package.json`）
  - 重大度 `Critical/High` で CI fail
- 受け入れ基準
  - PRごとに自動実行される
  - 脆弱性結果が CI ログで可視化される
  - 高リスクでマージを止められる

### 2) セキュリティ回帰テストの自動化

- 追加ファイル（想定）
  - `backend/tests/security/test_authz.py`
  - `backend/tests/security/test_rate_limit.py`
  - `backend/tests/security/test_headers.py`
- 実装内容
  - RBAC（org/staff 越境不可）検証
  - 認証系レート制限（429 + Retry-After）検証
  - セキュアヘッダ付与検証
- 受け入れ基準
  - CIで毎回実行
  - 1件でも失敗で CI fail

### 3) JWT運用ガードレール

- 変更ファイル（想定）
  - `backend/app/config.py`
  - `backend/app/auth/jwt.py`
  - `backend/app/auth/service.py`
  - `backend/app/main.py`
- 実装内容
  - `JWT_SECRET_KEY` の最低強度チェック（短すぎる鍵を拒否/警告）
  - 鍵ローテーション準備（現行鍵 + 次鍵の扱いを設計）
  - 起動時自己診断（危険設定をログ出力）
- 受け入れ基準
  - 弱い鍵で本番運用しにくい設計
  - 鍵切替手順が実装と整合

### 4) インシデント対応Runbook整備

- 追加ファイル（想定）
  - `docs/security-incident-runbook.md`
- 実装内容
  - 兆候確認、初動、封じ込め、復旧、事後対応
  - JWT漏えい時の対処（token_version失効、鍵ローテーション）
- 受け入れ基準
  - 当番がRunbookのみで初動できる

### 5) 段階導入ゲート

- 実装内容
  - Stage 1: スキャン導入（fail-open）
  - Stage 2: 回帰テスト導入（主要ブランチで fail-closed）
  - Stage 3: 鍵ガード本番化
- 受け入れ基準
  - ロールバック条件が明記されている
  - 導入段階ごとの判断基準がある

## 推奨実装順

1. CI脆弱性スキャン
2. セキュリティ回帰テスト
3. JWT運用ガードレール
4. インシデントRunbook
5. 段階導入ゲート厳格化

## コミット分離方針

- セキュリティ変更は専用コミットに分離する
- 業務機能変更と同一コミットに混在させない
- 1コミット1目的（scan / tests / jwt-guard / runbook / rollout）
