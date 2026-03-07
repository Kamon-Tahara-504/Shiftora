"""認証まわりの定数。API レスポンス・エラーコード・トークン種別を一元管理。"""
# トークン種別（JWT payload の type）
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"

# レスポンス
TOKEN_TYPE_BEARER = "bearer"

# エラーコード（docs/08-api.md の形式に合わせる）
CODE_VALIDATION_ERROR = "validation_error"
CODE_INVALID_CREDENTIALS = "invalid_credentials"
CODE_INVALID_TOKEN = "invalid_token"
CODE_AUTH_NOT_CONFIGURED = "auth_not_configured"
