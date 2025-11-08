import asyncio
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.auth import router as auth_router
from app.routes import router as api_router
from app.routes import jobs, tasks, workers,system
from app.database import SessionLocal
from app.models import Job, JobStatus
from app.redis_client import redis_client
from app.routes import alerts


app = FastAPI(title="TaskFlow Cloud API", version="1.0")

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Routers
# -----------------------------
app.include_router(api_router)
app.include_router(auth_router)
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(tasks.router,prefix="/tasks", tags=["Tasks"])
app.include_router(workers.router, prefix="/workers", tags=["Workers"])
app.include_router(system.router)
app.include_router(alerts.router)

# -----------------------------
# Redis Queue
# -----------------------------
QUEUE_KEY = "taskflow:job_queue"
worker_task = None

# -----------------------------
# FastAPI Startup / Shutdown
# -----------------------------
@app.on_event("startup")
async def on_startup():
    global worker_task
    print("🚀 FastAPI app starting...")

    # 🧹 1️⃣ Clear old cron locks (avoid duplicate schedules after restart)
    try:
        keys = await redis_client.keys("cron_lock:*")
        if keys:
            await redis_client.delete(*keys)
            print(f"🧹 Cleared {len(keys)} stale cron lock(s)")
    except Exception as e:
        print(f"⚠️ Failed to clear cron locks: {e}")

    # 🧹 2️⃣ Cancel any orphaned async tasks from previous run
    for name, task in list(workers.active_cron_jobs.items()):
        if not task.done():
            task.cancel()
            print(f"💀 Stopped orphan cron task: {name}")
        workers.active_cron_jobs.pop(name, None)

    # 🚀 3️⃣ Start background worker if enabled
    if settings.RUN_WORKER:
        print("🧠 RUN_WORKER=True → Starting background worker automatically")
        worker_task = asyncio.create_task(workers.worker_loop("default_worker"))
        asyncio.create_task(workers.worker_heartbeat("default_worker"))
    else:
        print("⚙️ RUN_WORKER=False → Worker disabled (API-only mode)")


@app.on_event("shutdown")
async def on_shutdown():
    global worker_task
    print("🛑 Shutting down worker...")
    if worker_task:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass
