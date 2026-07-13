"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend database connection logic.
Talha: Do not modify database runtime logic unless coordinating AI compile outputs.
"""

import os
import socket
import urllib.parse
from contextlib import asynccontextmanager
from typing import Any


class DatabaseNotConfigured(RuntimeError):
    pass


def _resolve_url_host(url: str) -> str:
    """
    Resolve the hostname in a Postgres URL to a raw IP address using the
    synchronous socket resolver, bypassing asyncio's DNS resolver which
    fails intermittently on Windows (ProactorEventLoop getaddrinfo bug).
    """
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.hostname:
            ip = socket.gethostbyname(parsed.hostname)
            new_netloc = parsed.netloc.replace(parsed.hostname, ip)
            return parsed._replace(netloc=new_netloc).geturl()
    except Exception:
        pass
    return url


class Database:
    def __init__(self) -> None:
        # Do NOT resolve the URL here — this runs at import time, before
        # dotenv has loaded DATABASE_URL into os.environ.
        pass

    async def pool(self) -> Any:
        """
        Compatibility shim: returns a context-manager-like object whose
        .acquire() yields a fresh asyncpg connection per call.

        Supabase uses PgBouncer on port 6543 in transaction mode, which is
        incompatible with asyncpg's internal connection pool (connections get
        reclaimed by PgBouncer and asyncpg doesn't detect the dead handle).
        Creating a fresh connection per request is the correct pattern here.
        """
        raw_url = os.getenv("DATABASE_URL")
        if not raw_url:
            raise DatabaseNotConfigured("DATABASE_URL is not configured.")
        # Resolve hostname → IP synchronously to avoid the asyncio
        # ProactorEventLoop getaddrinfo failure on Windows.
        resolved_url = _resolve_url_host(raw_url)
        return _ConnectionFactory(resolved_url)


class _ConnectionFactory:
    """Mimics asyncpg Pool.acquire() so callers need no changes."""

    def __init__(self, url: str) -> None:
        self._url = url

    @asynccontextmanager
    async def acquire(self):
        import asyncpg
        conn = await asyncpg.connect(self._url, statement_cache_size=0)
        try:
            yield conn
        finally:
            await conn.close()


database = Database()

