# app/routes/intelligence_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Anomaly, AuditLog

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])

@router.get("/anomalies")
def list_anomalies(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Anomaly).order_by(Anomaly.ts.desc()).limit(limit).all()

@router.get("/audit")
def list_audit(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
