# app/routes/realtime.py
import json
import psutil, os
import asyncio, time
from fastapi import APIRouter, WebSocket, Depends
from sqlalchemy.orm import Session
from app.ws_manager import ws_manager
from app.redis_client import redis_client
from app.database import SessionLocal, get_db
from app.models import Job, Worker, AuditLog
from app.auth import verify_api_key


router = APIRouter()

BROADCAST_INTERVAL = float(os.getenv("METRICS_BROADCAST_INTERVAL", "3"))  # seconds



@router.websocket("/ws/metrics")
async def metrics_ws(websocket: WebSocket):
    """
    Simple WS endpoint for pushing metrics to dashboard clients.
    No auth here for simplicity — pass JWT in query param and validate if you need to.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive — client may not send data
            data = await websocket.receive_text()  # client can ping
            # optionally respond to ping
            # echo or ignore
            await websocket.send_text('{"pong": true}')
    except Exception:
        pass
    finally:
        await ws_manager.disconnect(websocket)

@router.post("/auto-heal")
async def auto_heal(db: Session = Depends(get_db), api_key: bool = Depends(verify_api_key)):
    """
    Auto-heal action:x
    - Restart worker loop(s) in DB by marking them idle and returning instruction to admin
    - (Optional) move small amount of DLQ back to queue, or restart processes via systemctl / docker API (not included)
    """
    # safety: only allow small fixes via API (no destructive actions)
    workers = db.query(Worker).all()
    for w in workers:
        if w.status == "offline":
            w.status = "idle"
    db.commit()
     # add audit log entry
    db.add(AuditLog(event="Auto-heal triggered", meta={"workers_reset": True}))
    db.commit()
    # send admin alert via Slack
    from app.utils.alerts import send_slack_alert
    await send_slack_alert("Auto-heal triggered: restarted worker statuses to idle (DB flags).")
    return {"message": "Auto-heal triggered (workers marked idle)."}

async def build_metrics_payload():
    """Collect metrics snapshot (similar to /metrics)"""
    payload = {}
    try:
        cpu = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory().percent
        payload["cpu"] = cpu
        payload["memory"] = memory
    except Exception as e:
        payload["cpu"] = None
        payload["memory"] = None

    # redis queues
    try:
        payload["queues"] = {
            "high": await redis_client.llen("taskflow:queue:high"),
            "medium": await redis_client.llen("taskflow:queue:medium"),
            "low": await redis_client.llen("taskflow:queue:low"),
            "dead_letter": await redis_client.llen("taskflow:dead_letter"),
        }
    except Exception:
        payload["queues"] = {}

    # DB derived stats (quick)
    db = SessionLocal()
    try:
        payload["workers"] = {
            "total": db.query(Worker).count(),
            "active": db.query(Worker).filter(Worker.status == "active").count(),
            "idle": db.query(Worker).filter(Worker.status == "idle").count(),
        }
        payload["failed_jobs"] = db.query(Job).filter(Job.status == "failed").count()
    except Exception:
        payload["workers"] = {}
        payload["failed_jobs"] = None
    finally:
        db.close()

    payload["ts"] = int(time.time() * 1000)
    return payload

async def metrics_broadcaster():
    """Run in background sending metrics to connected WS clients"""
    while True:
        try:
            payload = await build_metrics_payload()
            await ws_manager.broadcast({"type": "metrics", "data": payload})
            # push JSON string and trim to last 200
            await redis_client.lpush("taskflow:metrics", json.dumps(payload))
            await redis_client.ltrim("taskflow:metrics", 0, 199)
        except Exception as e:
            print("Broadcaster error:", e)
        await asyncio.sleep(BROADCAST_INTERVAL)


