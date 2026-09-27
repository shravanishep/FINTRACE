"""FINTRACE FastAPI Backend Application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.security import get_password_hash
from app.database.database import init_db, SessionLocal
from app.models.models import User
from app.api import auth, investigations, cases, signals, demo, report

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fintrace")


def create_default_admin():
    """Ensure default admin user exists in DB with valid password hash."""
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == settings.DEFAULT_ADMIN_USERNAME).first()
        hashed_pwd = get_password_hash(settings.DEFAULT_ADMIN_PASSWORD)
        if not admin:
            logger.info("Creating default admin user...")
            admin = User(
                username=settings.DEFAULT_ADMIN_USERNAME,
                password_hash=hashed_pwd,
                role="admin"
            )
            db.add(admin)
            db.commit()
            logger.info("Default admin user created successfully.")
        else:
            # Update password hash to ensure valid bcrypt format
            admin.password_hash = hashed_pwd
            db.commit()
            logger.info("Default admin password hash updated.")
    except Exception as e:
        logger.error(f"Failed to seed admin user: {e}")
    finally:
        db.close()



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup/shutdown."""
    logger.info("Initializing FINTRACE Database...")
    init_db()
    create_default_admin()
    logger.info("FINTRACE Backend ready.")
    yield
    logger.info("FINTRACE Backend shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FINTRACE — Financial Crime & Insider Risk Intelligence Platform API",
    lifespan=lifespan,
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(investigations.router)
app.include_router(cases.router)
app.include_router(signals.router)
app.include_router(demo.router)
app.include_router(report.router)


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
