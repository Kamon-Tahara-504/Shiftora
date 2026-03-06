# Shiftora 設計ドキュメント 索引

設計を細分化したドキュメント一覧。番号順に読むと流れで理解しやすい。

| # | ファイル | 内容 |
|---|----------|------|
| 01 | [01-overview.md](01-overview.md) | 用語定義・プロジェクト概要・MVP 出荷条件・対象スコープ |
| 02 | [02-architecture.md](02-architecture.md) | 技術スタック・システムアーキテクチャ・マルチテナント |
| 03 | [03-roles-and-usecases.md](03-roles-and-usecases.md) | ロール・権限・典型的ユースケース |
| 04 | [04-database.md](04-database.md) | データベーススキーマ |
| 05 | [05-auth-and-invitation.md](05-auth-and-invitation.md) | 認証設計・JWT・招待フロー・register-org |
| 06 | [06-subscription.md](06-subscription.md) | サブスクリプション制御 |
| 07 | [07-shift-logic.md](07-shift-logic.md) | シフト生成ロジック・制約・OR-Tools |
| 08 | [08-api.md](08-api.md) | API 設計（エラー形式・エンドポイント一覧） |
| 09 | [09-non-functional.md](09-non-functional.md) | 非機能要件・タイムゾーン・監査 |
| 10 | [10-frontend.md](10-frontend.md) | フロントエンド・画面境界 |
| 11 | [11-development-order.md](11-development-order.md) | 開発順序・開発者としての視点 |
| 12 | [12-open-items.md](12-open-items.md) | 詰める候補（実装時に決めること） |
| 13 | [13-issues-and-branches.md](13-issues-and-branches.md) | Issue 一覧・ブランチ名（実装ペースに沿って） |
| 14 | [14-frontend-design-spec.md](14-frontend-design-spec.md) | フロントエンド デザイン設計定義書 |
| 15 | [15-frontend-design-proposal.md](15-frontend-design-proposal.md) | フロントエンド デザイン提案書 |

---

元の設計は [../README.md](../README.md) に集約されている。docs は参照・実装時の検索用に小分けにしたもの。
