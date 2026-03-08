"""環境変数・設定。pydantic-settings で .env を読み込む。"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase（環境変数 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY）
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # JWT（環境変数 JWT_SECRET_KEY, JWT_ACCESS_EXPIRE_MINUTES, JWT_REFRESH_EXPIRE_DAYS）
    jwt_secret_key: str = ""
    jwt_access_expire_minutes: int = 15
    jwt_refresh_expire_days: int = 7

    # CORS（フロント開発用。環境変数 CORS_ORIGINS をカンマ区切りで指定）
    cors_origins: str = ""

    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)

    def jwt_configured(self) -> bool:
        return bool(self.jwt_secret_key)

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS 許可オリジン（空文字は空リスト）。"""
        if not self.cors_origins.strip():
            return []
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
