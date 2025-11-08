from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
import asyncio, json, aiohttp
from typing import Optional
import random

from app.database import SessionLocal, get_db
from app.models import Job, JobStatus, Worker,Task
from app.redis_client import redis_client
from app.auth import verify_api_key
from app.utils.alerts import send_slack_alert, send_email_alert

router = APIRouter(tags=["Workers"])

QUEUE_KEY = {
    "high":"taskflow:queue:high",
    "medium":"taskflow:queue:medium",
    "low":"taskflow:queue:low",
}
DEAD_LETTER_KEY = "taskflow:dead_letter"

MAX_RETRIES = 3
BACKOFF_BASE = 2  # exponential backoff base
active_cron_jobs: dict[str, asyncio.Task] = {}


# Keep references to running worker tasks
running_workers: dict[str, asyncio.Task] = {}


# -------------------------------------------------------
# 📡 Worker Endpoints
# -------------------------------------------------------

@router.get("/")
def list_workers(db: Session = Depends(get_db), api_key: bool = Depends(verify_api_key)):
    """List all registered workers."""
    workers = db.query(Worker).all()
    return workers


@router.post("/restart")
async def restart_worker(api_key: bool = Depends(verify_api_key)):
    """Restart the worker loop."""
    global running_workers

    # Cancel existing workers
    for name, task in list(running_workers.items()):
        if not task.done():
            task.cancel()
        running_workers.pop(name, None)

    # Start fresh worker
    asyncio.create_task(worker_loop("default_worker"))
    return {"message": "🔁 Worker restarted successfully"}


@router.post("/scale")
async def scale_workers(count: int, api_key: bool = Depends(verify_api_key)):
    """Scale the number of worker processes (simulated async tasks)."""
    global running_workers
    if count < 1 or count > 5:
        raise HTTPException(status_code=400, detail="Worker count must be between 1–5")

    # Cancel existing
    for name, task in list(running_workers.items()):
        if not task.done():
            task.cancel()

    running_workers.clear()

    # Start new workers
    for i in range(count):
        name = f"worker-{i+1}"
        running_workers[name] = asyncio.create_task(worker_loop(name))
        print(f"🚀 Scaled up → {name} started")

    return {"message": f"✅ Scaled to {count} worker(s)"}

@router.get("/alerts/summary")
def get_alert_summary(db: Session = Depends(get_db)):
    total_dlq = db.query(Job).filter(Job.status == JobStatus.failed).count()
    active_workers = db.query(Worker).filter(Worker.status != "offline").count()
    return {
        "dlq_jobs": total_dlq,
        "workers_online": active_workers,
        "alert": total_dlq > 10 or active_workers == 0
    }


# -------------------------------------------------------
# 🧠 Worker Logic
# -------------------------------------------------------

async def worker_loop(worker_name="default_worker"):
    """Continuously pull and process jobs from Redis queue."""
    db = SessionLocal()

    # Register or update worker in DB
    worker = db.query(Worker).filter(Worker.name == worker_name).first()
    if not worker:
        worker = Worker(name=worker_name, status="idle")
        db.add(worker)
        db.commit()
        db.refresh(worker)

    print(f"👷 {worker_name} started and ready for jobs...")

    # Start heartbeat background task
    asyncio.create_task(worker_heartbeat(worker_name))

    try:
        while True:
            job_data = None
            for priority in ["high", "medium", "low"]:
                key = QUEUE_KEY[priority]
                job_data = await redis_client.brpop(key, timeout=5)
                if job_data:
                    break

            if not job_data:
                worker.status = "idle"
                worker.current_job = None
                db.commit()
                await asyncio.sleep(1)
                continue

            try:
                _, payload = job_data
                job = json.loads(payload)
            except Exception as e:
                print(f"⚠️ Invalid job payload: {e}")
                continue

            worker.status = "active"
            worker.current_job = job.get("task","unknown_task")
            db.commit()

            if job.get('cron'):
                task_name = job.get("task")
                if task_name not in active_cron_jobs:
                    cron_task = asyncio.create_task(schedule_cron_job(job))
                    active_cron_jobs[task_name] = cron_task
                    print(f"🕒 Started cron scheduler for {task_name}")
            try:
                await process_job(job)
            except Exception as e:
                print(f"❌ Job failed: {e}")

            worker.status = "idle"
            worker.current_job = None
            db.commit()
            await asyncio.sleep(0.2)

    except asyncio.CancelledError:
        print(f"🛑 {worker_name} stopped manually.")
        
    except Exception as e:
        print(f"⚠️ Worker {worker_name} error: {e}")
    finally:
        worker.status = "offline"
        db.commit()
        db.close()

async def worker_heartbeat(worker_name: str):
    """Periodically update worker heartbeat."""
    db = SessionLocal()
    try:
        while True:
            worker = db.query(Worker).filter(Worker.name == worker_name).first()
            if worker:
                worker.last_heartbeat = datetime.utcnow()
                worker.uptime = (worker.uptime or 0) + 15
                db.commit()
            await asyncio.sleep(15)
    except asyncio.CancelledError:
        print(f"💀 Heartbeat stopped for {worker_name}")
    finally:
        db.close()

async def process_job(job_data: dict):
    """Process a job (with retries, DLQ, and optional webhook callback)."""
    db = SessionLocal()
    job = db.query(Job).filter(Job.id == job_data["id"]).first()
    if not job:
        db.close()
        return

    job.status = JobStatus.processing
    db.commit()

    try:
        append_log(db, job, f"Started task: {job.task}")
        await asyncio.sleep(2)

        # Simulated failure (for testing)
        if "fail" in job.task.lower():
            raise ValueError("Simulated task failure")

        # ✅ Success path
        job.status = JobStatus.completed
        job.result = f"✅ Task '{job.task}' completed successfully"
        append_log(db, job, job.result)
        print(job.result)

        # Optional webhook callback
        callback_url = job_data.get("callback_url")
        if callback_url:
            async with aiohttp.ClientSession() as session:
                try:
                    await session.post(
                        callback_url,
                        json={"job_id": job.id, "status": job.status.value},
                        timeout=5,
                    )
                    append_log(db, job, f"📡 Webhook sent → {callback_url}")
                except Exception as e:
                    append_log(db, job, f"⚠️ Webhook failed: {e}")
        # Record this job’s type in Task table
        task = db.query(Task).filter(Task.name == job.task).first()
        if not task:
            task = Task(name=job.task, type="system", status="active", last_run=datetime.utcnow())
            db.add(task)
        else:
            task.last_run = datetime.utcnow()
            task.status = "active"

    except Exception as e:
        # ❌ Failure path
        job.retries += 1
        job.status = JobStatus.failed
        job.result = f"❌ Error: {str(e)}"
        append_log(db, job, job.result)
        print(job.result)

        if job.retries < MAX_RETRIES:
            # Retry with exponential backoff
            delay = BACKOFF_BASE ** job.retries
            append_log(db, job, f"Retrying in {delay}s (attempt {job.retries}/{MAX_RETRIES})")
            await asyncio.sleep(delay)
            priority = job_data.get("priority", "medium")
            await redis_client.lpush(f"taskflow:queue:{priority}", json.dumps(job_data))
        else:
            # Move to Dead Letter Queue and alert
            append_log(db, job, "Moved to Dead Letter Queue")
            await redis_client.lpush(DEAD_LETTER_KEY, json.dumps(job_data))

            await send_slack_alert(f"💀 Job {job.id} moved to DLQ after {job.retries} attempts.")
            send_email_alert(
                subject="Job moved to DLQ",
                body=f"Job {job.id} ({job.task}) failed permanently.\nCheck DLQ for details.",
            )

    finally:
        db.commit()
        db.close()

async def schedule_cron_job(job_data: dict):
    """Run a persistent cron schedule for a job — only one instance per task."""
    task_name = job_data.get("task")
    interval = int(job_data.get("cron", 0))

    if not interval or not task_name:
        print(f"⚠️ Invalid cron setup for job: {job_data}")
        return

    try:
        while True:
            await asyncio.sleep(interval)
            print(f"🔁 Re-running cron job {task_name} every {interval}s")

            lock_key = f"cron_lock:{task_name}"
            if await redis_client.get(lock_key):
                # Skip this iteration (job still running)
                continue

            # Add small jitter and longer expiration for safety
            await redis_client.set(lock_key, "1", ex=interval + 2)
            await asyncio.sleep(random.uniform(0, 0.5))

            queue_key = f"taskflow:queue:{job_data.get('priority', 'medium')}"
            await redis_client.lpush(queue_key, json.dumps(job_data))
    except asyncio.CancelledError:
        print(f"🛑 Cron loop stopped for {task_name}")
    except Exception as e:
        print(f"⚠️ Cron error for {task_name}: {e}")
    finally:
        active_cron_jobs.pop(task_name, None)


def append_log(db: Session, job: Job, message: str):
    """Append a log line with timestamp."""
    timestamp = datetime.utcnow().strftime("%H:%M:%S")
    job.logs += f"[{timestamp}] {message}\n"
    db.commit()