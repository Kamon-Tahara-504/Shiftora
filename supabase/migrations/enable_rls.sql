-- Phase 4.1: RLS 有効化（docs/02-architecture.md, docs/09-non-functional.md）
-- テナント分離: current_setting('app.organization_id', true)::uuid と一致する行のみアクセス可。
-- バックエンドは service_role 利用時は RLS をバイパスする。将来 anon/authenticated 等で接続する場合は
-- リクエスト開始時に SET LOCAL app.organization_id = '<uuid>' を実行すること。

-- ヘルパー: 現在のコンテキストの組織 ID を返す（未設定時は NULL）
CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.organization_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- 1. organizations（自組織の行のみ SELECT/UPDATE/DELETE。INSERT はサービス層のみの想定でポリシーなし＝拒否）
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_tenant_select ON organizations
  FOR SELECT USING (id = public.current_organization_id());

CREATE POLICY organizations_tenant_update ON organizations
  FOR UPDATE USING (id = public.current_organization_id());

CREATE POLICY organizations_tenant_delete ON organizations
  FOR DELETE USING (id = public.current_organization_id());

-- 2. subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_tenant_all ON subscriptions
  FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

-- 3. users（organization_id が NULL のシステムユーザーは current_organization_id 未設定時は見えない）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_tenant_select ON users
  FOR SELECT USING (
    organization_id = public.current_organization_id()
    OR (organization_id IS NULL AND public.current_organization_id() IS NULL)
  );

CREATE POLICY users_tenant_insert ON users
  FOR INSERT WITH CHECK (
    organization_id = public.current_organization_id()
    OR (organization_id IS NULL AND public.current_organization_id() IS NULL)
  );

CREATE POLICY users_tenant_update ON users
  FOR UPDATE USING (
    organization_id = public.current_organization_id()
    OR (organization_id IS NULL AND public.current_organization_id() IS NULL)
  );

CREATE POLICY users_tenant_delete ON users
  FOR DELETE USING (
    organization_id = public.current_organization_id()
    OR (organization_id IS NULL AND public.current_organization_id() IS NULL)
  );

-- 4. invitation_tokens
ALTER TABLE invitation_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitation_tokens_tenant_all ON invitation_tokens
  FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

-- 5. employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY employees_tenant_all ON employees
  FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

-- 6. availability_rules（employees 経由で組織スコープ）
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY availability_rules_tenant_all ON availability_rules
  FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE organization_id = public.current_organization_id()
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE organization_id = public.current_organization_id()
    )
  );

-- 7. day_off_requests（employees 経由で組織スコープ）
ALTER TABLE day_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY day_off_requests_tenant_all ON day_off_requests
  FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE organization_id = public.current_organization_id()
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE organization_id = public.current_organization_id()
    )
  );

-- 8. shifts
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY shifts_tenant_all ON shifts
  FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

-- 9. audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_tenant_all ON audit_logs
  FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());
