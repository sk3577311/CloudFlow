from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional,Dict
from enum import Enum


# -----------------------------
# USER SCHEMAS
# -----------------------------
class UserCreate(BaseModel):
    username: str
    password: str

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    username: str
    password: str

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime

    model_config = {"from_attributes": True}


# -----------------------------
# JOB SCHEMAS
# -----------------------------
class JobStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class JobBase(BaseModel):
    task: str
    owner_id: Optional[int] = None

    model_config = {"from_attributes": True}


class JobCreate(BaseModel):
    task: str
    payload: Optional[Dict] = None
    delay: Optional[int] = None   # seconds
    cron: Optional[str] = None    # simple interval (e.g. "60" for 60s)
    callback_url: Optional[str] = None

class JobResponse(BaseModel):
    id: int
    task: str
    status: str
    retries: Optional[int] = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -----------------------------
# TASK SCHEMAS
# -----------------------------
class TaskBase(BaseModel):
    name: str
    type: str
    status: str
    last_run: Optional[datetime] = None

    model_config = {"from_attributes": True}


# -----------------------------
# WORKER SCHEMAS
# -----------------------------
class WorkerBase(BaseModel):
    name: str
    status: str
    current_job: Optional[str] = None
    uptime: Optional[int] = 0
    last_heartbeat: Optional[datetime] = None

    model_config = {"from_attributes": True}
