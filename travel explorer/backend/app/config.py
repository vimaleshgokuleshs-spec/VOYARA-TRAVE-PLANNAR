from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = BASE_DIR / "backend"
DATA_DIR = BACKEND_DIR / "data"

# Ensure data directory exists for SQLite
DATA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "VOYARA"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # SQLite Database Location
    DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'voyara.db'}"
    
    # Security
    SECRET_KEY: str = "voyara_super_secret_development_key_minimum_32_bytes_long"
    SESSION_COOKIE_NAME: str = "voyara_session"
    SESSION_MAX_AGE: int = 60 * 60 * 24 * 30 # 30 days
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

settings = Settings()
