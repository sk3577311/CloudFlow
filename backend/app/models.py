from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text,JSON,Float,func
from sqlalchemy.orm import relationship
from .database import Base
import enum

# -----------------------------
# JOB PRIORITY
# -----------------------------
class JobPriority(enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"
# -----------------------------
# ENUMS
# -----------------------------
class JobStatus(enum.Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


# -----------------------------
# USER MODEL
# -----------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    api_key = Column(String, unique=True, nullable=False)

    # explicitly link to Job
    jobs = relationship("Job", back_populates="user")


# -----------------------------
# JOB MODEL
# -----------------------------
class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    task = Column(String, nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.queued)
    priority = Column(Enum(JobPriority),default=JobPriority.medium)
    retries = Column(Integer, default=0, nullable=False)  # 👈 ADD THIS LINE
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    logs = Column(String, default="", nullable=False)
    result = Column(String, nullable=True)
    
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="jobs")


# -----------------------------
# TASK MODEL
# -----------------------------
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False)
    last_run = Column(DateTime(timezone=True), server_default=func.now())


# -----------------------------
# WORKER MODEL
# -----------------------------
class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, default="idle", nullable=False)
    current_job = Column(String, nullable=True)
    uptime = Column(Integer, default=0)
    last_heartbeat = Column(DateTime, default=func.now(), onupdate=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    event = Column(Text, nullable=False)
    actor = Column(String, default="SYSTEM")
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Anomaly(Base):
    __tablename__ = "anomalies"
    id = Column(Integer, primary_key=True, index=True)
    target = Column(String, index=True)        # 'cpu','memory','queue_delay','job_fail_rate'
    ts = Column(DateTime(timezone=True), server_default=func.now())
    value = Column(Float, nullable=True)
    baseline = Column(Float, nullable=True)
    severity = Column(String, default="medium")
    details = Column(JSON, nullable=True)