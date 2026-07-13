"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend API orchestration.
Talha: Do not modify router composition unless coordinating backend integration.
"""

from fastapi import APIRouter

from backend.api.auth import auth_router
from backend.api.voice import router as voice_router
from backend.api.lessons import router as lessons_router
from backend.api.progress import router as progress_router
from backend.api.qna import router as qna_router

try:
    from backend.api.dashboard import router as dashboard_router
except ImportError:
    dashboard_router = None

try:
    from backend.api.srs import router as srs_router
except ImportError:
    srs_router = None

try:
    from backend.api.ops import router as ops_router
except ImportError:
    ops_router = None

router = APIRouter(prefix="/api")
router.include_router(auth_router)
router.include_router(lessons_router)
router.include_router(progress_router)
router.include_router(voice_router)
router.include_router(qna_router, prefix="/qna")

if dashboard_router:
    router.include_router(dashboard_router)

if srs_router:
    router.include_router(srs_router)

if ops_router:
    router.include_router(ops_router)
