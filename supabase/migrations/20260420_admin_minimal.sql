-- admin最小実装: service token管理 + 組織監査向け

CREATE INDEX IF NOT EXISTS idx_service_registration_tokens_purpose_active_created
  ON service_registration_tokens (purpose, is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

