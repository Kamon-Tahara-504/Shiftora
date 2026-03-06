# 12. 詰める候補（実装時に決めること）

以下は未確定または実装時に詳細を詰める項目。決まったら本文（README または該当する docs）に反映し、ここから消す。

---

## 本文に反映済みの決定

- 招待フロー・signup API・**register-org**（組織と org_admin 同時作成）
- 週の定義（MVP は ISO week）
- **GET /org/shifts** はレスポンスに **shift.id 必須**
- **GET /staff/shifts** は**期間クエリ必須**（year/month または start/end）
- **希望休**は GET・POST・DELETE の 3 本立て、**同日重複禁止**（DB 制約）
- **GET /org/employees** はデフォルト **is_active のみ**、`?include_inactive=true` で無効も取得
- **シフト生成**は**過去月禁止**（422 invalid_period）
- **組織作成**は **POST /auth/register-org** で org と org_admin を同時に作る

---

## 現時点で未確定の項目

なし。実装中に新たに決めたいことが出たらこのセクションに追記する。
