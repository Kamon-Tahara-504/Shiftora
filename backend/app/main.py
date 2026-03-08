import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

from app.config import get_settings
from app.db import get_supabase
from app.auth.router import router as auth_router
from app.error_handling import register_handlers
from app.org.router import router as org_router
from app.staff.router import router as staff_router

# プロジェクトルートの .env を読む（backend/app/main.py から見て ../../.env）
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)

app = FastAPI(title="Shiftora API", version="0.1.0")
register_handlers(app)
app.include_router(auth_router)
app.include_router(org_router)
app.include_router(staff_router)


@app.get("/health")
def health():
    """起動確認。Supabase 未設定でも 200 を返す。"""
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    """Supabase 接続確認。設定済みならクライアント取得までを返す（テーブルは 1.3 で作成）。"""
    settings = get_settings()
    if not settings.supabase_configured():
        return {"status": "skipped", "message": "Supabase not configured"}
    client = get_supabase()
    if client is None:
        return {"status": "error", "message": "Supabase client could not be created"}
    return {"status": "ok", "db": "client_ok"}
