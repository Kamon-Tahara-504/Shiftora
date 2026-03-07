-- Phase 1.3: Initial schema (docs/04-database.md)
-- Apply: Supabase CLI `supabase db push` or run in Dashboard SQL Editor

-- 1. organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. subscriptions (1:1 with organization)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan_type TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'canceled')),
  max_users INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. users (system user: organization_id NULL, role NULL | org user: organization_id NOT NULL, system_role NULL)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT CHECK (role IN ('org_admin', 'staff')),
  system_role TEXT CHECK (system_role IN ('super_admin', 'support_admin', 'billing_admin')),
  token_version INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_org_or_system CHECK (
    (organization_id IS NULL AND role IS NULL)
    OR (organization_id IS NOT NULL AND system_role IS NULL)
  )
);

-- 4. invitation_tokens
CREATE TABLE invitation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  employment_type TEXT,
  can_visit BOOLEAN NOT NULL DEFAULT false,
  fixed_holiday JSONB,
  max_consecutive_days INTEGER,
  max_weekly_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. availability_rules (weekday 0=Sun..6=Sat)
CREATE TABLE availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  available_morning BOOLEAN NOT NULL DEFAULT false,
  available_afternoon BOOLEAN NOT NULL DEFAULT false
);

-- 7. day_off_requests (unique per employee per date)
CREATE TABLE day_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  UNIQUE (employee_id, date)
);

-- 8. shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('daycare', 'visit')),
  slot TEXT NOT NULL CHECK (slot IN ('AM', 'PM')),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
);

-- 9. audit_logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
