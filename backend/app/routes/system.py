# app/routes/system.py
from fastapi import APIRouter, Depends
import psutil
from app.auth import verify_api_key

router = APIRouter()

@router.get("/metrics")
def get_system_metrics(api_key: bool = Depends(verify_api_key)):
    cpu = psutil.cpu_percent(interval=0.5)
    memory = psutil.virtual_memory().percent
    return {
        "cpu_percent": cpu,
        "memory_percent": memory
    }
