# Shiftora Frontend

Next.js（SPA）、App Router、TypeScript、Tailwind CSS。

## セットアップ

```bash
npm install
```

## 環境変数

`.env.local.example` をコピーして `.env.local` を作成し、API のベース URL を設定する。

```bash
cp .env.local.example .env.local
```

- **NEXT_PUBLIC_API_URL**: バックエンド API のベース URL（末尾スラッシュなし）。ローカル開発では `http://localhost:8000`。本番では Railway などの公開 URL。

## 起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) で開く。バックエンド API は別途、ルートで `docker-compose up` するか、既に起動している API の URL を `.env.local` に指定する。

## ルート

- `/` — トップ
- `/login` — ログイン（5.1）
- `/signup` — 招待 signup（5.1）
- `/register-org` — 組織登録（5.1）
- `/employees` — 職員管理（5.2）
- `/shift/generate` — シフト生成（5.3）
- `/shift/calendar` — シフトカレンダー（5.4）
- `/my-shifts` — 自分のシフト（5.5）
- `/day-offs` — 希望休（5.6）
