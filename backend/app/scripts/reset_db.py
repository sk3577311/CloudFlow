"""
Reset Database Script for TaskFlow
Drops all existing tables, recreates them, and seeds default data (admin user).
"""

import sys
from pathlib import Path
from passlib.context import CryptContext
import secrets

# Add project root to Python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.database import Base, engine, SessionLocal
from app.models import User, Job, Task, Worker

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def reset_database():
    print("⚠️ Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("🧱 Creating new tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        admin_username = "admin"
        admin_password = "password123"[:72]  # bcrypt max length

        hashed_pw = pwd_context.hash(admin_password)

        # Generate API key for admin
        api_key = secrets.token_hex(16)  # 32-character random key

        admin_user = User(
            username=admin_username,
            password_hash=hashed_pw,
            api_key=api_key
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print(f"✅ Created admin user: {admin_username} / {admin_password}")
        print(f"🔑 Admin API key: {api_key}")
        print("🎉 Database reset and seed complete!")

    except Exception as e:
        print(f"❌ Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    reset_database()
