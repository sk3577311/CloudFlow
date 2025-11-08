# backend/app/alerts.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Job, JobStatus
from app.auth import verify_api_key
from app.redis_client import redis_client
from app.config import settings

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# keys used in your worker/queue
DEAD_LETTER_KEY = "taskflow:dead_letter"

ALERT_DLQ_THRESHOLD = int(getattr(settings, "ALERT_DLQ_THRESHOLD", 5))
ALERT_FAILED_THRESHOLD = int(getattr(settings, "ALERT_FAILED_THRESHOLD", 10))

@router.get("/summary")
async def alerts_summary(db: Session = Depends(get_db), api_key: bool = Depends(verify_api_key)):
    """
    Return a small summary used by the frontend bell:
    {
      "active": bool,
      "failed_jobs": int,
      "dlq_count": int,
      "message": "..."
    }
    """
    # count currently failed jobs in DB
    failed_jobs = db.query(Job).filter(Job.status == JobStatus.failed).count()

    # dead-letter queue length in Redis (async)
    try:
        dlq_count = await redis_client.llen(DEAD_LETTER_KEY)
    except Exception:
        # if Redis unavailable, return conservative result
        dlq_count = 0

    active = False
    reasons = []
    if dlq_count >= ALERT_DLQ_THRESHOLD:
        active = True
        reasons.append(f"DLQ >= {ALERT_DLQ_THRESHOLD} ({dlq_count})")
    if failed_jobs >= ALERT_FAILED_THRESHOLD:
        active = True
        reasons.append(f"Failed jobs >= {ALERT_FAILED_THRESHOLD} ({failed_jobs})")

    message = " ; ".join(reasons) if reasons else "All clear"

    return {
        "active": active,
        "failed_jobs": failed_jobs,
        "dlq_count": dlq_count,
        "message": message,
    }
