from fastapi import APIRouter
from app.routes import jobs

router = APIRouter()
router.include_router(jobs.router)
