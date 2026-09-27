"""FINTRACE application configuration.

All secrets must be configured via .env file (see .env.example).
Do not hard-code real credentials here.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "FINTRACE"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Security — MUST be overridden in production via .env
    SECRET_KEY: str = "change-this-secret-key-before-deploying"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Database — override via DATABASE_URL env var for production
    DATABASE_URL: str = "sqlite:///./fintrace.db"

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    RAW_DATA_DIR: Path = DATA_DIR / "raw"
    PROCESSED_DATA_DIR: Path = DATA_DIR / "processed"
    SYNTHETIC_DATA_DIR: Path = DATA_DIR / "synthetic"
    UPLOAD_DIR: Path = DATA_DIR / "uploads"

    # Dataset defaults
    DEFAULT_SAMPLE_SIZE: int = 50000
    MAX_UPLOAD_SIZE_MB: int = 500

    # Admin defaults — override via DEFAULT_ADMIN_PASSWORD env var
    DEFAULT_ADMIN_USERNAME: str = "admin"
    DEFAULT_ADMIN_PASSWORD: str = "test123"

    # CORS — comma-separated origins or list
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()

# Ensure directories exist
for dir_path in [settings.DATA_DIR, settings.RAW_DATA_DIR, settings.PROCESSED_DATA_DIR,
                 settings.SYNTHETIC_DATA_DIR, settings.UPLOAD_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

