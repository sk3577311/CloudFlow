from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
import asyncio, json, aiohttp
from typing import Optional

from app.database import SessionLocal, get_db
from app.models import Job, JobStatus, Worker
from app.redis_client import redis_client
from app.auth import verify_api_key

router = APIRouter(tags=["Workers"])

QUEUE_KEY = "taskflow:job_queue"
DEAD_LETTER_KEY = "taskflow:dead_letter"

MAX_RETRIES = 3
BACKOFF_BASE = 2  # exponential backoff base

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
            job_data = await redis_client.brpop(QUEUE_KEY, timeout=5)
            if not job_data:
                worker.status = "idle"
                db.commit()
                await asyncio.sleep(1)
                continue

            _, payload = job_data
            job = json.loads(payload)
            worker.status = "active"
            worker.current_job = job.get("task")
            db.commit()

            await process_job(job)

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
    """Process a job (with retries and optional webhook callback)."""
    db = SessionLocal()
    job = db.query(Job).filter(Job.id == job_data["id"]).first()
    if not job:
        db.close()
        return

    job.status = JobStatus.processing
    db.commit()

    try:
        print(f"⚙️ Running job {job.id}: {job.task}")
        await asyncio.sleep(2)

        # Simulate failure
        if "fail" in job.task.lower():
            raise ValueError("Simulated task failure")

        job.status = JobStatus.completed
        print(f"✅ Job {job.id} completed successfully")

        # Optional webhook callback
        if "callback_url" in job_data and job_data["callback_url"]:
            callback_url = job_data["callback_url"]
            async with aiohttp.ClientSession() as session:
                try:
                    await session.post(
                        callback_url,
                        json={"job_id": job.id, "status": job.status.value},
                        timeout=5,
                    )
                    print(f"📡 Webhook sent → {callback_url}")
                except Exception as e:
                    print(f"⚠️ Webhook failed for {job.id}: {e}")

    except Exception as e:
        job.retries += 1
        print(f"❌ Job {job.id} failed ({job.retries}/{MAX_RETRIES}): {e}")
        if job.retries < MAX_RETRIES:
            delay = BACKOFF_BASE ** job.retries
            await asyncio.sleep(delay)
            await redis_client.lpush(QUEUE_KEY, json.dumps(job_data))
        else:
            job.status = JobStatus.failed
            await redis_client.lpush(DEAD_LETTER_KEY, json.dumps(job_data))
    finally:
        db.commit()
        db.close()
