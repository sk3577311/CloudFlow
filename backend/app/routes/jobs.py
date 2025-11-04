from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
import json, asyncio, uuid
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Job, JobStatus, User
from app.schemas import JobCreate, JobResponse
from app.redis_client import redis_client
from app.auth import verify_api_key, get_current_user_optional

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
    api_key: bool = Depends(verify_api_key),
):
    new_job = Job(task=job.task, status=JobStatus.queued)
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    job_data = {
        "id": new_job.id,
        "task": job.task,
        "payload": job.payload,
    }

    if job.delay:
        from datetime import datetime, timedelta
        job_data["delay_until"] = (datetime.utcnow() + timedelta(seconds=job.delay)).isoformat()

    if job.cron:
        job_data["cron"] = job.cron

    if job.callback_url:
        job_data["callback_url"] = job.callback_url

    await redis_client.lpush("taskflow:job_queue", json.dumps(job_data))

    # ✅ Return object matching JobResponse
    return new_job
# -----------------------------
# LIST JOBS
# -----------------------------
@router.get("/", response_model=List[JobResponse])
def list_jobs(db: Session = Depends(get_db), api_key: bool = Depends(verify_api_key)):
    return db.query(Job).order_by(Job.created_at.desc()).all()

# -----------------------------
# GET JOB
# -----------------------------
@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db), api_key: bool = Depends(verify_api_key)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# -----------------------------
# RETRY FAILED JOBS
# -----------------------------
@router.post("/retry-failed")
async def retry_failed_jobs(db: Session = Depends(get_db), api_key: bool = Depends(verify_api_key)):
    failed_jobs = db.query(Job).filter(Job.status == JobStatus.failed).all()
    if not failed_jobs:
        return {"message": "No failed jobs to retry"}

    for job in failed_jobs:
        job.status = JobStatus.queued
        job.retries = 0
        db.commit()
        await redis_client.lpush(QUEUE_KEY, json.dumps({"id": job.id, "task": job.task}))

    return {"message": f"Retried {len(failed_jobs)} failed jobs"}


# -------------------------------------------------
# Get all jobs from Dead Letter Queue (Redis)
# -------------------------------------------------
@router.get("/dead-letter")
async def get_dead_letter_jobs(api_key: bool = Depends(verify_api_key)):
    dead_jobs = await redis_client.lrange(DEAD_LETTER_KEY, 0, -1)
    parsed = [json.loads(j) for j in dead_jobs]
    return {"count": len(parsed), "jobs": parsed}

# -----------------------------
# DELETE / CLEANUP
# -----------------------------
@router.delete("/cleanup")
async def cleanup_jobs(db: Session = Depends(get_db), api_key: bool = Depends(verify_api_key)):
    db.query(Job).delete()
    db.commit()
    await redis_client.delete(QUEUE_KEY, DEAD_LETTER_KEY)
    return {"message": "All jobs cleared"}
