from fastapi import APIRouter, Depends
import psutil, os, time, asyncio
from sqlalchemy.orm import Session
from app.database import get_db
from app.redis_client import redis_client
from app.models import Job, Worker

router = APIRouter()

# Track backend startup time
START_TIME = time.time()


@router.get("/metrics")
async def system_metrics(db: Session = Depends(get_db)):
    """Return live backend metrics for dashboard charts."""
    cpu_percent = psutil.cpu_percent(interval=None)
    memory_percent = psutil.virtual_memory().percent

    try:
        high_q = await redis_client.llen("taskflow:queue:high")
        med_q = await redis_client.llen("taskflow:queue:medium")
        low_q = await redis_client.llen("taskflow:queue:low")
        dlq_q = await redis_client.llen("taskflow:dead_letter")
    except Exception as e:
        high_q = med_q = low_q = dlq_q = -1
        print(f"⚠️ Redis metric error: {e}")

    total_workers = db.query(Worker).count()
    active_workers = db.query(Worker).filter(Worker.status == "active").count()
    idle_workers = db.query(Worker).filter(Worker.status == "idle").count()
    failed_jobs = db.query(Job).filter(Job.status == "failed").count()

    return {
        "cpu_percent": cpu_percent,
        "memory_percent": memory_percent,
        "queues": {
            "high": high_q,
            "medium": med_q,
            "low": low_q,
            "dead_letter": dlq_q,
        },
        "workers": {
            "total": total_workers,
            "active": active_workers,
            "idle": idle_workers,
        },
        "failed_jobs": failed_jobs,
    }


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Comprehensive system health check."""
    status = {
        "backend": "ok",
        "postgres": {"status": "unknown", "latency_ms": None},
        "redis": {"status": "unknown", "latency_ms": None},
    }

    # ✅ PostgreSQL Health + Latency
    try:
        start = time.perf_counter()
        db.execute("SELECT 1")
        latency = (time.perf_counter() - start) * 1000
        status["postgres"] = {"status": "ok", "latency_ms": round(latency, 2)}
    except Exception as e:
        status["postgres"] = {"status": f"error: {str(e)}", "latency_ms": None}

    # ✅ Redis Health + Latency
    try:
        start = time.perf_counter()
        pong = await redis_client.ping()
        latency = (time.perf_counter() - start) * 1000
        status["redis"] = {
            "status": "ok" if pong else "no response",
            "latency_ms": round(latency, 2),
        }
    except Exception as e:
        status["redis"] = {"status": f"error: {str(e)}", "latency_ms": None}

    # ✅ System uptime
    uptime_seconds = round(time.time() - START_TIME)

    return {
        "status": status,
        "uptime_seconds": uptime_seconds,
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "environment": os.getenv("ENVIRONMENT", "development"),
    }
