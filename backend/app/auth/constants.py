"""認証まわりの定数。API レスポンス・エラーコード・トークン種別を一元管理。"""
# トークン種別（JWT payload の type）
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"

# レスポンス
TOKEN_TYPE_BEARER = "bearer"

# 組織ロール（docs/03-roles-and-usecases.md）
ROLE_ORG_ADMIN = "org_admin"
ROLE_STAFF = "staff"

# システムロール（docs/03-roles-and-usecases.md）
SYSTEM_ROLE_SUPER_ADMIN = "super_admin"
SYSTEM_ROLE_SUPPORT_ADMIN = "support_admin"
SYSTEM_ROLE_BILLING_ADMIN = "billing_admin"
SYSTEM_ROLES: tuple[str, ...] = (
    SYSTEM_ROLE_SUPER_ADMIN,
    SYSTEM_ROLE_SUPPORT_ADMIN,
    SYSTEM_ROLE_BILLING_ADMIN,
)

# エラーコード（docs/08-api.md の形式に合わせる）
CODE_VALIDATION_ERROR = "validation_error"
CODE_INVALID_CREDENTIALS = "invalid_credentials"
CODE_INVALID_TOKEN = "invalid_token"
CODE_AUTH_NOT_CONFIGURED = "auth_not_configured"
CODE_FORBIDDEN = "forbidden"
