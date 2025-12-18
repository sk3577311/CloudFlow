import asyncio
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.auth import router as auth_router
from app.routes import router as api_router
from app.routes import jobs, tasks, workers, system, realtime, alerts,intelligence_routes
from app.database import SessionLocal
from app.redis_client import redis_client
from app.routes.realtime import metrics_broadcaster
from app import intelligence
from app.routes.realtime import metrics_ws


app = FastAPI(title="TaskFlow Cloud API", version="1.0")
app.router.redirect_slashes = False


# -------------------------------------------------
# ✅ Proper CORS setup for WebSocket and REST
# -------------------------------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------
# Routers
# -------------------------------------------------
app.include_router(api_router)
app.include_router(auth_router)
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(workers.router, prefix="/workers", tags=["Workers"])
app.include_router(system.router, prefix="/system", tags=["System"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
app.include_router(realtime.router, tags=["Realtime"])
app.include_router(intelligence_routes.router)

# -------------------------------------------------
# Explicitly mount WebSocket route (fixes WS error)
# -------------------------------------------------
from app.routes.realtime import metrics_ws
app.add_api_websocket_route("/ws/metrics", metrics_ws)


# -------------------------------------------------
# Redis Queue
# -------------------------------------------------
QUEUE_KEY = "taskflow:job_queue"
worker_task = None


# -------------------------------------------------
# FastAPI Startup / Shutdown
# -------------------------------------------------
@app.on_event("startup")
async def on_startup():
    global worker_task
    print("🚀 FastAPI app starting...")

    # 🧹 Clear stale cron locks
    try:
        keys = await redis_client.keys("cron_lock:*")
        if keys:
            await redis_client.delete(*keys)
            print(f"🧹 Cleared {len(keys)} stale cron lock(s)")
    except Exception as e:
        print(f"⚠️ Failed to clear cron locks: {e}")

    # 💀 Stop orphan cron jobs
    for name, task in list(workers.active_cron_jobs.items()):
        if not task.done():
            task.cancel()
            print(f"💀 Stopped orphan cron task: {name}")
        workers.active_cron_jobs.pop(name, None)

    # 🧠 Start background tasks
    asyncio.create_task(metrics_broadcaster())
    asyncio.create_task(intelligence.intelligence_loop(interval=5.0))

    # 🚀 Start background worker if enabled
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
