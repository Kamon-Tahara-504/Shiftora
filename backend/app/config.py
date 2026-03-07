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

    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)

    def jwt_configured(self) -> bool:
        return bool(self.jwt_secret_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
