"""Auth endpoints 向けのシンプルな in-memory レート制限。"""
from __future__ import annotations

import logging
import threading
import time
from collections import deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings

logger = logging.getLogger(__name__)

AUTH_RATE_LIMIT_PATHS = {
    "/auth/login",
    "/auth/refresh",
    "/auth/signup",
    "/auth/register-org",
}


class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    """認証系POSTに対してIP+path単位で固定窓制限を適用する。"""

    def __init__(self, app):
        super().__init__(app)
        self._lock = threading.Lock()
        self._buckets: dict[str, deque[float]] = {}

    def _client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client:
            return request.client.host
        return "unknown"

    async def dispatch(self, request: Request, call_next):
        if request.method != "POST" or request.url.path not in AUTH_RATE_LIMIT_PATHS:
            return await call_next(request)

        settings = get_settings()
        window = max(1, settings.auth_rate_limit_window_seconds)
        limit = max(1, settings.auth_rate_limit_max_requests)
        now = time.time()

        key = f"{self._client_ip(request)}:{request.url.path}"
        with self._lock:
            bucket = self._buckets.get(key)
            if bucket is None:
                bucket = deque()
                self._buckets[key] = bucket

            while bucket and now - bucket[0] >= window:
                bucket.popleft()

            if len(bucket) >= limit:
                retry_after = max(1, int(window - (now - bucket[0])))
                logger.warning("auth_rate_limited path=%s key=%s", request.url.path, key)
                return JSONResponse(
                    status_code=429,
                    content={
                        "code": "rate_limited",
                        "message": "Too many requests",
                        "details": {},
                    },
                    headers={"Retry-After": str(retry_after)},
                )

            bucket.append(now)

        return await call_next(request)
