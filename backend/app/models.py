from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base
import enum


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
    retries = Column(Integer, default=0, nullable=False)  # 👈 ADD THIS LINE
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

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
