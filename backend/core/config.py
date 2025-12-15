"""
Application Configuration Module
Centralizes all configuration using pydantic-settings for validation and environment variable support.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Data Configuration
    data_dir: str = r"c:/Users/25919/Desktop/google量化/data"
    reports_dir: str = r"c:/Users/25919/Desktop/google量化/backend/reports"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # CORS Configuration
    cors_origins: str = "*"
    
    # Logging Configuration
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

# Expose settings instance
settings = get_settings()
