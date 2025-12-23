"""
Application configuration using Pydantic Settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional
from pathlib import Path
import os

# Identify the root of the monorepo
# Path is: apps/asset-service/app/core/config.py -> need to go up 4 levels
ROOT_DIR = Path(__file__).parent.parent.parent.parent

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database Configuration - MUST be set via environment variables
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "change_me_in_env"
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "tb_erp_db"
    
    # Final Database URL (computed or overridden)
    DATABASE_URL: Optional[str] = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security - MUST be set via environment variables
    JWT_SECRET: str = "change-this-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    
    # Pydantic Settings configuration
    # Try loading from .env in current dir, then in monorepo root
    model_config = SettingsConfigDict(
        env_file=[".env", str(ROOT_DIR / ".env")],
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    def get_database_url(self) -> str:
        """Construct database URL if not provided directly"""
        if self.DATABASE_URL:
            # If it's a standard postgres:// URL, convert to asyncpg
            if self.DATABASE_URL.startswith("postgresql://"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
            return self.DATABASE_URL
            
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
# Update DATABASE_URL if it was not provided or needs protocol fix
settings.DATABASE_URL = settings.get_database_url()
