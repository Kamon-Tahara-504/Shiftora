"""環境変数・設定。pydantic-settings で .env を読み込む。"""
from functools import lru_cache
from pathlib import Path

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

    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
