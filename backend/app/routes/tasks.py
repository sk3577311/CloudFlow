from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Task

router = APIRouter()

@router.get("/")
def list_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(Task.last_run.desc()).all()

@router.post("/")
def create_task(name: str, type: str, db: Session = Depends(get_db)):
    task = Task(name=name, type=type, status="pending")
    db.add(task)
    db.commit()
    db.refresh(task)
    return task
