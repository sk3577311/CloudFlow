from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Job, Worker
from app.utils.alerts import send_slack_alert
from app.config import settings

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("/summary")
def get_alert_summary(db: Session = Depends(get_db)):
    """Return system health summary and trigger Slack alerts if needed."""
    total_dlq = db.query(Job).filter(Job.status == "failed").count()
    active_workers = db.query(Worker).filter(Worker.status != "offline").count()

    alert_active = total_dlq > 10 or active_workers == 0
    message = None

    if alert_active:
        message = f"🚨 System Alert!\nDLQ Jobs: {total_dlq}\nActive Workers: {active_workers}"
        # Slack alert (non-blocking)
        import asyncio
        asyncio.create_task(send_slack_alert(message))

    return {
        "dlq_jobs": total_dlq,
        "workers_online": active_workers,
        "alert_active": alert_active,
        "message": message,
    }
