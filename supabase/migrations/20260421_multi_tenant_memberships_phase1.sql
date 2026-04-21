-- Multi-tenant Phase 1: membership table + legacy backfill (non-breaking)
-- Goal:
-- - Keep existing users.organization_id / users.role behavior
-- - Add a future-proof relation that allows one user to join multiple orgs

CREATE TABLE IF NOT EXISTS organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('org_admin', 'staff')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'left')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_memberships_user_status
  ON organization_memberships(user_id, status);

CREATE INDEX IF NOT EXISTS idx_org_memberships_org_status
  ON organization_memberships(organization_id, status);

-- A user can have only one default membership at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_memberships_default_per_user
  ON organization_memberships(user_id)
  WHERE is_default = true;

-- Backfill from legacy users table.
-- Existing runtime still reads users.organization_id and users.role, so this is additive.
INSERT INTO organization_memberships (
  organization_id,
  user_id,
  role,
  status,
  is_default
)
SELECT
  u.organization_id,
  u.id,
  u.role,
  'active',
  true
FROM users u
WHERE u.organization_id IS NOT NULL
  AND u.role IN ('org_admin', 'staff')
ON CONFLICT (organization_id, user_id) DO NOTHING;

