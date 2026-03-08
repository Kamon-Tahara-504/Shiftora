"""
グローバル例外ハンドラとエラー応答形式の統一（docs/08-api.md, docs/09-non-functional.md）。
未処理例外は 500 で標準形式を返し、ログに記録する。
"""
import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.auth.constants import CODE_INTERNAL_ERROR, CODE_VALIDATION_ERROR

logger = logging.getLogger(__name__)


def _standard_body(code: str, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    """docs/08 のエラー形式 { code, message, details } を返す。"""
    return {"code": code, "message": message, "details": details or {}}


def _validation_error_body(err: RequestValidationError) -> dict[str, Any]:
    """Pydantic バリデーションエラーを標準形式に変換。"""
    errors = err.errors()
    return _standard_body(
        CODE_VALIDATION_ERROR,
        "Validation error",
        {"errors": errors},
    )


def _http_exception_body(detail: Any, status_code: int) -> dict[str, Any]:
    """HTTPException の detail が辞書でなければ標準形式にラップする。"""
    if isinstance(detail, dict) and "code" in detail and "message" in detail:
        return {
            "code": detail["code"],
            "message": detail["message"],
            "details": detail.get("details") or {},
        }
    return _standard_body(
        CODE_INTERNAL_ERROR if status_code >= 500 else "error",
        str(detail) if detail else "Error",
    )


async def _validation_exception_handler(
    _request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """422: リクエストバリデーションエラー。標準形式で返す。"""
    body = _validation_error_body(exc)
    logger.warning("Validation error: %s", body)
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=body)


async def _http_exception_handler(
    _request: Request,
    exc: HTTPException,
) -> JSONResponse:
    """HTTPException: detail が辞書ならそのまま、そうでなければ標準形式にラップ。"""
    body = _http_exception_body(exc.detail, exc.status_code)
    if exc.status_code >= 500:
        logger.error("HTTP %s: %s", exc.status_code, body)
    return JSONResponse(status_code=exc.status_code, content=body)


async def _unhandled_exception_handler(
    _request: Request,
    exc: Exception,
) -> JSONResponse:
    """未処理例外: 500 を返し、スタックトレースをログに記録。クライアントには漏らさない。"""
    logger.exception("Unhandled exception: %s", exc)
    body = _standard_body(CODE_INTERNAL_ERROR, "Internal server error", {})
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=body)


def register_handlers(app: FastAPI) -> None:
    """FastAPI アプリにグローバル例外ハンドラを登録する。"""
    app.add_exception_handler(RequestValidationError, _validation_exception_handler)
    app.add_exception_handler(HTTPException, _http_exception_handler)
    app.add_exception_handler(Exception, _unhandled_exception_handler)
