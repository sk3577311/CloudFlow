from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
import json
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Job, JobPriority, JobStatus
from app.schemas import JobCreate, JobResponse
from app.redis_client import redis_client
from app.auth import verify_api_key

router = APIRouter(prefix="/jobs", tags=["Jobs"])
QUEUE_KEY = "taskflow:job_queue"
DEAD_LETTER_KEY = "taskflow:dead_letter"

# -----------------------------
# CREATE JOB
# -----------------------------
@router.post("/", response_model=JobResponse)
async def create_job(
    job: JobCreate,
    db: Session = Depends(get_db),
    api_key=Depends(verify_api_key),
):
    priority = job.priority if isinstance(job.priority, JobPriority) else JobPriority(job.priority)
    new_job = Job(task=job.task, status=JobStatus.queued, priority=priority)
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    job_data = {
        "id": new_job.id,
        "task": job.task,
        "payload": job.payload,
        "priority": priority.value,
    }

    if job.delay:
        job_data["delay_until"] = (datetime.utcnow() + timedelta(seconds=job.delay)).isoformat()
    if job.cron:
        job_data["cron"] = job.cron
    if getattr(job, "callback_url", None):
        job_data["callback_url"] = job.callback_url

    await redis_client.lpush("taskflow:job_queue", json.dumps(job_data))
    print(f"🚀 Queued job {new_job.id} [{priority.value.upper()}]")

    return new_job


# -----------------------------
# LIST JOBS
# -----------------------------
@router.get("/", response_model=List[JobResponse])
def list_jobs(db: Session = Depends(get_db), api_key=Depends(verify_api_key)):
    return db.query(Job).order_by(Job.created_at.desc()).all()


# -------------------------------------------------
# DEAD LETTER QUEUE (✅ moved above job_id route)
# -------------------------------------------------
@router.get("/dead-letter", dependencies=[Depends(verify_api_key)])
async def get_dead_letter_jobs():
    dead_jobs = await redis_client.lrange(DEAD_LETTER_KEY, 0, -1)
    parsed = [json.loads(j) for j in dead_jobs]
    return {"count": len(parsed), "jobs": parsed}


# -----------------------------
# RETRY FAILED JOBS
# -----------------------------
@router.post("/retry-failed", dependencies=[Depends(verify_api_key)])
async def retry_failed_jobs(db: Session = Depends(get_db)):
    failed_jobs = db.query(Job).filter(Job.status == JobStatus.failed).all()
    if not failed_jobs:
        return {"message": "No failed jobs to retry"}

    for job in failed_jobs:
        job.status = JobStatus.queued
        job.retries = 0
        db.commit()
        await redis_client.lpush(QUEUE_KEY, json.dumps({"id": job.id, "task": job.task}))

    return {"message": f"Retried {len(failed_jobs)} failed jobs"}


# -----------------------------
# JOB LOGS
# -----------------------------
@router.get("/{job_id}/logs", response_model=dict)
def get_job_logs(job_id: int, db: Session = Depends(get_db), api_key=Depends(verify_api_key)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": job.id,
        "task": job.task,
        "status": job.status.value,
        "logs": job.logs,
        "result": job.result,
    }


# -----------------------------
# GET JOB
# -----------------------------
@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db), api_key=Depends(verify_api_key)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# -----------------------------
# CLEANUP
# -----------------------------
@router.delete("/cleanup", dependencies=[Depends(verify_api_key)])
async def cleanup_jobs(db: Session = Depends(get_db)):
    db.query(Job).delete()
    db.commit()
    await redis_client.delete(QUEUE_KEY, DEAD_LETTER_KEY)
    return {"message": "All jobs cleared"}
