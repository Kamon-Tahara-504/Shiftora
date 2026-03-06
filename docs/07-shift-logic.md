# 07. シフト生成ロジック

## シフト粒度・期間

- **スロット:** **AM / PM のみ**（1日 = morning + afternoon）。訪問介護は半日単位・デイは半日でも扱え、兼務ロジックが書きやすい。
- **生成期間:** **1ヶ月固定**。介護・医療は月単位管理が一般的で、OR-Tools も期間固定のほうが扱いやすい。

---

## シフト配置モデル

1件のシフト = `date` + `slot`(AM/PM) + `department`(daycare/visit) + `employee_id`。  
例: `2026-04-01` AM daycare `emp_1`。レスポンス例:

```json
{
  "date": "2026-04-01",
  "slot": "AM",
  "department": "daycare",
  "employee_id": "emp_123"
}
```

---

## 既存シフトの扱い（MVP）

- **完全上書き。** 対象月のシフトを `DELETE` したうえで新規生成結果を `INSERT`。差分生成はアルゴリズムが複雑になるため行わず、これが一番安全。

---

## 制約ルール（数学的表現）

**デイサービス:** `∀ slot: daycare_staff >= 4`

**訪問介護:** `AM visit >= 1`, `PM visit >= 1`

**半日兼務:** 同じ日に部門を跨ぐ人数 >= 2。  
つまり「AM daycare & PM visit」または「AM visit & PM daycare」のパターンを満たす人数が 2 人以上。兼務可能なのは `employee.can_visit = true` のみ。

**希望休:** 申請日は勤務不可。ハード制約。

**曜日制約:** `employee.available_days`（availability_rules）に従う。

---

## 週の定義（max_weekly_days）

**今は厳密に決めなくてよい。** 理由は二つ。

1. **max_weekly_days は Soft 制約**だから。「なるべく守る」程度のルールで、多少ずれてもシステムは壊れない。
2. **介護施設の実務では週の定義が施設ごとにバラバラ**（月〜日、日〜土、シフト開始日ベースなど）。どれが正しいかは施設ごとに違う。

**MVP では** 内部ロジックを **ISO week（月曜始まり）** とするだけで十分。つまり `week = Monday → Sunday`。将来、施設ごとに変えたい場合は **org_settings に week_start_day を追加**して拡張すればよい。**max_weekly_days の厳密仕様も後回し**でよい。

---

## Soft Constraints（希望）

- 勤務回数の均等化
- 連勤の最小化
- **max_consecutive_days / max_weekly_days:** Soft 制約とする（OR-Tools では**ペナルティ付き制約**）。Hard にすると解なしになりやすい。

---

## 解なし時の扱い

**不足枠のリスト**を返す。管理者が「どこが足りないか」を即理解できる形式。

```json
{
  "status": "infeasible",
  "missing_slots": [
    {
      "date": "2026-04-12",
      "slot": "PM",
      "department": "visit",
      "required": 1,
      "assigned": 0
    }
  ]
}
```

---

## OR-Tools モデル設計（難所）

このプロジェクトの難易度を決めるのはフロントでも認証でも DB でもない。**シフト最適化アルゴリズム**が全体難易度の **70%** を占める。つまり本当のラスボスは **OR-Tools モデル**。

具体的には次の 3 つ。

- **decision variables** — 誰をいつどのスロットに割り当てるか
- **constraints** — 上記 Hard/Soft 制約の定式化
- **objective function** — Soft 制約の重みづけ・最小化/最大化

ここを設計できると、Shiftora は単なるアプリではなく **「最適化エンジン付き SaaS」** になる。数学・アルゴリズム・現場業務が交差する、エンジニアリングの中でもかなり知的な領域。
